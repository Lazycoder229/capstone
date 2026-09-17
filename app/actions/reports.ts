"use server"

import { getDatabase } from "@/lib/database/data-source"
import {
  AppUserEntity,
  CategoryEntity,
  DiscountTypeEntity,
  ExpenseCategoryEntity,
  ExpenseEntity,
  EmployeeEntity,
  MenuItemEntity,
  OrderEntity,
  OrderDiscountEntity,
  OrderItemEntity,
  OrderPromotionEntity,
  PaymentEntity,
  PromotionEntity,
  RestaurantTableEntity,
} from "@/lib/database/entities"
import { toPlainArray } from "@/lib/utils/serialize"
import { In } from "typeorm"

export async function fetchReportsData() {
  try {
    const db = await getDatabase()
    const expenseRepo = db.getRepository(ExpenseEntity)
    const expCatRepo = db.getRepository(ExpenseCategoryEntity)
    const orderRepo = db.getRepository(OrderEntity)
    const orderItemRepo = db.getRepository(OrderItemEntity)
    const menuItemRepo = db.getRepository(MenuItemEntity)
    const categoryRepo = db.getRepository(CategoryEntity)
    const paymentRepo = db.getRepository(PaymentEntity)
    const tableRepo = db.getRepository(RestaurantTableEntity)

    const expenseCategories = await expCatRepo.find({ order: { name: "ASC" } })
    const expenses = await expenseRepo.find({ order: { expenseDate: "DESC" }, take: 50 })

    const catMap = new Map(expenseCategories.map((c) => [c.id, c.name]))

    const formattedExpenses = expenses.map((e) => ({
      ...toPlainArray([e])[0],
      amount: Number(e.amount),
      categoryName: catMap.get(e.categoryId) || "General",
    }))

    const orders = await orderRepo.find({ order: { createdAt: "DESC" }, take: 100 })
    const payments = await paymentRepo.find({ order: { paidAt: "DESC" }, take: 100 })
    const tables = await tableRepo.find()
    const menuItems = await menuItemRepo.find()
    const categories = await categoryRepo.find()
    const users = await db.getRepository(AppUserEntity).find()
    const employees = await db.getRepository(EmployeeEntity).find()
    const tableMap = new Map(tables.map((table) => [table.id, table.tableNumber]))
    const orderMap = new Map(orders.map((order) => [order.id, order]))
    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]))
    const categoryMap = new Map(categories.map((category) => [category.id, category.name]))
    const userMap = new Map(users.map((user) => [user.id, user.name || user.email || "Staff"]))
    const employeeMap = new Map(employees.map((employee) => [employee.userId, employee]))
    const itemCounts = new Map<string, number>()
    const orderItems = orders.length
      ? await orderItemRepo.find({ where: { orderId: In(orders.map((order) => order.id)) } })
      : []
    orderItems.forEach((item) => itemCounts.set(item.orderId, (itemCounts.get(item.orderId) ?? 0) + item.quantity))

    const paymentTotals = new Map<string, { count: number; total: number }>()
    payments.forEach((payment) => {
      const current = paymentTotals.get(payment.paymentMethod) ?? { count: 0, total: 0 }
      current.count += 1
      current.total += Number(payment.amountPaid)
      paymentTotals.set(payment.paymentMethod, current)
    })
    const paymentTotal = payments.reduce((sum, payment) => sum + Number(payment.amountPaid), 0)
    const paymentBreakdown = Array.from(paymentTotals.entries()).map(([method, values]) => ({
      method,
      count: values.count,
      total: values.total,
      percentage: paymentTotal > 0 ? (values.total / paymentTotal) * 100 : 0,
    }))

    const orderTypeTotals = new Map<string, { count: number; total: number }>()
    payments.forEach((payment) => {
      const order = orderMap.get(payment.orderId)
      if (!order) return
      const current = orderTypeTotals.get(order.orderType) ?? { count: 0, total: 0 }
      current.count += 1
      current.total += Number(payment.amountPaid)
      orderTypeTotals.set(order.orderType, current)
    })
    const orderTypeBreakdown = Array.from(orderTypeTotals.entries()).map(([type, values]) => ({
      type,
      count: values.count,
      total: values.total,
      percentage: paymentTotal > 0 ? (values.total / paymentTotal) * 100 : 0,
    }))

    const paidOrderIds = new Set(payments.map((payment) => payment.orderId))
    const paidOrderItems = orderItems.filter((item) => paidOrderIds.has(item.orderId))
    const itemTotals = new Map<string, { quantitySold: number; revenue: number }>()
    const categoryTotals = new Map<string, { quantitySold: number; revenue: number }>()
    paidOrderItems.forEach((item) => {
      const itemTotal = itemTotals.get(item.menuItemId) ?? { quantitySold: 0, revenue: 0 }
      itemTotal.quantitySold += item.quantity
      itemTotal.revenue += Number(item.subtotal)
      itemTotals.set(item.menuItemId, itemTotal)

      const menuItem = menuItemMap.get(item.menuItemId)
      if (menuItem) {
        const categoryTotal = categoryTotals.get(menuItem.categoryId) ?? { quantitySold: 0, revenue: 0 }
        categoryTotal.quantitySold += item.quantity
        categoryTotal.revenue += Number(item.subtotal)
        categoryTotals.set(menuItem.categoryId, categoryTotal)
      }
    })
    const topSellingItems = Array.from(itemTotals.entries())
      .sort(([, first], [, second]) => second.revenue - first.revenue)
      .slice(0, 10)
      .map(([menuItemId, values]) => {
        const item = menuItemMap.get(menuItemId)
        return {
          id: menuItemId,
          name: item?.name || "Menu Item",
          category: item ? categoryMap.get(item.categoryId) || "Uncategorized" : "Uncategorized",
          quantitySold: values.quantitySold,
          revenue: values.revenue,
          trend: "flat",
          trendPercent: 0,
        }
      })
    const categoryRevenue = Array.from(categoryTotals.entries())
      .sort(([, first], [, second]) => second.revenue - first.revenue)
      .map(([categoryId, values]) => ({
        categoryId,
        category: categoryMap.get(categoryId) || "Uncategorized",
        revenue: values.revenue,
        quantitySold: values.quantitySold,
      }))

    const paidOrderIdList = Array.from(paidOrderIds)
    const orderDiscounts = paidOrderIdList.length
      ? await db.getRepository(OrderDiscountEntity).find({ where: { orderId: In(paidOrderIdList) } })
      : []
    const discountTypes = await db.getRepository(DiscountTypeEntity).find()
    const discountTypeMap = new Map(discountTypes.map((discount) => [discount.id, discount.name]))
    const discountTotals = new Map<string, { usageCount: number; totalDiscount: number }>()
    orderDiscounts.forEach((discount) => {
      const current = discountTotals.get(discount.discountTypeId) ?? { usageCount: 0, totalDiscount: 0 }
      current.usageCount += 1
      current.totalDiscount += Number(discount.discountAmount)
      discountTotals.set(discount.discountTypeId, current)
    })
    const discountInsights = Array.from(discountTotals.entries()).map(([discountTypeId, values]) => ({
      typeName: discountTypeMap.get(discountTypeId) || "Discount",
      usageCount: values.usageCount,
      totalDiscount: values.totalDiscount,
      avgPerOrder: values.usageCount > 0 ? values.totalDiscount / values.usageCount : 0,
    }))

    const orderPromotions = paidOrderIdList.length
      ? await db.getRepository(OrderPromotionEntity).find({ where: { orderId: In(paidOrderIdList) } })
      : []
    const promotions = await db.getRepository(PromotionEntity).find()
    const promotionMap = new Map(promotions.map((promotion) => [promotion.id, promotion]))
    const promoTotals = new Map<string, { usageCount: number; totalDiscount: number }>()
    orderPromotions.forEach((promotion) => {
      const current = promoTotals.get(promotion.promotionId) ?? { usageCount: 0, totalDiscount: 0 }
      current.usageCount += 1
      current.totalDiscount += Number(promotion.discountAmount)
      promoTotals.set(promotion.promotionId, current)
    })
    const promoInsights = Array.from(promoTotals.entries()).map(([promotionId, values]) => {
      const promotion = promotionMap.get(promotionId)
      return {
        name: promotion?.name || "Promotion",
        promoType: promotion?.promoType || "fixed_amount",
        usageCount: values.usageCount,
        usageLimit: promotion?.usageLimit ?? null,
        totalDiscount: values.totalDiscount,
        isActive: promotion?.isActive ?? false,
      }
    })

    const staffTotals = new Map<string, { ordersProcessed: number; totalSales: number }>()
    payments.forEach((payment) => {
      const order = orderMap.get(payment.orderId)
      if (!order?.createdByStaffId) return
      const current = staffTotals.get(order.createdByStaffId) ?? { ordersProcessed: 0, totalSales: 0 }
      current.ordersProcessed += 1
      current.totalSales += Number(payment.amountPaid)
      staffTotals.set(order.createdByStaffId, current)
    })
    const staffPerformance = Array.from(staffTotals.entries()).map(([staffId, values]) => ({
      id: staffId,
      name: userMap.get(staffId) || "Staff",
      role: employeeMap.get(staffId)?.position || "Staff",
      ordersProcessed: values.ordersProcessed,
      totalSales: values.totalSales,
      avgHandlingTime: "N/A",
      voidRate: 0,
    }))

    const transactions = payments.flatMap((payment) => {
      const order = orderMap.get(payment.orderId)
      if (!order) return []
      const paidAt = new Date(payment.paidAt)
      return [{
        id: payment.id,
        date: paidAt.toLocaleDateString("en-PH"),
        time: paidAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        orderNumber: order.orderNumber,
        type: order.orderType,
        tableNumber: order.tableId ? tableMap.get(order.tableId) ?? null : null,
        customer: order.customerId ? "Customer" : "Guest Checkout",
        items: itemCounts.get(order.id) ?? 0,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        total: Number(order.total),
        paymentMethod: payment.paymentMethod,
        receiptNumber: payment.receiptNumber,
        staffName: "Staff",
        status: order.status === "cancelled" ? "voided" : "completed",
      }]
    })

    const totalRevenue = paymentTotal
    const totalExpenses = formattedExpenses.reduce((sum, e) => sum + e.amount, 0)
    const netProfit = totalRevenue - totalExpenses
    const totalTransactions = payments.length

    return {
      success: true,
      data: {
        summary: {
          totalRevenue: paymentTotal,
          totalExpenses,
          netProfit,
          totalTransactions,
          profitMargin: totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0,
        },
        expenses: formattedExpenses,
        categories: toPlainArray(expenseCategories),
        paymentBreakdown,
        orderTypeBreakdown,
        transactions,
        topSellingItems,
        categoryRevenue,
        staffPerformance,
        discountInsights,
        promoInsights,
      },
    }
  } catch (error: any) {
    console.error("fetchReportsData error:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch report data",
      data: {
        summary: { totalRevenue: 0, totalExpenses: 0, netProfit: 0, totalTransactions: 0, profitMargin: 0 },
        expenses: [],
        categories: [],
        paymentBreakdown: [],
        orderTypeBreakdown: [],
        transactions: [],
        topSellingItems: [],
        categoryRevenue: [],
        staffPerformance: [],
        discountInsights: [],
        promoInsights: [],
      },
    }
  }
}
