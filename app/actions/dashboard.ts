"use server"

import { getDatabase } from "@/lib/database/data-source"
import {
  InventoryItemEntity,
  OrderEntity,
  OrderStatus,
  PaymentEntity,
  ReservationEntity,
  RestaurantTableEntity,
  RestaurantTableStatus,
} from "@/lib/database/entities"

export async function fetchDashboardMetrics() {
  try {
    const db = await getDatabase()
    const orderRepo = db.getRepository(OrderEntity)
    const paymentRepo = db.getRepository(PaymentEntity)
    const tableRepo = db.getRepository(RestaurantTableEntity)
    const resRepo = db.getRepository(ReservationEntity)
    const invRepo = db.getRepository(InventoryItemEntity)

    const ordersCount = await orderRepo.count()
    const qrOrdersCount = await orderRepo.count({ where: { orderType: "qr" as any } })
    const activeOrders = await orderRepo.find({
      order: { createdAt: "DESC" },
      take: 10,
    })

    const payments = await paymentRepo.find({ take: 50 })
    const totalPaymentsToday = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0)

    const totalTables = await tableRepo.count()
    const occupiedTables = await tableRepo.count({ where: { status: RestaurantTableStatus.OCCUPIED } })

    const reservationsToday = await resRepo.count()

    const lowStockItems = await invRepo
      .createQueryBuilder("item")
      .where("CAST(item.stockQuantity AS DECIMAL) <= CAST(item.reorderThreshold AS DECIMAL)")
      .take(5)
      .getMany()

    return {
      success: true,
      data: {
        metrics: [
          {
            label: "Orders today",
            value: String(ordersCount),
            trend: "Live count",
            trendUp: null,
          },
          {
            label: "Payments today",
            value: `₱${totalPaymentsToday.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            trend: "Live sales",
            trendUp: null,
          },
          {
            label: "Occupied tables",
            value: `${occupiedTables} / ${totalTables}`,
            trend: totalTables > 0 ? `${Math.round((occupiedTables / totalTables) * 100)}% capacity` : "No tables configured",
            trendUp: null,
          },
          {
            label: "Reservations today",
            value: String(reservationsToday),
            trend: "Live bookings",
            trendUp: null,
          },
          {
            label: "QR orders",
            value: String(qrOrdersCount),
            trend: "Live count",
            trendUp: null,
          },
        ],
        activeOrders: activeOrders.map((o) => ({
          id: o.orderNumber,
          source: o.orderType.toUpperCase(),
          table: o.tableId ? "Table" : "Counter",
          items: "Order items",
          total: `₱${Number(o.total).toFixed(2)}`,
          status: o.status,
          time: new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })),
        lowStockCount: lowStockItems.length,
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
