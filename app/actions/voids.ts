"use server"

import {
  createOrderVoidSchema,
  createSafeAction,
  resolveOrderVoidSchema,
  type CreateOrderVoidInput,
  type ResolveOrderVoidInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import {
  InventoryItemEntity,
  InventoryStockLogEntity,
  MenuItemEntity,
  MenuItemIngredientEntity,
  OrderEntity,
  OrderItemEntity,
  OrderStatus,
  OrderVoidEntity,
  StockItemType,
  StockLogType,
  SystemSettingEntity,
  VoidStatus,
} from "@/lib/database/entities"

export async function fetchVoids() {
  try {
    const db = await getDatabase()
    const voidRepo = db.getRepository(OrderVoidEntity)
    const orderRepo = db.getRepository(OrderEntity)

    const voids = await voidRepo.find({
      order: { requestedAt: "DESC" },
      take: 50,
    })

    const allOrders = await orderRepo.find()
    const orderMap = new Map(allOrders.map((o) => [o.id, o]))

    const result = voids.map((v) => {
      const order = orderMap.get(v.orderId)
      return {
        id: v.id,
        orderId: v.orderId,
        orderNumber: order?.orderNumber || "",
        amount: Number(order?.total || 0),
        reason: v.reason,
        resolutionNotes: v.resolutionNotes,
        status: v.status,
        requestedBy: "Cashier Staff",
        requestedAt: new Date(v.requestedAt).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        resolvedAt: v.resolvedAt
          ? new Date(v.resolvedAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
      }
    })

    return { success: true, data: result }
  } catch (error: any) {
    console.error("fetchVoids error:", error)
    return { success: false, error: error.message || "Failed to fetch voids", data: [] }
  }
}

async function restoreOrderStock(
  db: any,
  orderId: string,
  orderNumber: string,
  staffId: string
) {
  const itemRepo = db.getRepository(OrderItemEntity)
  const menuRepo = db.getRepository(MenuItemEntity)
  const invRepo = db.getRepository(InventoryItemEntity)
  const stockLogRepo = db.getRepository(InventoryStockLogEntity)
  const ingredientRepo = db.getRepository(MenuItemIngredientEntity)

  const orderItems = await itemRepo.find({ where: { orderId } })
  for (const item of orderItems) {
    const menuItem = await menuRepo.findOne({ where: { id: item.menuItemId } })
    if (menuItem) {
      if (menuItem.stockQuantity !== null) {
        const currentStock = Number(menuItem.stockQuantity)
        const newStock = currentStock + item.quantity
        menuItem.stockQuantity = newStock
        if (newStock > 0) menuItem.isAvailable = true
        await menuRepo.save(menuItem)

        const menuLog = stockLogRepo.create({
          id: crypto.randomUUID(),
          itemType: StockItemType.MENU_ITEM,
          menuItemId: menuItem.id,
          type: StockLogType.ADJUSTMENT,
          quantityChange: String(item.quantity),
          quantityAfter: String(newStock),
          note: `Restocked from voided order ${orderNumber} (+${item.quantity})`,
          performedByStaffId: staffId || "system",
        })
        await stockLogRepo.save(menuLog)
      }

      const recipeIngredients = await ingredientRepo.find({
        where: { menuItemId: menuItem.id },
      })
      for (const ing of recipeIngredients) {
        const invItem = await invRepo.findOne({ where: { id: ing.inventoryItemId } })
        if (invItem) {
          const qtyRestored = Number(ing.quantityUsed || 0) * item.quantity
          const currentInvStock = Number(invItem.stockQuantity || 0)
          const newInvStock = currentInvStock + qtyRestored
          invItem.stockQuantity = String(newInvStock)
          await invRepo.save(invItem)

          const ingLog = stockLogRepo.create({
            id: crypto.randomUUID(),
            itemType: StockItemType.INGREDIENT,
            inventoryItemId: invItem.id,
            menuItemId: menuItem.id,
            type: StockLogType.ADJUSTMENT,
            quantityChange: String(qtyRestored),
            quantityAfter: String(newInvStock),
            note: `Restocked ingredients from voided order ${orderNumber}`,
            performedByStaffId: staffId || "system",
          })
          await stockLogRepo.save(ingLog)
        }
      }
    }
  }
}

export const createVoidAction = createSafeAction(
  createOrderVoidSchema,
  async (input: CreateOrderVoidInput) => {
    const db = await getDatabase()
    const voidRepo = db.getRepository(OrderVoidEntity)
    const orderRepo = db.getRepository(OrderEntity)
    const settingsRepo = db.getRepository(SystemSettingEntity)

    const settings = await settingsRepo.findOne({ where: {} })
    const requiresManagerApproval = settings ? Boolean(settings.managerApprovalForVoids) : true

    const voidReq = voidRepo.create({
      id: crypto.randomUUID(),
      orderId: input.orderId,
      requestedByStaffId: input.requestedByStaffId,
      reason: input.reason,
      status: requiresManagerApproval ? VoidStatus.PENDING : VoidStatus.APPROVED,
      resolvedAt: requiresManagerApproval ? null : new Date(),
      resolutionNotes: requiresManagerApproval ? null : "Auto-approved per system configuration (manager approval disabled).",
    })

    await voidRepo.save(voidReq)

    if (!requiresManagerApproval) {
      const order = await orderRepo.findOne({ where: { id: input.orderId } })
      if (order) {
        order.status = OrderStatus.CANCELLED
        await orderRepo.save(order)
        await restoreOrderStock(db, order.id, order.orderNumber, input.requestedByStaffId)
      }
      return { voidId: voidReq.id, message: "Order voided and restocked immediately per system policy." }
    }

    return { voidId: voidReq.id, message: "Void request submitted for manager approval." }
  }
)

export const resolveVoidAction = createSafeAction(
  resolveOrderVoidSchema,
  async (input: ResolveOrderVoidInput) => {
    const db = await getDatabase()
    const voidRepo = db.getRepository(OrderVoidEntity)
    const orderRepo = db.getRepository(OrderEntity)

    const voidReq = await voidRepo.findOne({ where: { id: input.voidId } })
    if (!voidReq) throw new Error("Void request not found.")

    if (input.status === "rejected" && !input.resolutionNotes?.trim()) {
      throw new Error("A rejection reason is required.")
    }

    voidReq.status = input.status as VoidStatus
    voidReq.approvedByStaffId = input.approvedByStaffId
    voidReq.resolutionNotes = input.resolutionNotes?.trim() || null
    voidReq.resolvedAt = new Date()
    await voidRepo.save(voidReq)

    // If approved, mark order as cancelled and restore stock
    if (input.status === "approved") {
      const order = await orderRepo.findOne({ where: { id: voidReq.orderId } })
      if (order) {
        order.status = OrderStatus.CANCELLED
        await orderRepo.save(order)
        await restoreOrderStock(db, order.id, order.orderNumber, input.approvedByStaffId || "manager")
      }
    }

    return {
      voidId: voidReq.id,
      status: voidReq.status,
      message: `Void request has been ${input.status}.`,
    }
  }
)
