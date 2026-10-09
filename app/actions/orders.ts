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
  DiscountTypeEntity,
  InventoryItemEntity,
  InventoryStockLogEntity,
  MenuItemEntity,
  MenuItemIngredientEntity,
  OrderDiscountEntity,
  OrderEntity,
  OrderItemEntity,
  OrderPromotionEntity,
  OrderStatus,
  OrderStatusHistoryEntity,
  OrderType,
  OrderVoidEntity,
  PaymentEntity,
  PromotionEntity,
  PromotionItemEntity,
  PromotionType,
  RestaurantTableEntity,
  RestaurantTableStatus,
  StockItemType,
  StockLogType,
  SystemSettingEntity,
} from "@/lib/database/entities"
import { In } from "typeorm"
import { toPlain } from "@/lib/utils/serialize"

export async function fetchOrders() {
  try {
    const db = await getDatabase()
    const orderRepo = db.getRepository(OrderEntity)
    const itemRepo = db.getRepository(OrderItemEntity)
    const tableRepo = db.getRepository(RestaurantTableEntity)
    const menuItemRepo = db.getRepository(MenuItemEntity)
    const orderDiscountRepo = db.getRepository(OrderDiscountEntity)
    const orderPromoRepo = db.getRepository(OrderPromotionEntity)
    const discountTypeRepo = db.getRepository(DiscountTypeEntity)
    const promoRepo = db.getRepository(PromotionEntity)

    const orders = await orderRepo.find({
      order: { createdAt: "DESC" },
      take: 50,
    })

    if (orders.length === 0) {
      return { success: true, data: [] }
    }

    const orderIds = orders.map((o) => o.id)

    // Parallel fetch for associated relations
    const [allTables, allMenuItems, allOrderItems, allOrderDiscounts, allOrderPromos, allDiscountTypes, allPromos] =
      await Promise.all([
        tableRepo.find(),
        menuItemRepo.find(),
        itemRepo.find({ where: { orderId: In(orderIds) } }),
        orderDiscountRepo.find({ where: { orderId: In(orderIds) } }),
        orderPromoRepo.find({ where: { orderId: In(orderIds) } }),
        discountTypeRepo.find(),
        promoRepo.find(),
      ])

    const tableMap = new Map(allTables.map((t) => [t.id, t.tableNumber]))
    const menuNameMap = new Map(allMenuItems.map((m) => [m.id, m.name]))
    const discountTypeMap = new Map(allDiscountTypes.map((d) => [d.id, d]))
    const promoMap = new Map(allPromos.map((p) => [p.id, p]))

    // Map items, discounts, and promos by orderId
    const itemsByOrder = new Map<string, typeof allOrderItems>()
    for (const item of allOrderItems) {
      const list = itemsByOrder.get(item.orderId) || []
      list.push(item)
      itemsByOrder.set(item.orderId, list)
    }

    const discountByOrder = new Map<string, typeof allOrderDiscounts[0]>()
    for (const od of allOrderDiscounts) {
      discountByOrder.set(od.orderId, od)
    }

    const promoByOrder = new Map<string, typeof allOrderPromos[0]>()
    for (const op of allOrderPromos) {
      promoByOrder.set(op.orderId, op)
    }

    const result = orders.map((o) => {
      const items = itemsByOrder.get(o.id) || []
      const orderDiscount = discountByOrder.get(o.id)
      const orderPromo = promoByOrder.get(o.id)

      const discountTypeObj = orderDiscount ? discountTypeMap.get(orderDiscount.discountTypeId) : null
      const promoObj = orderPromo ? promoMap.get(orderPromo.promotionId) : null

      return {
        ...toPlain(o),
        table: o.tableId ? tableMap.get(o.tableId) || "Table" : "Counter",
        source: o.orderType === OrderType.QR ? "QR" : "Counter",
        customer: orderDiscount?.holderName || "Guest Checkout",
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        tax: Number(o.tax),
        total: Number(o.total),
        appliedDiscount: orderDiscount
          ? {
              id: orderDiscount.id,
              discountTypeId: orderDiscount.discountTypeId,
              name: discountTypeObj?.name || "Discount",
              percentage: discountTypeObj ? Number(discountTypeObj.percentage) : 0,
              amount: Number(orderDiscount.discountAmount),
              holderName: orderDiscount.holderName,
              idNumber: orderDiscount.idNumber,
            }
          : null,
        appliedPromotion: orderPromo
          ? {
              id: orderPromo.id,
              promotionId: orderPromo.promotionId,
              name: promoObj?.name || "Promotion",
              amount: Number(orderPromo.discountAmount),
            }
          : null,
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
      const orderDiscountRepo = manager.getRepository(OrderDiscountEntity)
      const orderPromoRepo = manager.getRepository(OrderPromotionEntity)

      // Fetch System Settings configuration
      const settings = await manager.getRepository(SystemSettingEntity).findOne({ where: {} })

      // Enforce table selection requirement if enabled
      if (settings?.requireTableSelection && !input.tableId && input.orderType !== OrderType.COUNTER) {
        throw new Error("Table selection is required by system configuration.")
      }

      // Handle table lock and reservation check
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
          throw new Error(`${table.tableNumber} is already occupied.`)
        }

        table.status = RestaurantTableStatus.OCCUPIED
        await manager.getRepository(RestaurantTableEntity).save(table)
      }

      // Compute items subtotal
      const subtotal = input.items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0)

      // 1. Resolve and calculate Discount Type (e.g. Senior/PWD, Regular, Custom)
      let typeDiscountAmount = 0
      let resolvedDiscountType: DiscountTypeEntity | null = null

      if (input.discountTypeId) {
        const discountRepo = manager.getRepository(DiscountTypeEntity)
        resolvedDiscountType = await discountRepo.findOne({
          where: { id: input.discountTypeId, isActive: true },
        })
        if (resolvedDiscountType) {
          const isSeniorPwd =
            resolvedDiscountType.name.toLowerCase().includes("senior") ||
            resolvedDiscountType.name.toLowerCase().includes("pwd")
          if (isSeniorPwd && settings && !settings.seniorPwdDiscountEnabled) {
            throw new Error("Senior/PWD discounts are currently disabled in system settings.")
          }
          const pct = Number(resolvedDiscountType.percentage || 0)
          typeDiscountAmount = Number(((subtotal * pct) / 100).toFixed(2))
        }
      }

      // 2. Resolve and calculate Promotion (e.g. Percentage, Fixed Amount, Buy X Get Y)
      let promoDiscountAmount = 0
      let resolvedPromo: PromotionEntity | null = null

      if (input.promotionId) {
        const promoRepo = manager.getRepository(PromotionEntity)
        const promoItemRepo = manager.getRepository(PromotionItemEntity)
        resolvedPromo = await promoRepo.findOne({
          where: { id: input.promotionId, isActive: true },
        })

        if (resolvedPromo) {
          const todayStr = new Date().toISOString().split("T")[0]
          const isDateValid =
            (!resolvedPromo.startDate || resolvedPromo.startDate <= todayStr) &&
            (!resolvedPromo.endDate || resolvedPromo.endDate >= todayStr)
          const minSpend = Number(resolvedPromo.minSpend || 0)

          if (isDateValid && subtotal >= minSpend) {
            // Check if promo applies to specific menu items only
            const promoItems = await promoItemRepo.find({
              where: { promotionId: resolvedPromo.id },
            })

            let eligibleSubtotal = subtotal
            if (promoItems.length > 0) {
              const eligibleItemIds = new Set(promoItems.map((pi) => pi.menuItemId))
              eligibleSubtotal = input.items
                .filter((item) => eligibleItemIds.has(item.menuItemId))
                .reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0)
            }

            if (eligibleSubtotal > 0) {
              if (resolvedPromo.promoType === PromotionType.PERCENTAGE) {
                const pct = Number(resolvedPromo.discountValue || 0)
                promoDiscountAmount = Number(((eligibleSubtotal * pct) / 100).toFixed(2))
              } else if (resolvedPromo.promoType === PromotionType.FIXED_AMOUNT) {
                const val = Number(resolvedPromo.discountValue || 0)
                promoDiscountAmount = Math.min(eligibleSubtotal, val)
              } else if (resolvedPromo.promoType === PromotionType.BUY_X_GET_Y) {
                const val = Number(resolvedPromo.discountValue || 0)
                promoDiscountAmount = Math.min(eligibleSubtotal, val)
              }
            }
          }
        }
      }

      // Combine all discounts
      const totalDiscount = Math.min(
        subtotal,
        typeDiscountAmount +
          promoDiscountAmount +
          (Number(input.discount || 0) > 0 && !input.discountTypeId && !input.promotionId
            ? Number(input.discount)
            : 0)
      )

      // Service charge calculation from System Settings
      const serviceChargeRate = settings ? Number(settings.serviceChargeRate || 0) : 0
      const serviceChargeEnabled = settings ? Boolean(settings.serviceChargeEnabled) : false
      const netAfterDiscount = Math.max(0, subtotal - totalDiscount)
      let serviceCharge = 0
      if (serviceChargeEnabled && serviceChargeRate > 0) {
        serviceCharge = Number((netAfterDiscount * (serviceChargeRate / 100)).toFixed(2))
      }

      // Resolve VAT settings from SystemSettingEntity
      const vatRate = settings ? Number(settings.vatRate || 12) : 12
      const vatEnabled = settings ? Boolean(settings.vatEnabled) : true
      const vatInclusive = settings ? Boolean(settings.vatInclusive) : true

      let tax = 0
      let total = netAfterDiscount + serviceCharge

      if (vatEnabled) {
        if (vatInclusive) {
          tax = Number((netAfterDiscount * (vatRate / (100 + vatRate))).toFixed(2))
          total = netAfterDiscount + serviceCharge
        } else {
          tax = Number((netAfterDiscount * (vatRate / 100)).toFixed(2))
          total = netAfterDiscount + serviceCharge + tax
        }
      }

      const prefix = settings?.orderNumberPrefix || "ORD-"
      const suffix = Date.now().toString().slice(-4) + Math.floor(100 + Math.random() * 900)
      const orderNumber = `${prefix}${suffix}`

      const initialStatus =
        input.orderType === OrderType.QR && settings?.autoAcceptQrOrders
          ? OrderStatus.PREPARING
          : OrderStatus.PENDING

      // Create Order
      const order = orderRepo.create({
        id: crypto.randomUUID(),
        orderNumber,
        tableId: input.tableId ?? null,
        customerId: input.customerId ?? null,
        orderType: input.orderType as OrderType,
        status: initialStatus,
        subtotal: String(subtotal),
        discount: String(totalDiscount),
        tax: String(tax),
        total: String(total),
        createdByStaffId: input.createdByStaffId ?? null,
      })

      await orderRepo.save(order)

      // Save Order Items
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

      // Auto-deduct inventory & menu item stock, and record stock logs
      const menuRepo = manager.getRepository(MenuItemEntity)
      const invRepo = manager.getRepository(InventoryItemEntity)
      const stockLogRepo = manager.getRepository(InventoryStockLogEntity)
      const ingredientRepo = manager.getRepository(MenuItemIngredientEntity)

      for (const item of input.items) {
        // 1. Deduct direct menu item stock if managed
        const menuItem = await menuRepo.findOne({ where: { id: item.menuItemId } })
        if (menuItem) {
          if (menuItem.stockQuantity !== null) {
            const currentStock = Number(menuItem.stockQuantity)
            const newStock = Math.max(0, currentStock - item.quantity)
            menuItem.stockQuantity = newStock
            if (newStock === 0) {
              menuItem.isAvailable = false
            }
            await menuRepo.save(menuItem)

            // Record menu stock log
            const menuLog = stockLogRepo.create({
              id: crypto.randomUUID(),
              itemType: StockItemType.MENU_ITEM,
              menuItemId: menuItem.id,
              type: StockLogType.CONSUMED,
              quantityChange: String(-item.quantity),
              quantityAfter: String(newStock),
              note: `Customer purchase - Order ${order.orderNumber} (${item.quantity} sold)`,
              performedByStaffId: input.createdByStaffId || "system",
            })
            await stockLogRepo.save(menuLog)
          }

          // 2. Deduct recipe ingredients if configured
          const recipeIngredients = await ingredientRepo.find({
            where: { menuItemId: menuItem.id },
          })

          for (const ing of recipeIngredients) {
            const invItem = await invRepo.findOne({ where: { id: ing.inventoryItemId } })
            if (invItem) {
              const qtyUsed = Number(ing.quantityUsed || 0) * item.quantity
              const currentInvStock = Number(invItem.stockQuantity || 0)
              const newInvStock = Math.max(0, currentInvStock - qtyUsed)
              invItem.stockQuantity = String(newInvStock)
              await invRepo.save(invItem)

              // Record ingredient consumption log
              const ingLog = stockLogRepo.create({
                id: crypto.randomUUID(),
                itemType: StockItemType.INGREDIENT,
                inventoryItemId: invItem.id,
                menuItemId: menuItem.id,
                type: StockLogType.CONSUMED,
                quantityChange: String(-qtyUsed),
                quantityAfter: String(newInvStock),
                note: `Recipe ingredient for ${menuItem.name} - Order ${order.orderNumber} (${item.quantity} orders)`,
                performedByStaffId: input.createdByStaffId || "system",
              })
              await stockLogRepo.save(ingLog)
            }
          }
        }
      }

      // Save applied Discount Type record
      if (resolvedDiscountType && typeDiscountAmount > 0) {
        const orderDiscount = orderDiscountRepo.create({
          id: crypto.randomUUID(),
          orderId: order.id,
          discountTypeId: resolvedDiscountType.id,
          idNumber: input.discountIdNumber || null,
          holderName: input.discountHolderName || "Customer",
          discountAmount: String(typeDiscountAmount),
          appliedByStaffId: input.createdByStaffId || "system",
        })
        await orderDiscountRepo.save(orderDiscount)
      }

      // Save applied Promotion record & increment usage count
      if (resolvedPromo && promoDiscountAmount > 0) {
        const orderPromo = orderPromoRepo.create({
          id: crypto.randomUUID(),
          orderId: order.id,
          promotionId: resolvedPromo.id,
          discountAmount: String(promoDiscountAmount),
        })
        await orderPromoRepo.save(orderPromo)

        resolvedPromo.usageCount = (resolvedPromo.usageCount || 0) + 1
        await manager.getRepository(PromotionEntity).save(resolvedPromo)
      }

      // Save Status History
      await statusRepo.save(
        statusRepo.create({
          id: crypto.randomUUID(),
          orderId: order.id,
          status: OrderStatus.PENDING,
          changedByStaffId: input.createdByStaffId ?? null,
        })
      )

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        subtotal,
        discount: totalDiscount,
        tax,
        total,
        message: "Order placed successfully.",
      }
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

      // If order is cancelled, restore inventory and menu item stock
      if (input.status === OrderStatus.CANCELLED) {
        const itemRepo = manager.getRepository(OrderItemEntity)
        const menuRepo = manager.getRepository(MenuItemEntity)
        const invRepo = manager.getRepository(InventoryItemEntity)
        const stockLogRepo = manager.getRepository(InventoryStockLogEntity)
        const ingredientRepo = manager.getRepository(MenuItemIngredientEntity)

        const orderItems = await itemRepo.find({ where: { orderId: order.id } })
        for (const item of orderItems) {
          const menuItem = await menuRepo.findOne({ where: { id: item.menuItemId } })
          if (menuItem) {
            if (menuItem.stockQuantity !== null) {
              const currentStock = Number(menuItem.stockQuantity)
              const newStock = currentStock + item.quantity
              menuItem.stockQuantity = newStock
              if (newStock > 0) {
                menuItem.isAvailable = true
              }
              await menuRepo.save(menuItem)

              const menuLog = stockLogRepo.create({
                id: crypto.randomUUID(),
                itemType: StockItemType.MENU_ITEM,
                menuItemId: menuItem.id,
                type: StockLogType.ADJUSTMENT,
                quantityChange: String(item.quantity),
                quantityAfter: String(newStock),
                note: `Restocked from cancelled order ${order.orderNumber} (+${item.quantity})`,
                performedByStaffId: input.changedByStaffId || "system",
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
                  note: `Restocked ingredients from cancelled order ${order.orderNumber}`,
                  performedByStaffId: input.changedByStaffId || "system",
                })
                await stockLogRepo.save(ingLog)
              }
            }
          }
        }
      }

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
      await manager.getRepository(OrderDiscountEntity).delete({ orderId })
      await manager.getRepository(OrderPromotionEntity).delete({ orderId })
      await manager.getRepository(OrderItemEntity).delete({ orderId })
      await orderRepo.delete(orderId)
    })

    return { success: true, message: "Order deleted successfully." }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete order." }
  }
}
