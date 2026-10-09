"use server"

import { getDatabase } from "@/lib/database/data-source"
import {
  InventoryItemEntity,
  MenuItemEntity,
  OrderEntity,
  OrderItemEntity,
  OrderStatus,
  OrderType,
  OrderVoidEntity,
  PaymentEntity,
  ReservationEntity,
  RestaurantTableEntity,
  RestaurantTableStatus,
  SystemSettingEntity,
  VoidStatus,
} from "@/lib/database/entities"
import { In } from "typeorm"

export type TopSellingItem = {
  id: string
  name: string
  quantitySold: number
  revenue: number
  formattedRevenue: string
}

export type DashboardReservation = {
  id: string
  customerName: string
  contactNumber: string
  tableName: string
  reservationDate: string
  reservationTime: string
  numberOfGuests: number
  status: string
}

export type DashboardActiveOrder = {
  id: string
  orderNumber: string
  source: string
  tableName: string
  itemCount: number
  total: string
  status: string
  time: string
  createdAt: string
}

export type DashboardAlert = {
  id: string
  type: "warning" | "danger" | "info"
  title: string
  description: string
  href?: string
}

export type PaymentMethodStat = {
  method: string
  label: string
  count: number
  total: number
  percentage: number
}

export type DashboardData = {
  kpis: {
    revenue: {
      amount: number
      formatted: string
      trendText: string
      trendUp: boolean
    }
    averageOrderValue: {
      amount: number
      formatted: string
      subtitle: string
    }
    orders: {
      total: number
      active: number
      completed: number
      cancelled: number
      fulfillmentRate: number
      subtitle: string
    }
    tables: {
      occupied: number
      total: number
      rate: number
      subtitle: string
    }
    channelSplit: {
      qrCount: number
      counterCount: number
      qrPercentage: number
      counterPercentage: number
      subtitle: string
    }
    pendingActions: {
      pendingVoids: number
      pendingReservations: number
      lowStockCount: number
    }
  }
  paymentMethods: PaymentMethodStat[]
  orderStatusCounts: {
    pending: number
    preparing: number
    ready: number
    served: number
    completed: number
    cancelled: number
  }
  topSellingItems: TopSellingItem[]
  activeOrders: DashboardActiveOrder[]
  todayReservations: DashboardReservation[]
  lowStockItems: Array<{
    id: string
    name: string
    stockQuantity: number
    reorderThreshold: number
    unit: string
  }>
  alerts: DashboardAlert[]
  // Backward compatibility with previous schema
  metrics: Array<{
    label: string
    value: string
    trend: string
    trendUp: boolean | null
  }>
  lowStockCount: number
  systemConfig: {
    restaurantName: string
    branchName: string
    currencySymbol: string
    currencyCode: string
    timezone: string
    vatRate: number
    vatInclusive: boolean
    serviceChargeEnabled: boolean
    serviceChargeRate: number
    lowStockThresholdAlert: number
  }
}

export async function fetchDashboardMetrics(): Promise<{
  success: boolean
  data: DashboardData | null
  error?: string
}> {
  try {
    const db = await getDatabase()
    const orderRepo = db.getRepository(OrderEntity)
    const orderItemRepo = db.getRepository(OrderItemEntity)
    const menuItemRepo = db.getRepository(MenuItemEntity)
    const paymentRepo = db.getRepository(PaymentEntity)
    const tableRepo = db.getRepository(RestaurantTableEntity)
    const resRepo = db.getRepository(ReservationEntity)
    const invRepo = db.getRepository(InventoryItemEntity)
    const voidRepo = db.getRepository(OrderVoidEntity)
    const settingsRepo = db.getRepository(SystemSettingEntity)

    // 0. Fetch System Settings configuration
    const settings = await settingsRepo.findOne({ where: {} })
    const currencySymbol = settings?.currencySymbol || "₱"
    const lowStockThreshold = settings ? Number(settings.lowStockThresholdAlert ?? 10) : 10

    // 1. Fetch Orders
    const allOrders = await orderRepo.find({
      order: { createdAt: "DESC" },
      take: 100,
    })

    const totalOrdersCount = await orderRepo.count()
    const qrOrdersCount = await orderRepo.count({ where: { orderType: OrderType.QR } })
    const counterOrdersCount = totalOrdersCount - qrOrdersCount

    const orderStatusCounts = {
      pending: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      completed: 0,
      cancelled: 0,
    }

    allOrders.forEach((order) => {
      if (order.status in orderStatusCounts) {
        orderStatusCounts[order.status as keyof typeof orderStatusCounts] += 1
      }
    })

    // 2. Fetch Payments & Revenue
    const payments = await paymentRepo.find({
      order: { paidAt: "DESC" },
      take: 200,
    })

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0)
    const avgOrderValue = payments.length > 0 ? totalRevenue / payments.length : 0

    // Payment method breakdown
    const paymentMap = new Map<string, { count: number; total: number }>()
    payments.forEach((p) => {
      const key = (p.paymentMethod || "other").toLowerCase()
      const existing = paymentMap.get(key) || { count: 0, total: 0 }
      existing.count += 1
      existing.total += Number(p.amountPaid || 0)
      paymentMap.set(key, existing)
    })

    const methodLabels: Record<string, string> = {
      cash: "Cash",
      gcash: "GCash",
      maya: "Maya",
      card: "Credit / Debit Card",
      other: "Other",
    }

    const paymentMethods: PaymentMethodStat[] = Array.from(paymentMap.entries()).map(([method, val]) => ({
      method,
      label: methodLabels[method] || method.toUpperCase(),
      count: val.count,
      total: val.total,
      percentage: totalRevenue > 0 ? Math.round((val.total / totalRevenue) * 100) : 0,
    })).sort((a, b) => b.total - a.total)

    // 3. Tables & Capacity
    const tables = await tableRepo.find()
    const totalTables = tables.length
    const occupiedTables = tables.filter((t) => t.status === RestaurantTableStatus.OCCUPIED).length
    const tableMap = new Map(tables.map((t) => [t.id, t.tableNumber]))
    const tableOccupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0

    // 4. Reservations
    const rawReservations = await resRepo.find({
      order: { reservationDate: "DESC", reservationTime: "ASC" },
      take: 8,
    })

    const pendingReservationsCount = await resRepo.count({
      where: { status: "pending" as any },
    })

    const todayReservations: DashboardReservation[] = rawReservations.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      contactNumber: r.contactNumber,
      tableName: r.tableId ? tableMap.get(r.tableId) ? `Table ${tableMap.get(r.tableId)}` : "Assigned" : "Unassigned",
      reservationDate: String(r.reservationDate),
      reservationTime: String(r.reservationTime).slice(0, 5),
      numberOfGuests: r.numberOfGuests,
      status: r.status,
    }))

    // 5. Pending Voids
    const pendingVoidsCount = await voidRepo.count({
      where: { status: VoidStatus.PENDING },
    })

    // 6. Inventory Low Stock
    const lowStockEntities = await invRepo
      .createQueryBuilder("item")
      .where("CAST(item.stockQuantity AS DECIMAL) <= COALESCE(CAST(item.reorderThreshold AS DECIMAL), :defaultThreshold)", {
        defaultThreshold: lowStockThreshold,
      })
      .take(6)
      .getMany()

    const lowStockItems = lowStockEntities.map((i) => ({
      id: i.id,
      name: i.name,
      stockQuantity: Number(i.stockQuantity),
      reorderThreshold: Number(i.reorderThreshold ?? lowStockThreshold),
      unit: i.unit,
    }))

    // 7. Top Selling Menu Items
    let topSellingItems: TopSellingItem[] = []
    try {
      const recentOrderIds = allOrders.slice(0, 50).map((o) => o.id)
      if (recentOrderIds.length > 0) {
        const orderItems = await orderItemRepo.find({
          where: { orderId: In(recentOrderIds) },
        })

        const itemSales = new Map<string, { qty: number; revenue: number }>()
        orderItems.forEach((oi) => {
          const current = itemSales.get(oi.menuItemId) || { qty: 0, revenue: 0 }
          current.qty += Number(oi.quantity || 1)
          current.revenue += Number(oi.subtotal || 0)
          itemSales.set(oi.menuItemId, current)
        })

        const sortedItemIds = Array.from(itemSales.entries())
          .sort((a, b) => b[1].qty - a[1].qty)
          .slice(0, 5)

        if (sortedItemIds.length > 0) {
          const menuItems = await menuItemRepo.find({
            where: { id: In(sortedItemIds.map(([id]) => id)) },
          })
          const menuMap = new Map(menuItems.map((m) => [m.id, m.name]))

          topSellingItems = sortedItemIds.map(([id, stats]) => ({
            id,
            name: menuMap.get(id) || "Special Dish",
            quantitySold: stats.qty,
            revenue: stats.revenue,
            formattedRevenue: `${currencySymbol}${stats.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
          }))
        }
      }
    } catch (e) {
      console.warn("Could not calculate top selling items:", e)
    }

    // 8. Active Orders List (Live kitchen & counter feed)
    const activeOrdersList = allOrders.slice(0, 8).map((o) => {
      const tableLabel = o.tableId
        ? tableMap.get(o.tableId)
          ? `Table ${tableMap.get(o.tableId)}`
          : "Table"
        : "Counter / Takeout"

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        source: o.orderType.toUpperCase(),
        tableName: tableLabel,
        itemCount: 1,
        total: `${currencySymbol}${Number(o.total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        status: o.status,
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAt: new Date(o.createdAt).toISOString(),
      }
    })

    // 9. Operational Alerts
    const alerts: DashboardAlert[] = []
    if (pendingVoidsCount > 0) {
      alerts.push({
        id: "voids",
        type: "danger",
        title: `${pendingVoidsCount} Pending Order Void${pendingVoidsCount > 1 ? "s" : ""}`,
        description: "Manager approval required to finalize order cancellations.",
        href: "/admin/voids",
      })
    }

    if (lowStockItems.length > 0) {
      alerts.push({
        id: "inventory",
        type: "warning",
        title: `${lowStockItems.length} Low Stock Alert${lowStockItems.length > 1 ? "s" : ""}`,
        description: `${lowStockItems.map((i) => i.name).slice(0, 3).join(", ")} ${lowStockItems.length > 3 ? "and more" : ""} below reorder threshold.`,
        href: "/admin/inventory",
      })
    }

    if (pendingReservationsCount > 0) {
      alerts.push({
        id: "reservations",
        type: "info",
        title: `${pendingReservationsCount} Unconfirmed Reservation${pendingReservationsCount > 1 ? "s" : ""}`,
        description: "Guests awaiting booking confirmation.",
        href: "/admin/reservations",
      })
    }

    // Fulfillment Rate
    const completedOrdersCount = orderStatusCounts.completed
    const fulfillmentRate = totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 0
    const qrPercentage = totalOrdersCount > 0 ? Math.round((qrOrdersCount / totalOrdersCount) * 100) : 0
    const counterPercentage = 100 - qrPercentage

    // Backward-compatible metrics array
    const metrics = [
      {
        label: "Gross Revenue",
        value: `${currencySymbol}${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        trend: `${payments.length} transactions recorded`,
        trendUp: true,
      },
      {
        label: "Avg Order Value",
        value: `${currencySymbol}${avgOrderValue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        trend: "Per paid order",
        trendUp: true,
      },
      {
        label: "Total Orders",
        value: String(totalOrdersCount),
        trend: `${orderStatusCounts.pending + orderStatusCounts.preparing + orderStatusCounts.ready} in kitchen queue`,
        trendUp: null,
      },
      {
        label: "Floor Occupancy",
        value: `${occupiedTables} / ${totalTables}`,
        trend: totalTables > 0 ? `${tableOccupancyRate}% occupied` : "No tables set",
        trendUp: tableOccupancyRate > 75,
      },
      {
        label: "QR Ordering Share",
        value: `${qrPercentage}%`,
        trend: `${qrOrdersCount} QR vs ${counterOrdersCount} POS`,
        trendUp: qrPercentage > 50,
      },
    ]

    return {
      success: true,
      data: {
        kpis: {
          revenue: {
            amount: totalRevenue,
            formatted: `${currencySymbol}${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            trendText: `Based on ${payments.length} recorded payments`,
            trendUp: true,
          },
          averageOrderValue: {
            amount: avgOrderValue,
            formatted: `${currencySymbol}${avgOrderValue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            subtitle: "Average ticket size",
          },
          orders: {
            total: totalOrdersCount,
            active: orderStatusCounts.pending + orderStatusCounts.preparing + orderStatusCounts.ready,
            completed: completedOrdersCount,
            cancelled: orderStatusCounts.cancelled,
            fulfillmentRate,
            subtitle: `${fulfillmentRate}% fulfillment rate`,
          },
          tables: {
            occupied: occupiedTables,
            total: totalTables,
            rate: tableOccupancyRate,
            subtitle: `${totalTables - occupiedTables} tables available`,
          },
          channelSplit: {
            qrCount: qrOrdersCount,
            counterCount: counterOrdersCount,
            qrPercentage,
            counterPercentage,
            subtitle: `${qrPercentage}% contactless share`,
          },
          pendingActions: {
            pendingVoids: pendingVoidsCount,
            pendingReservations: pendingReservationsCount,
            lowStockCount: lowStockItems.length,
          },
        },
        paymentMethods,
        orderStatusCounts,
        topSellingItems,
        activeOrders: activeOrdersList,
        todayReservations,
        lowStockItems,
        alerts,
        metrics,
        lowStockCount: lowStockItems.length,
        systemConfig: {
          restaurantName: settings?.restaurantName || "PRIME Roast & Grill",
          branchName: settings?.branchName || "Main Branch - Manila",
          currencySymbol: currencySymbol,
          currencyCode: settings?.currencyCode || "PHP",
          timezone: settings?.timezone || "Asia/Manila",
          vatRate: settings ? Number(settings.vatRate) : 12,
          vatInclusive: settings ? Boolean(settings.vatInclusive) : true,
          serviceChargeEnabled: settings ? Boolean(settings.serviceChargeEnabled) : false,
          serviceChargeRate: settings ? Number(settings.serviceChargeRate) : 5,
          lowStockThresholdAlert: lowStockThreshold,
        },
      },
    }
  } catch (error: any) {
    console.error("fetchDashboardMetrics error:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch metrics",
      data: null,
    }
  }
}
