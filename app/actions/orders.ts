"use server"

import {
  createOrderSchema,
  createSafeAction,
  updateOrderStatusSchema,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import {
  MenuItemEntity,
  OrderEntity,
  OrderItemEntity,
  OrderStatus,
  OrderStatusHistoryEntity,
  OrderType,
  OrderVoidEntity,
  PaymentEntity,
  RestaurantTableEntity,
  RestaurantTableStatus,
} from "@/lib/database/entities"
import { In } from "typeorm"
import { toPlain } from "@/lib/utils/serialize"

export async function fetchOrders() {
  try {
    const db = await getDatabase()
    const orderRepo = db.getRepository(OrderEntity)
    const itemRepo = db.getRepository(OrderItemEntity)
    const tableRepo = db.getRepository(RestaurantTableEntity)

    const orders = await orderRepo.find({
      order: { createdAt: "DESC" },
      take: 50,
    })

    // Fetch items, tables, and menu items for name resolution
    const allTables = await tableRepo.find()
    const tableMap = new Map(allTables.map((t) => [t.id, t.tableNumber]))

    const menuItemRepo = db.getRepository(MenuItemEntity)
    const allMenuItems = await menuItemRepo.find()
    const menuNameMap = new Map(allMenuItems.map((m) => [m.id, m.name]))

    const result = await Promise.all(
      orders.map(async (o) => {
        const items = await itemRepo.find({ where: { orderId: o.id } })
        return {
          ...toPlain(o),
          table: o.tableId ? tableMap.get(o.tableId) || "Table" : "Counter",
          source: o.orderType === OrderType.QR ? "QR" : "Counter",
          customer: "Guest Checkout",
          time: new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          subtotal: Number(o.subtotal),
          discount: Number(o.discount),
          tax: Number(o.tax),
          total: Number(o.total),
          items: items.map((i) => ({
            id: i.id,
            menuItemId: i.menuItemId,
            name: menuNameMap.get(i.menuItemId) || "Menu Item",
            quantity: i.quantity,
            price: Number(i.unitPrice),
            subtotal: Number(i.subtotal),
            notes: i.notes,
          })),
        }
      })
    )

    return { success: true, data: result }
  } catch (error: any) {
    console.error("fetchOrders error:", error)
    return { success: false, error: error.message || "Failed to fetch orders", data: [] }
  }
}

export const createOrderAction = createSafeAction(
  createOrderSchema,
  async (input: CreateOrderInput) => {
    const db = await getDatabase()
    return db.transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity)
      const itemRepo = manager.getRepository(OrderItemEntity)
      const statusRepo = manager.getRepository(OrderStatusHistoryEntity)

      if (input.tableId) {
        const table = await manager
          .getRepository(RestaurantTableEntity)
          .createQueryBuilder("table")
          .where("table.id = :tableId", { tableId: input.tableId })
          .setLock("pessimistic_write")
          .getOne()

        if (!table) throw new Error("Table not found.")
        const activeOrders = await manager.getRepository(OrderEntity).count({
          where: {
            tableId: input.tableId,
            status: In([OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED]),
          },
        })
        if (table.status !== RestaurantTableStatus.AVAILABLE || activeOrders > 0) {
          throw new Error(`${table.tableNumber} is already taken.`)
        }

        table.status = RestaurantTableStatus.OCCUPIED
        await manager.getRepository(RestaurantTableEntity).save(table)
      }

      const subtotal = input.items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0)
      const discount = Number(input.discount || 0)
      const tax = Number(((subtotal - discount) * 0.12).toFixed(2))
      const total = subtotal - discount + tax

      const suffix = Date.now().toString().slice(-4) + Math.floor(100 + Math.random() * 900)
      const orderNumber = `ORD-${suffix}`

      const order = orderRepo.create({
        id: crypto.randomUUID(),
        orderNumber,
        tableId: input.tableId ?? null,
        customerId: input.customerId ?? null,
        orderType: input.orderType as OrderType,
        status: OrderStatus.PENDING,
        subtotal: String(subtotal),
        discount: String(discount),
        tax: String(tax),
        total: String(total),
        createdByStaffId: input.createdByStaffId ?? null,
      })

      await orderRepo.save(order)

      const orderItems = input.items.map((item) =>
        itemRepo.create({
          id: crypto.randomUUID(),
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          subtotal: String(item.quantity * Number(item.unitPrice)),
          notes: item.notes ?? null,
        })
      )

      await itemRepo.save(orderItems)
      await statusRepo.save(
        statusRepo.create({
          id: crypto.randomUUID(),
          orderId: order.id,
          status: OrderStatus.PENDING,
          changedByStaffId: input.createdByStaffId ?? null,
        })
      )

      return { orderId: order.id, orderNumber: order.orderNumber, message: "Order placed successfully." }
    })
  }
)

export const updateOrderStatusAction = createSafeAction(
  updateOrderStatusSchema,
  async (input: UpdateOrderStatusInput) => {
    const db = await getDatabase()
    return db.transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity)
      const historyRepo = manager.getRepository(OrderStatusHistoryEntity)
      const order = await orderRepo.findOne({ where: { id: input.orderId } })
      if (!order) throw new Error("Order not found.")

      order.status = input.status as OrderStatus
      await orderRepo.save(order)

      await historyRepo.save(
        historyRepo.create({
          id: crypto.randomUUID(),
          orderId: order.id,
          status: input.status,
          changedByStaffId: input.changedByStaffId ?? null,
        })
      )

      if (order.tableId) {
        const tableRepo = manager.getRepository(RestaurantTableEntity)
        const table = await tableRepo.findOne({ where: { id: order.tableId } })
        if (table && table.status === RestaurantTableStatus.OCCUPIED) {
          const activeOrders = await orderRepo.count({
            where: {
              tableId: order.tableId,
              status: In([OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED]),
            },
          })
          if (activeOrders === 0) {
            table.status = RestaurantTableStatus.AVAILABLE
            await tableRepo.save(table)
          }
        }
      }

      return { orderId: order.id, status: order.status, message: `Order status updated to ${order.status}.` }
    })
  }
)

export async function deleteOrderAction(orderId: string) {
  try {
    const db = await getDatabase()
    await db.transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity)
      const order = await orderRepo.findOne({ where: { id: orderId } })
      if (!order) throw new Error("Order not found.")

      if (order.tableId) {
        const tableRepo = manager.getRepository(RestaurantTableEntity)
        const table = await tableRepo.findOne({ where: { id: order.tableId } })
        if (table && table.status === RestaurantTableStatus.OCCUPIED) {
          table.status = RestaurantTableStatus.AVAILABLE
          await tableRepo.save(table)
        }
      }

      await manager.getRepository(PaymentEntity).delete({ orderId })
      await manager.getRepository(OrderVoidEntity).delete({ orderId })
      await manager.getRepository(OrderStatusHistoryEntity).delete({ orderId })
      await manager.getRepository(OrderItemEntity).delete({ orderId })
      await orderRepo.delete(orderId)
    })

    return { success: true, message: "Order deleted successfully." }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete order." }
  }
}
