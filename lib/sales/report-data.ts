import { getInitializedDataSource } from "@/lib/database/data-source"
import { Branch } from "@/lib/database/entities/entities/Branch"
import { Order } from "@/lib/database/entities/entities/Order"
import { OrderItem } from "@/lib/database/entities/entities/OrderItem"
import { Payment } from "@/lib/database/entities/entities/Payment"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import {
  salesReportDateSchema,
  type SalesReportRange,
} from "@/lib/validations/reports"

export type SalesReportData = {
  restaurant: {
    name: string
    branch: string
    address: string
    contactNumber: string
    email: string
    tin: string | null
  }
  range: SalesReportRange
  summary: {
    sales: number
    orders: number
    averageOrder: number
    discounts: number
    tax: number
    paymentsCollected: number
  }
  daily: Array<{ date: string; label: string; sales: number; orders: number }>
  topItems: Array<{ name: string; quantity: number; sales: number }>
  payments: Array<{ method: string; count: number; amount: number }>
  statuses: Array<{ status: string; count: number }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    createdAt: string
    status: string
    orderType: string
    tableNumber: string | null
    total: number
    discount: number
    tax: number
    paymentMethod: string | null
    paymentStatus: string
  }>
}

const num = (value: unknown) => Number(value ?? 0) || 0
const dateKey = (date: Date) => date.toISOString().slice(0, 10)
const addDays = (value: string, amount: number) => {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return dateKey(date)
}
const formatDay = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`))

export function defaultSalesReportRange(now = new Date()): SalesReportRange {
  const today = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).format(now)
  return { start: addDays(today, -29), end: today }
}

export function parseSalesReportRange(
  input: Partial<SalesReportRange>,
  fallback = defaultSalesReportRange()
): SalesReportRange {
  const parsed = salesReportDateSchema.safeParse(input)
  if (!parsed.success || parsed.data.start > parsed.data.end) return fallback
  const days =
    (Date.parse(`${parsed.data.end}T00:00:00Z`) -
      Date.parse(`${parsed.data.start}T00:00:00Z`)) /
      86_400_000 +
    1
  if (days > 366) return fallback
  return parsed.data
}

export async function getSalesReportData(
  requestedRange: Partial<SalesReportRange>,
  options: { includeAllOrders?: boolean } = {}
): Promise<SalesReportData> {
  const range = parseSalesReportRange(requestedRange)
  const endExclusive = `${addDays(range.end, 1)} 00:00:00`
  const startInclusive = `${range.start} 00:00:00`
  const source = await getInitializedDataSource()
  const orderRepository = source.getRepository(Order)
  const paymentRepository = source.getRepository(Payment)
  const ordersQuery = orderRepository
    .createQueryBuilder("order")
    .leftJoinAndSelect("order.table", "table")
    .where("order.createdAt >= :start AND order.createdAt < :end", {
      start: startInclusive,
      end: endExclusive,
    })
    .orderBy("order.createdAt", "DESC")
  if (!options.includeAllOrders) ordersQuery.take(30)

  const [
    summaryRows,
    dailyRows,
    itemRows,
    paymentRows,
    statusRows,
    recent,
    setting,
    mainBranch,
  ] = await Promise.all([
    orderRepository
      .createQueryBuilder("order")
      .select("COUNT(*)", "orders")
      .addSelect("COALESCE(SUM(order.total), 0)", "sales")
      .addSelect("COALESCE(SUM(order.discount), 0)", "discounts")
      .addSelect("COALESCE(SUM(order.tax), 0)", "tax")
      .where("order.status = :status", { status: "completed" })
      .andWhere("order.createdAt >= :start AND order.createdAt < :end", {
        start: startInclusive,
        end: endExclusive,
      })
      .getRawOne(),
    orderRepository
      .createQueryBuilder("order")
      .select("DATE(order.createdAt)", "date")
      .addSelect("COUNT(*)", "orders")
      .addSelect("COALESCE(SUM(order.total), 0)", "sales")
      .where("order.status = :status", { status: "completed" })
      .andWhere("order.createdAt >= :start AND order.createdAt < :end", {
        start: startInclusive,
        end: endExclusive,
      })
      .groupBy("DATE(order.createdAt)")
      .orderBy("DATE(order.createdAt)", "ASC")
      .getRawMany(),
    source
      .getRepository(OrderItem)
      .createQueryBuilder("item")
      .innerJoin("item.order", "order")
      .innerJoin("item.menuItem", "menuItem")
      .select("menuItem.name", "name")
      .addSelect("SUM(item.quantity)", "quantity")
      .addSelect("COALESCE(SUM(item.subtotal), 0)", "sales")
      .where("order.status = :status", { status: "completed" })
      .andWhere("order.createdAt >= :start AND order.createdAt < :end", {
        start: startInclusive,
        end: endExclusive,
      })
      .groupBy("item.menuItemId")
      .addGroupBy("menuItem.name")
      .orderBy("sales", "DESC")
      .limit(10)
      .getRawMany(),
    paymentRepository
      .createQueryBuilder("payment")
      .select("payment.paymentMethod", "method")
      .addSelect("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(payment.amountPaid), 0)", "amount")
      .where("payment.paidAt >= :start AND payment.paidAt < :end", {
        start: startInclusive,
        end: endExclusive,
      })
      .groupBy("payment.paymentMethod")
      .orderBy("amount", "DESC")
      .getRawMany(),
    orderRepository
      .createQueryBuilder("order")
      .select("order.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("order.createdAt >= :start AND order.createdAt < :end", {
        start: startInclusive,
        end: endExclusive,
      })
      .groupBy("order.status")
      .orderBy("count", "DESC")
      .getRawMany(),
    ordersQuery.getMany(),
    source.getRepository(SystemSetting).findOne({
      where: {},
      select: {
        id: true,
        restaurantName: true,
        branchName: true,
        address: true,
        contactNumber: true,
        email: true,
        tinNumber: true,
      },
    }),
    source.getRepository(Branch).findOne({
      where: { isMain: true },
      select: {
        id: true,
        name: true,
        address: true,
        contactNumber: true,
        email: true,
      },
    }),
  ])

  const dailyMap = new Map<string, { sales: number; orders: number }>(
    dailyRows.map((row: Record<string, unknown>) => [
      String(row.date).slice(0, 10),
      { sales: num(row.sales), orders: num(row.orders) },
    ])
  )
  const daily: SalesReportData["daily"] = []
  for (let day = range.start; day <= range.end; day = addDays(day, 1)) {
    const value = dailyMap.get(day) ?? { sales: 0, orders: 0 }
    daily.push({ date: day, label: formatDay(day), ...value })
  }

  const sales = num(summaryRows?.sales)
  const orderCount = num(summaryRows?.orders)
  return {
    restaurant: {
      name: setting?.restaurantName?.trim() || "Restaurant",
      branch: mainBranch?.name?.trim() || setting?.branchName?.trim() || "",
      address: mainBranch?.address?.trim() || setting?.address?.trim() || "",
      contactNumber:
        mainBranch?.contactNumber?.trim() ||
        setting?.contactNumber?.trim() ||
        "",
      email: mainBranch?.email?.trim() || setting?.email?.trim() || "",
      tin: setting?.tinNumber?.trim() || null,
    },
    range,
    summary: {
      sales,
      orders: orderCount,
      averageOrder: orderCount > 0 ? sales / orderCount : 0,
      discounts: num(summaryRows?.discounts),
      tax: num(summaryRows?.tax),
      paymentsCollected: paymentRows.reduce(
        (total: number, row: Record<string, unknown>) =>
          total + num(row.amount),
        0
      ),
    },
    daily,
    topItems: itemRows.map((row: Record<string, unknown>) => ({
      name: String(row.name ?? "Menu item"),
      quantity: num(row.quantity),
      sales: num(row.sales),
    })),
    payments: paymentRows.map((row: Record<string, unknown>) => ({
      method: String(row.method ?? "other"),
      count: num(row.count),
      amount: num(row.amount),
    })),
    statuses: statusRows.map((row: Record<string, unknown>) => ({
      status: String(row.status ?? "unknown"),
      count: num(row.count),
    })),
    recentOrders: recent.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      orderType: order.orderType,
      tableNumber: order.table?.tableNumber ?? null,
      total: Number(order.total),
      discount: Number(order.discount),
      tax: Number(order.tax),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    })),
  }
}
