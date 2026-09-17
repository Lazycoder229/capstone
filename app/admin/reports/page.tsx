"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  BadgePercent,
  BarChart3,
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Flame,
  Minus,
  Package,
  Pencil,
  Percent,
  PieChart,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Utensils,
  Wallet,
  X,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

import { fetchReportsData } from "@/app/actions/reports"
import { createExpenseAction } from "@/app/actions/expenses"

// ---------------------------------------------------------------------------
// Types — sourced from orders, payments, payroll, discounts, promotions,
//         inventory, and voids tables in dbdesign.md
// ---------------------------------------------------------------------------

type PaymentMethod = "cash" | "gcash" | "card" | "other"
type OrderType = "qr" | "counter"
type ReportTab = "sales" | "expenses" | "insights" | "transactions"
type DateRange = "today" | "yesterday" | "7d" | "30d" | "this_month" | "last_month" | "custom"

interface DailySalesPoint {
  date: string
  label: string
  revenue: number
  orders: number
  avgOrderValue: number
}

interface PaymentBreakdown {
  method: PaymentMethod
  count: number
  total: number
  percentage: number
}

interface OrderTypeBreakdown {
  type: OrderType
  count: number
  total: number
  percentage: number
}

interface TopSellingItem {
  id: string
  name: string
  category: string
  quantitySold: number
  revenue: number
  trend: "up" | "down" | "flat"
  trendPercent: number
}

interface StaffPerformance {
  id: string
  name: string
  role: string
  ordersProcessed: number
  totalSales: number
  avgHandlingTime: string
  voidRate: number
}

interface ExpenseCategoryOption {
  id: string
  name: string
  color: string
}

interface ExpenseRecord {
  id: string
  categoryId: string
  description: string
  amount: number
  expenseDate: string
  receiptReference: string | null
  notes: string | null
  recordedByStaffId: string
  recordedByStaffName: string
  createdAt: string
}

type ExpenseFormValues = Omit<ExpenseRecord, "id" | "createdAt" | "recordedByStaffId" | "recordedByStaffName">

interface TransactionRecord {
  id: string
  date: string
  time: string
  orderNumber: string
  type: OrderType
  tableNumber: string | null
  customer: string
  items: number
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  receiptNumber: string
  staffName: string
  status: "completed" | "voided" | "refunded"
}

interface DiscountInsight {
  typeName: string
  usageCount: number
  totalDiscount: number
  avgPerOrder: number
}

interface PromoInsight {
  name: string
  promoType: "percentage" | "fixed_amount" | "buy_x_get_y"
  usageCount: number
  usageLimit: number | null
  totalDiscount: number
  isActive: boolean
}

interface CategoryRevenue {
  categoryId: string
  category: string
  revenue: number
  quantitySold: number
}

const DAILY_SALES: DailySalesPoint[] = []

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPeso(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}K`
  return formatPeso(n)
}

const paymentMethodLabels: Record<PaymentMethod, string> = { cash: "Cash", gcash: "GCash", card: "Card", other: "Other" }
const paymentMethodColors: Record<PaymentMethod, string> = {
  cash: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  gcash: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  card: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  other: "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/30",
}

const paymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="size-3.5" />,
  gcash: <Smartphone className="size-3.5" />,
  card: <CreditCard className="size-3.5" />,
  other: <Wallet className="size-3.5" />,
}

const dateRangeLabels: Record<DateRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  this_month: "This month",
  last_month: "Last month",
  custom: "Custom range",
}

const PAGE_SIZE = 8
const EXPENSE_PAGE_SIZE = 10

// ---------------------------------------------------------------------------
// Chart helpers (CSS-based bar chart — no external deps)
// ---------------------------------------------------------------------------

function MiniBarChart({ data, maxVal }: { data: DailySalesPoint[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-1.5 h-32 w-full">
      {data.map((d) => {
        const pct = maxVal > 0 ? (d.revenue / maxVal) * 100 : 0
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1.5 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-neutral-700">
              <div className="font-semibold">{d.label}</div>
              <div>{formatPeso(d.revenue)}</div>
              <div className="text-neutral-400">{d.orders} orders</div>
            </div>
            <div
              className="w-full rounded-t-sm bg-gradient-to-t from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-400 transition-all duration-300 group-hover:from-amber-400 group-hover:to-amber-300 min-h-[4px]"
              style={{ height: `${pct}%` }}
            />
            <span className="text-[9px] text-muted-foreground font-medium leading-none">{d.label.split(" ")[1]}</span>
          </div>
        )
      })}
    </div>
  )
}

function DonutSegment({ percentage, color, label, amount }: { percentage: number; color: string; label: string; amount: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`size-2.5 rounded-full ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{label}</div>
      </div>
      <div className="text-xs font-semibold tabular-nums">{amount}</div>
      <div className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">{percentage.toFixed(1)}%</div>
    </div>
  )
}

function HorizontalBar({ label, value, maxValue, color, amount }: { label: string; value: number; maxValue: number; color: string; amount: string }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium truncate max-w-[180px]">{label}</span>
        <span className="font-semibold tabular-nums">{amount}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("sales")
  const [dateRange, setDateRange] = useState<DateRange>("7d")
  const [search, setSearch] = useState("")

  // Transactions tab state
  const [txPage, setTxPage] = useState(1)
  const [txStatusFilter, setTxStatusFilter] = useState("all")
  const [txPaymentFilter, setTxPaymentFilter] = useState("all")

  // Expenses state & CRUD
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryOption[]>([])
  const [reportSummary, setReportSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTransactions: 0,
    profitMargin: 0,
  })
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([])
  const [orderTypeBreakdown, setOrderTypeBreakdown] = useState<OrderTypeBreakdown[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([])
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([])
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([])
  const [discountInsights, setDiscountInsights] = useState<DiscountInsight[]>([])
  const [promoInsights, setPromoInsights] = useState<PromoInsight[]>([])
  const [expensePage, setExpensePage] = useState(1)
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null)
  const [expenseSearch, setExpenseSearch] = useState("")
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all")
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [expenseForm, setExpenseForm] = useState<ExpenseFormValues>({
    categoryId: "",
    description: "",
    amount: 0,
    expenseDate: new Date().toISOString().split("T")[0],
    receiptReference: "",
    notes: "",
  })
  const [expenseFormErrors, setExpenseFormErrors] = useState<Record<string, string>>({})

  // Detail sheet
  const [detailTx, setDetailTx] = useState<TransactionRecord | null>(null)

  useEffect(() => {
    const loadReports = async () => {
      const result = await fetchReportsData()
      if (!result.success) {
        toast.error(result.error)
        return
      }

      setReportSummary(result.data.summary)
      setPaymentBreakdown(result.data.paymentBreakdown as PaymentBreakdown[])
      setOrderTypeBreakdown(result.data.orderTypeBreakdown as OrderTypeBreakdown[])
      setTransactions(result.data.transactions as TransactionRecord[])
      setTopSellingItems(result.data.topSellingItems as TopSellingItem[])
      setCategoryRevenue(result.data.categoryRevenue as CategoryRevenue[])
      setStaffPerformance(result.data.staffPerformance as StaffPerformance[])
      setDiscountInsights(result.data.discountInsights as DiscountInsight[])
      setPromoInsights(result.data.promoInsights as PromoInsight[])
      setExpenses(
        result.data.expenses.map((expense) => ({
          id: expense.id,
          categoryId: expense.categoryId,
          description: expense.description,
          amount: expense.amount,
          expenseDate: expense.expenseDate,
          receiptReference: expense.receiptReference,
          notes: expense.notes,
          recordedByStaffId: expense.recordedByStaffId,
          recordedByStaffName: "Staff",
          createdAt: String(expense.createdAt || expense.expenseDate),
        }))
      )
      setExpenseCategories(
        result.data.categories.map((category, index) => ({
          id: category.id,
          name: category.name,
          color: ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#6b7280"][index % 5],
        }))
      )
    }

    void loadReports()
  }, [])

  // ---------------------------------------------------------------------------
  // Handlers — Expenses CRUD
  // ---------------------------------------------------------------------------
  const handleOpenAddExpense = () => {
    setEditingExpense(null)
    setExpenseForm({
      categoryId: "",
      description: "",
      amount: 0,
      expenseDate: new Date().toISOString().split("T")[0],
      receiptReference: "",
      notes: "",
    })
    setExpenseFormErrors({})
    setIsExpenseSheetOpen(true)
  }

  const handleOpenEditExpense = (record: ExpenseRecord) => {
    setEditingExpense(record)
    setExpenseForm({
      categoryId: record.categoryId,
      description: record.description,
      amount: record.amount,
      expenseDate: record.expenseDate,
      receiptReference: record.receiptReference || "",
      notes: record.notes || "",
    })
    setExpenseFormErrors({})
    setIsExpenseSheetOpen(true)
  }

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!expenseForm.description.trim()) {
      errors.description = "Description is required"
    }
    if (!expenseForm.amount || expenseForm.amount <= 0) {
      errors.amount = "Amount must be greater than 0"
    }
    if (!expenseForm.expenseDate) {
      errors.expenseDate = "Date is required"
    }
    if (Object.keys(errors).length > 0) {
      setExpenseFormErrors(errors)
      return
    }

    if (editingExpense) {
      setExpenses((prev) =>
        prev.map((item) =>
          item.id === editingExpense.id
            ? {
                ...item,
                categoryId: expenseForm.categoryId,
                description: expenseForm.description.trim(),
                amount: Number(expenseForm.amount),
                expenseDate: expenseForm.expenseDate,
                receiptReference: expenseForm.receiptReference?.trim() || null,
                notes: expenseForm.notes?.trim() || null,
              }
            : item
        )
      )
      toast.info("Expense changes are local only; expense updates are not supported by the current backend contract.")
    } else {
      const result = await createExpenseAction({
        categoryId: expenseForm.categoryId,
        description: expenseForm.description.trim(),
        amount: Number(expenseForm.amount),
        expenseDate: expenseForm.expenseDate,
        receiptReference: expenseForm.receiptReference?.trim() || undefined,
        notes: expenseForm.notes?.trim() || undefined,
        recordedByStaffId: crypto.randomUUID(),
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      const refreshed = await fetchReportsData()
      if (!refreshed.success) {
        toast.error(refreshed.error)
        return
      }
      setReportSummary(refreshed.data.summary)
      setExpenses(refreshed.data.expenses.map((expense) => ({
        id: expense.id,
        categoryId: expense.categoryId,
        description: expense.description,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        receiptReference: expense.receiptReference,
        notes: expense.notes,
        recordedByStaffId: expense.recordedByStaffId,
        recordedByStaffName: "Staff",
        createdAt: String(expense.createdAt || expense.expenseDate),
      })))
      setExpensePage(1)
      toast.success(result.data.message)
    }

    setIsExpenseSheetOpen(false)
  }

  const handleConfirmDeleteExpense = () => {
    if (!deletingExpenseId) return
    setExpenses((prev) => {
      const next = prev.filter((item) => item.id !== deletingExpenseId)
      const newTotalPages = Math.max(1, Math.ceil(next.length / EXPENSE_PAGE_SIZE))
      setExpensePage((curr) => Math.min(curr, newTotalPages))
      return next
    })
    setDeletingExpenseId(null)
    toast.info("Expense removed locally; expense deletion is not supported by the current backend contract.")
  }

  // ---------------------------------------------------------------------------
  // Computed — Sales
  // ---------------------------------------------------------------------------
  const salesSummary = useMemo(() => {
    const totalRevenue = reportSummary.totalRevenue
    const totalOrders = reportSummary.totalTransactions
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const totalDiscounts = discountInsights.reduce((s, d) => s + d.totalDiscount, 0) + promoInsights.reduce((s, p) => s + p.totalDiscount, 0)
    const totalVoids = transactions.filter((t) => t.status === "voided").reduce((s, t) => s + t.total, 0)
    const completedTx = transactions.filter((t) => t.status === "completed")
    const totalTax = completedTx.reduce((s, t) => s + t.tax, 0)
    return { totalRevenue, totalOrders, avgOrderValue, totalDiscounts, totalVoids, totalTax }
  }, [reportSummary, transactions, discountInsights, promoInsights])

  const maxDailyRevenue = useMemo(() => Math.max(...DAILY_SALES.map((d) => d.revenue)), [])

  // ---------------------------------------------------------------------------
  // Computed — Expenses
  // ---------------------------------------------------------------------------
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])
  const netProfit = useMemo(() => salesSummary.totalRevenue - totalExpenses, [salesSummary.totalRevenue, totalExpenses])
  const profitMargin = useMemo(() => (salesSummary.totalRevenue > 0 ? (netProfit / salesSummary.totalRevenue) * 100 : 0), [netProfit, salesSummary.totalRevenue])

  const expenseCategoriesSummary = useMemo(() => {
    return expenseCategories.map((cat) => {
      const items = expenses.filter((e) => e.categoryId === cat.id)
      const amount = items.reduce((s, i) => s + i.amount, 0)
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      return {
        category: cat.name,
        categoryId: cat.id,
        amount,
        percentage: Math.round(percentage * 10) / 10,
        color: cat.color,
        items: items.map((i) => ({ label: i.description, amount: i.amount })),
      }
    })
  }, [expenseCategories, expenses, totalExpenses])

  const maxCategoryExpense = useMemo(() => Math.max(...expenseCategoriesSummary.map((c) => c.amount), 1), [expenseCategoriesSummary])

  const filteredExpenses = useMemo(() => {
    let list = [...expenses]
    if (expenseCategoryFilter !== "all") {
      list = list.filter((e) => e.categoryId === expenseCategoryFilter)
    }
    if (expenseSearch.trim()) {
      const q = expenseSearch.toLowerCase()
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          (e.receiptReference && e.receiptReference.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.recordedByStaffName.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
  }, [expenses, expenseCategoryFilter, expenseSearch])

  const expenseTotalPages = Math.max(1, Math.ceil(filteredExpenses.length / EXPENSE_PAGE_SIZE))
  const paginatedExpenses = useMemo(() => {
    return filteredExpenses.slice((expensePage - 1) * EXPENSE_PAGE_SIZE, expensePage * EXPENSE_PAGE_SIZE)
  }, [filteredExpenses, expensePage])

  // ---------------------------------------------------------------------------
  // Computed — Transactions
  // ---------------------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    let list = [...transactions]
    if (txStatusFilter !== "all") list = list.filter((t) => t.status === txStatusFilter)
    if (txPaymentFilter !== "all") list = list.filter((t) => t.paymentMethod === txPaymentFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.orderNumber.toLowerCase().includes(q) ||
          t.customer.toLowerCase().includes(q) ||
          t.receiptNumber.toLowerCase().includes(q) ||
          t.staffName.toLowerCase().includes(q)
      )
    }
    return list
  }, [transactions, txStatusFilter, txPaymentFilter, search])

  const txTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const paginatedTx = filteredTransactions.slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden pb-16 sm:pb-8">
      <Toaster richColors position="top-right" />
      <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Sales performance, expenses, and business insights.
            </p>
          </div>

          {/* Date range selector */}
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[180px] h-10 text-sm">
                <Calendar className="size-3.5 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(dateRangeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="h-10 gap-2 text-xs font-medium">
              <Download className="size-3.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Tab Bar */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ReportTab); setTxPage(1); setSearch("") }}>
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex h-auto p-1">
            <TabsTrigger value="sales" className="gap-1.5 text-xs sm:text-sm py-2">
              <BarChart3 className="size-3.5 hidden sm:block" />Sales
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1.5 text-xs sm:text-sm py-2">
              <Wallet className="size-3.5 hidden sm:block" />Expenses
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1.5 text-xs sm:text-sm py-2">
              <PieChart className="size-3.5 hidden sm:block" />Insights
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-1.5 text-xs sm:text-sm py-2">
              <Receipt className="size-3.5 hidden sm:block" />Transactions
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ================================================================= */}
        {/*  SALES TAB                                                         */}
        {/* ================================================================= */}
        {activeTab === "sales" && (
          <div className="space-y-4">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Total Revenue", value: formatCompact(salesSummary.totalRevenue), icon: DollarSign, trend: "No comparison data", up: null as boolean | null, color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Total Orders", value: salesSummary.totalOrders.toString(), icon: ShoppingBag, trend: "No comparison data", up: null as boolean | null, color: "text-amber-600 dark:text-amber-400" },
                { label: "Avg Order Value", value: formatPeso(salesSummary.avgOrderValue), icon: Receipt, trend: "No comparison data", up: null as boolean | null, color: "text-sky-600 dark:text-sky-400" },
                { label: "Discounts Given", value: formatCompact(salesSummary.totalDiscounts), icon: BadgePercent, trend: "—", up: null as boolean | null, color: "text-orange-600 dark:text-orange-400" },
                { label: "Voids / Refunds", value: formatCompact(salesSummary.totalVoids), icon: XCircle, trend: "No comparison data", up: null as boolean | null, color: "text-rose-600 dark:text-rose-400" },
                { label: "Tax Collected", value: formatCompact(salesSummary.totalTax), icon: FileText, trend: "No comparison data", up: null as boolean | null, color: "text-violet-600 dark:text-violet-400" },
              ].map((m) => (
                <Card key={m.label} className="border bg-card shadow-xs">
                  <CardContent className="p-3 sm:p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{m.label}</span>
                      <m.icon className={`size-3.5 sm:size-4 ${m.color}`} />
                    </div>
                    <div className="text-lg sm:text-xl font-bold tracking-tight">{m.value}</div>
                    <div className={`text-[10px] sm:text-xs font-medium ${m.up === true ? "text-emerald-600 dark:text-emerald-400" : m.up === false ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                      {m.up === true && <TrendingUp className="size-3 inline mr-0.5" />}
                      {m.up === false && <TrendingDown className="size-3 inline mr-0.5" />}
                      {m.trend}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Daily Revenue Chart */}
              <Card className="lg:col-span-2 border bg-card shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="size-4 text-amber-500" />
                    Daily Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <MiniBarChart data={DAILY_SALES} maxVal={maxDailyRevenue} />
                  {DAILY_SALES.length === 0 && (
                    <p className="mt-3 text-center text-xs text-muted-foreground">No sales data available.</p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method Breakdown */}
              <Card className="border bg-card shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="size-4 text-sky-500" />
                    Payment Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  {paymentBreakdown.map((pb) => (
                    <DonutSegment
                      key={pb.method}
                      percentage={pb.percentage}
                      color={pb.method === "cash" ? "bg-emerald-500" : pb.method === "gcash" ? "bg-sky-500" : pb.method === "card" ? "bg-violet-500" : "bg-neutral-400"}
                      label={`${paymentMethodLabels[pb.method]} (${pb.count})`}
                      amount={formatCompact(pb.total)}
                    />
                  ))}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold">{formatCompact(paymentBreakdown.reduce((s, p) => s + p.total, 0))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Source Breakdown */}
            <div className="grid gap-4 sm:grid-cols-2">
              {orderTypeBreakdown.map((ob) => (
                <Card key={ob.type} className="border bg-card shadow-xs">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`size-12 rounded-xl flex items-center justify-center ${ob.type === "qr" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-sky-500/10 text-sky-600 dark:text-sky-400"}`}>
                      {ob.type === "qr" ? <Smartphone className="size-6" /> : <Utensils className="size-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{ob.type === "qr" ? "QR Orders" : "Counter Orders"}</div>
                      <div className="text-lg font-bold">{formatCompact(ob.total)}</div>
                      <div className="text-[10px] text-muted-foreground">{ob.count} orders · {ob.percentage}% of total</div>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div className="text-right">
                      <div className="text-lg font-bold">{ob.percentage}%</div>
                      <div className="text-[10px] text-muted-foreground">share</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/*  EXPENSES TAB (CRUD & Breakdown)                                  */}
        {/* ================================================================= */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border bg-card shadow-xs">
                <CardContent className="p-3 sm:p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</span>
                    <DollarSign className="size-3.5 text-emerald-500" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCompact(salesSummary.totalRevenue)}</div>
                </CardContent>
              </Card>
              <Card className="border bg-card shadow-xs">
                <CardContent className="p-3 sm:p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</span>
                    <TrendingDown className="size-3.5 text-rose-500" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400">{formatCompact(totalExpenses)}</div>
                </CardContent>
              </Card>
              <Card className="border bg-card shadow-xs">
                <CardContent className="p-3 sm:p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Profit</span>
                    {netProfit >= 0 ? <TrendingUp className="size-3.5 text-emerald-500" /> : <TrendingDown className="size-3.5 text-rose-500" />}
                  </div>
                  <div className={`text-lg sm:text-xl font-bold ${netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{formatCompact(netProfit)}</div>
                </CardContent>
              </Card>
              <Card className="border bg-card shadow-xs">
                <CardContent className="p-3 sm:p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Profit Margin</span>
                    <Percent className="size-3.5 text-amber-500" />
                  </div>
                  <div className={`text-lg sm:text-xl font-bold ${profitMargin >= 20 ? "text-emerald-600 dark:text-emerald-400" : profitMargin >= 10 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>{profitMargin.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Expense Management Bar & Actions */}
            <Card className="border bg-card shadow-xs">
              <CardHeader className="p-4 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Wallet className="size-4 text-rose-500" />
                      Expense Ledger & Records
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Track, create, update, and manage all operating costs and purchases.
                    </p>
                  </div>
                  <Button onClick={handleOpenAddExpense} size="sm" className="h-9 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shrink-0">
                    <Plus className="size-4" />
                    <span>Add Expense</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search description, receipt ref, staff..."
                      value={expenseSearch}
                      onChange={(e) => {
                        setExpenseSearch(e.target.value)
                        setExpensePage(1)
                      }}
                      className="pl-8 h-9 text-xs"
                    />
                    {expenseSearch && (
                      <button
                        onClick={() => {
                          setExpenseSearch("")
                          setExpensePage(1)
                        }}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <Select
                    value={expenseCategoryFilter}
                    onValueChange={(val) => {
                      setExpenseCategoryFilter(val ?? "all")
                      setExpensePage(1)
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[210px] h-9 text-xs">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories ({expenses.length})</SelectItem>
                      {expenseCategories.map((cat) => {
                        const count = expenses.filter((e) => e.categoryId === cat.id).length
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name} ({count})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Expenses Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] font-medium uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Description & Notes</th>
                          <th className="py-2.5 px-3">Receipt / Ref</th>
                          <th className="py-2.5 px-3">Recorded By</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredExpenses.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-muted-foreground">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <Wallet className="size-8 text-muted-foreground/40 mb-1" />
                                <p className="text-xs font-medium text-foreground">No expenses found</p>
                                <p className="text-[11px] text-muted-foreground">Try adjusting your filters or record a new expense.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedExpenses.map((exp) => {
                            const cat = expenseCategories.find((c) => c.id === exp.categoryId)
                            return (
                              <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 px-3 font-medium whitespace-nowrap">{exp.expenseDate}</td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-medium border-border"
                                    style={{ borderColor: `${cat?.color || "#6b7280"}40`, color: cat?.color || "inherit" }}
                                  >
                                    {cat?.name || "Other"}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 max-w-[260px]">
                                  <div className="font-medium text-foreground truncate">{exp.description}</div>
                                  {exp.notes && (
                                    <div className="text-[10px] text-muted-foreground truncate">{exp.notes}</div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {exp.receiptReference ? (
                                    <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded text-muted-foreground">
                                      {exp.receiptReference}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/50 text-[11px]">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">{exp.recordedByStaffName}</td>
                                <td className="py-2.5 px-3 text-right font-bold tabular-nums text-foreground whitespace-nowrap">
                                  {formatPeso(exp.amount)}
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-muted-foreground hover:text-foreground"
                                      onClick={() => handleOpenEditExpense(exp)}
                                      title="Edit expense"
                                    >
                                      <Pencil className="size-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10"
                                      onClick={() => setDeletingExpenseId(exp.id)}
                                      title="Delete expense"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="text-xs text-muted-foreground">
                    {filteredExpenses.length === 0 ? (
                      "0 expenses"
                    ) : (
                      <>
                        Showing <span className="font-medium text-foreground">{(expensePage - 1) * EXPENSE_PAGE_SIZE + 1}</span> to{" "}
                        <span className="font-medium text-foreground">{Math.min(expensePage * EXPENSE_PAGE_SIZE, filteredExpenses.length)}</span> of{" "}
                        <span className="font-medium text-foreground">{filteredExpenses.length}</span> expenses
                        <span className="text-[11px] text-muted-foreground ml-1.5">(10 per page)</span>
                      </>
                    )}
                  </div>

                  {expenseTotalPages > 1 && (
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs gap-1"
                        disabled={expensePage <= 1}
                        onClick={() => setExpensePage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="size-3.5" />
                        <span>Prev</span>
                      </Button>
                      <span className="text-xs text-muted-foreground px-2 font-medium">
                        Page {expensePage} of {expenseTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs gap-1"
                        disabled={expensePage >= expenseTotalPages}
                        onClick={() => setExpensePage((p) => Math.min(expenseTotalPages, p + 1))}
                      >
                        <span>Next</span>
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown by Category Accordion */}
            <Card className="border bg-card shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Wallet className="size-4 text-rose-500" />
                  Category Breakdown & Aggregates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                {expenseCategoriesSummary.map((exp) => {
                  const isOpen = expandedExpense === exp.categoryId
                  return (
                    <div key={exp.categoryId} className="border border-border rounded-lg overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left"
                        onClick={() => setExpandedExpense(isOpen ? null : exp.categoryId)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-8 w-1 rounded-full" style={{ backgroundColor: exp.color }} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{exp.category}</div>
                            <div className="text-[10px] text-muted-foreground">{exp.items.length} line items</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-bold tabular-nums">{formatPeso(exp.amount)}</div>
                            <div className="text-[10px] text-muted-foreground">{exp.percentage}%</div>
                          </div>
                          <ChevronRight className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-border bg-muted/20 p-3 space-y-2">
                          {exp.items.length === 0 ? (
                            <div className="text-xs text-muted-foreground py-1">No expenses recorded in this category.</div>
                          ) : (
                            exp.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className="font-medium tabular-nums">{formatPeso(item.amount)}</span>
                              </div>
                            ))
                          )}
                          <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-semibold">
                            <span>Subtotal</span>
                            <span className="tabular-nums">{formatPeso(exp.amount)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Grand Total */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-bold">Grand Total Expenses</span>
                  <span className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatPeso(totalExpenses)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Cost Distribution Bar */}
            <Card className="border bg-card shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold">Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                {expenseCategoriesSummary.map((exp) => (
                  <HorizontalBar
                    key={exp.categoryId}
                    label={exp.category}
                    value={exp.amount}
                    maxValue={maxCategoryExpense}
                    color={exp.categoryId.includes("payroll") ? "bg-rose-500" : exp.categoryId.includes("inventory") ? "bg-amber-500" : exp.categoryId.includes("operations") ? "bg-sky-500" : exp.categoryId.includes("marketing") ? "bg-violet-500" : "bg-neutral-400"}
                    amount={formatPeso(exp.amount)}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================================================================= */}
        {/*  INSIGHTS TAB                                                      */}
        {/* ================================================================= */}
        {activeTab === "insights" && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Top Selling Items */}
              <Card className="border bg-card shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Trophy className="size-4 text-amber-500" />
                    Top Selling Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-2">
                    {topSellingItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold ${idx < 3 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground">{item.category} · {item.quantitySold} sold</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold tabular-nums">{formatCompact(item.revenue)}</div>
                          <div className={`text-[10px] font-medium flex items-center justify-end gap-0.5 ${item.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : item.trend === "down" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                            {item.trend === "up" && <ArrowUp className="size-2.5" />}
                            {item.trend === "down" && <ArrowDown className="size-2.5" />}
                            {item.trend === "flat" && <Minus className="size-2.5" />}
                            {item.trendPercent > 0 ? `${item.trendPercent}%` : "flat"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Staff Performance */}
              <Card className="border bg-card shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="size-4 text-sky-500" />
                    Staff Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-3">
                    {staffPerformance.map((staff) => (
                      <div key={staff.id} className="p-3 border border-border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold">{staff.name}</div>
                            <div className="text-[10px] text-muted-foreground">{staff.role}</div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${staff.voidRate <= 1 ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10" : staff.voidRate <= 2 ? "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10" : "border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10"}`}>
                            Void: {staff.voidRate}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="text-[10px] text-muted-foreground">Orders</div>
                            <div className="text-xs font-bold tabular-nums">{staff.ordersProcessed}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground">Sales</div>
                            <div className="text-xs font-bold tabular-nums">{formatCompact(staff.totalSales)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground">Avg Time</div>
                            <div className="text-xs font-bold tabular-nums">{staff.avgHandlingTime}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Discounts & Promotions */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Discount Insights (Senior/PWD) */}
              <Card className="border bg-card shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BadgePercent className="size-4 text-orange-500" />
                    Discount Usage (Senior / PWD)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-3">
                    {discountInsights.map((d) => (
                      <div key={d.typeName} className="p-3 border border-border rounded-lg flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                          <BadgePercent className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{d.typeName}</div>
                          <div className="text-[10px] text-muted-foreground">{d.usageCount} uses · Avg {formatPeso(d.avgPerOrder)}/order</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold tabular-nums text-orange-600 dark:text-orange-400">{formatPeso(d.totalDiscount)}</div>
                          <div className="text-[10px] text-muted-foreground">total discounted</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Promotion Performance */}
              <Card className="border bg-card shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Flame className="size-4 text-violet-500" />
                    Promotion Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-2.5">
                    {promoInsights.map((p) => (
                      <div key={p.name} className="p-3 border border-border rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-semibold truncate max-w-[160px]">{p.name}</div>
                            <Badge variant="outline" className={`text-[9px] py-0 px-1 ${p.isActive ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "border-neutral-500/30 text-neutral-500"}`}>
                              {p.isActive ? "Active" : "Ended"}
                            </Badge>
                          </div>
                          <span className="text-xs font-bold tabular-nums text-violet-600 dark:text-violet-400">{formatPeso(p.totalDiscount)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{p.promoType === "percentage" ? "%" : p.promoType === "fixed_amount" ? "₱ off" : "BXGY"}</span>
                          <span>·</span>
                          <span>{p.usageCount}{p.usageLimit ? ` / ${p.usageLimit}` : ""} uses</span>
                          {p.usageLimit && (
                            <>
                              <span>·</span>
                              <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden max-w-[80px]">
                                <div className={`h-full rounded-full ${p.usageCount >= p.usageLimit ? "bg-rose-500" : p.usageCount >= p.usageLimit * 0.75 ? "bg-amber-500" : "bg-violet-500"}`} style={{ width: `${Math.min(100, (p.usageCount / p.usageLimit) * 100)}%` }} />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue per Category */}
            <Card className="border bg-card shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="size-4 text-emerald-500" />
                  Revenue by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-3">
                  {categoryRevenue.map((item) => (
                    <HorizontalBar
                      key={item.categoryId}
                      label={`${item.category} (${item.quantitySold} sold)`}
                      value={item.revenue}
                      maxValue={Math.max(...categoryRevenue.map((category) => category.revenue), 1)}
                      color="bg-emerald-500"
                      amount={formatPeso(item.revenue)}
                    />
                  ))}
                  {categoryRevenue.length === 0 && <p className="text-sm text-muted-foreground">No category sales data available.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================================================================= */}
        {/*  TRANSACTIONS TAB                                                  */}
        {/* ================================================================= */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search order #, customer, receipt, or staff…"
                  className="pl-9 h-10 text-sm"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setTxPage(1) }}
                />
                {search && (
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => { setSearch(""); setTxPage(1) }}>
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <Select value={txStatusFilter} onValueChange={(v) => { setTxStatusFilter(v ?? "all"); setTxPage(1) }}>
                <SelectTrigger className="w-full sm:w-[150px] h-10 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={txPaymentFilter} onValueChange={(v) => { setTxPaymentFilter(v ?? "all"); setTxPage(1) }}>
                <SelectTrigger className="w-full sm:w-[150px] h-10 text-sm">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Count */}
            <div className="text-xs text-muted-foreground">
              Showing {paginatedTx.length} of {filteredTransactions.length} transactions
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="border bg-card shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left font-semibold p-3 whitespace-nowrap">Date & Time</th>
                        <th className="text-left font-semibold p-3 whitespace-nowrap">Order #</th>
                        <th className="text-left font-semibold p-3 whitespace-nowrap">Type</th>
                        <th className="text-left font-semibold p-3 whitespace-nowrap">Customer</th>
                        <th className="text-right font-semibold p-3 whitespace-nowrap">Items</th>
                        <th className="text-right font-semibold p-3 whitespace-nowrap">Total</th>
                        <th className="text-left font-semibold p-3 whitespace-nowrap">Payment</th>
                        <th className="text-left font-semibold p-3 whitespace-nowrap">Staff</th>
                        <th className="text-left font-semibold p-3 whitespace-nowrap">Status</th>
                        <th className="text-center font-semibold p-3 whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTx.map((tx) => (
                        <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-medium">{tx.date}</div>
                            <div className="text-muted-foreground">{tx.time}</div>
                          </td>
                          <td className="p-3 font-mono font-semibold whitespace-nowrap">{tx.orderNumber}</td>
                          <td className="p-3 whitespace-nowrap">
                            <Badge variant="outline" className={`text-[9px] ${tx.type === "qr" ? "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10" : "border-sky-500/30 text-sky-700 dark:text-sky-300 bg-sky-500/10"}`}>
                              {tx.type === "qr" ? "QR" : "Counter"}
                            </Badge>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-medium">{tx.customer}</div>
                            {tx.tableNumber && <div className="text-muted-foreground">Table {tx.tableNumber}</div>}
                          </td>
                          <td className="p-3 text-right tabular-nums">{tx.items}</td>
                          <td className="p-3 text-right font-semibold tabular-nums">{formatPeso(tx.total)}</td>
                          <td className="p-3 whitespace-nowrap">
                            <Badge variant="outline" className={`text-[9px] gap-1 ${paymentMethodColors[tx.paymentMethod]}`}>
                              {paymentMethodIcons[tx.paymentMethod]}
                              {paymentMethodLabels[tx.paymentMethod]}
                            </Badge>
                          </td>
                          <td className="p-3 whitespace-nowrap text-muted-foreground">{tx.staffName}</td>
                          <td className="p-3 whitespace-nowrap">
                            <Badge variant="outline" className={`text-[9px] ${tx.status === "completed" ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10" : tx.status === "voided" ? "border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10" : "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10"}`}>
                              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => setDetailTx(tx)}>
                              <Eye className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {paginatedTx.length === 0 && (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-muted-foreground">No transactions found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {paginatedTx.map((tx) => (
                <Card key={tx.id} className="border bg-card shadow-xs">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">{tx.orderNumber}</span>
                        <Badge variant="outline" className={`text-[9px] ${tx.type === "qr" ? "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10" : "border-sky-500/30 text-sky-700 dark:text-sky-300 bg-sky-500/10"}`}>
                          {tx.type === "qr" ? "QR" : "Counter"}
                        </Badge>
                      </div>
                      <Badge variant="outline" className={`text-[9px] ${tx.status === "completed" ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10" : tx.status === "voided" ? "border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10" : "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10"}`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{tx.customer}{tx.tableNumber ? ` · Table ${tx.tableNumber}` : ""}</span>
                      <span className="font-bold tabular-nums">{formatPeso(tx.total)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{tx.date} {tx.time}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[9px] gap-1 py-0 ${paymentMethodColors[tx.paymentMethod]}`}>
                          {paymentMethodIcons[tx.paymentMethod]}
                          {paymentMethodLabels[tx.paymentMethod]}
                        </Badge>
                        <Button variant="ghost" size="sm" className="size-6 p-0" onClick={() => setDetailTx(tx)}>
                          <Eye className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {paginatedTx.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">No transactions found.</div>
              )}
            </div>

            {/* Pagination */}
            {txTotalPages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Page {txPage} of {txTotalPages}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={txPage <= 1} onClick={() => setTxPage((p) => p - 1)}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={txPage >= txTotalPages} onClick={() => setTxPage((p) => p + 1)}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* Transaction Detail Sheet                                           */}
      {/* ================================================================= */}
      <Sheet open={!!detailTx} onOpenChange={(open) => { if (!open) setDetailTx(null) }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-amber-500" />
              Transaction Details
            </SheetTitle>
            <SheetDescription>
              {detailTx?.orderNumber} — {detailTx?.receiptNumber}
            </SheetDescription>
          </SheetHeader>
          {detailTx && (
            <div className="mt-6 space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <Badge variant="outline" className={`text-xs ${detailTx.status === "completed" ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10" : detailTx.status === "voided" ? "border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10" : "border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10"}`}>
                  {detailTx.status.charAt(0).toUpperCase() + detailTx.status.slice(1)}
                </Badge>
              </div>

              {/* Order Info */}
              <div className="space-y-3 bg-muted/20 rounded-lg p-3 border border-border">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Information</div>
                {[
                  { label: "Date & Time", value: `${detailTx.date} · ${detailTx.time}` },
                  { label: "Order Number", value: detailTx.orderNumber },
                  { label: "Receipt Number", value: detailTx.receiptNumber },
                  { label: "Order Type", value: detailTx.type === "qr" ? "QR Order" : "Counter Order" },
                  { label: "Table", value: detailTx.tableNumber ? `Table ${detailTx.tableNumber}` : "—" },
                  { label: "Customer", value: detailTx.customer },
                  { label: "Processed by", value: detailTx.staffName },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-3 bg-muted/20 rounded-lg p-3 border border-border">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Summary</div>
                {[
                  { label: "Items Count", value: detailTx.items.toString() },
                  { label: "Subtotal", value: formatPeso(detailTx.subtotal) },
                  { label: "Discount", value: detailTx.discount > 0 ? `-${formatPeso(detailTx.discount)}` : "—", highlight: detailTx.discount > 0 },
                  { label: "Tax (12% VAT)", value: formatPeso(detailTx.tax) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-medium ${row.highlight ? "text-orange-600 dark:text-orange-400" : ""}`}>{row.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-bold">Total Paid</span>
                  <span className="text-sm font-bold">{formatPeso(detailTx.total)}</span>
                </div>
              </div>

              {/* Payment */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground">Payment Method</div>
                <Badge variant="outline" className={`text-xs gap-1.5 ${paymentMethodColors[detailTx.paymentMethod]}`}>
                  {paymentMethodIcons[detailTx.paymentMethod]}
                  {paymentMethodLabels[detailTx.paymentMethod]}
                </Badge>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ================================================================= */}
      {/* Add / Edit Expense Sheet                                           */}
      {/* ================================================================= */}
      <Sheet open={isExpenseSheetOpen} onOpenChange={setIsExpenseSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Wallet className="size-5 text-rose-500" />
              {editingExpense ? "Edit Expense Record" : "Record New Expense"}
            </SheetTitle>
            <SheetDescription>
              {editingExpense
                ? "Update the details and amount for this expense record."
                : "Enter the details of the business expense or operational cost."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveExpense} className="mt-6 space-y-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category</Label>
              <Select
                value={expenseForm.categoryId}
                onValueChange={(val) => {
                  if (val) setExpenseForm((prev) => ({ ...prev, categoryId: val }))
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Description <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Chicken wholesale supply, Electricity bill"
                value={expenseForm.description}
                onChange={(e) => {
                  setExpenseForm((prev) => ({ ...prev, description: e.target.value }))
                  if (expenseFormErrors.description) {
                    setExpenseFormErrors((prev) => ({ ...prev, description: "" }))
                  }
                }}
                className="h-9 text-xs"
              />
              {expenseFormErrors.description && (
                <p className="text-[11px] text-rose-500 font-medium">{expenseFormErrors.description}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Amount (₱) <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-muted-foreground">₱</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={expenseForm.amount === 0 && !editingExpense ? "" : expenseForm.amount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setExpenseForm((prev) => ({ ...prev, amount: val }))
                    if (expenseFormErrors.amount) {
                      setExpenseFormErrors((prev) => ({ ...prev, amount: "" }))
                    }
                  }}
                  className="pl-7 h-9 text-xs font-semibold"
                />
              </div>
              {expenseFormErrors.amount && (
                <p className="text-[11px] text-rose-500 font-medium">{expenseFormErrors.amount}</p>
              )}
            </div>

            {/* Expense Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Expense Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                value={expenseForm.expenseDate}
                onChange={(e) => {
                  setExpenseForm((prev) => ({ ...prev, expenseDate: e.target.value }))
                  if (expenseFormErrors.expenseDate) {
                    setExpenseFormErrors((prev) => ({ ...prev, expenseDate: "" }))
                  }
                }}
                className="h-9 text-xs"
              />
              {expenseFormErrors.expenseDate && (
                <p className="text-[11px] text-rose-500 font-medium">{expenseFormErrors.expenseDate}</p>
              )}
            </div>

            {/* Receipt Reference */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Receipt / Invoice Reference (Optional)</Label>
              <Input
                placeholder="e.g. INV-2026-001, OR# 84729"
                value={expenseForm.receiptReference || ""}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, receiptReference: e.target.value }))}
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes (Optional)</Label>
              <Textarea
                placeholder="Additional details, supplier info, or remarks..."
                value={expenseForm.notes || ""}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="text-xs min-h-[70px] resize-none"
              />
            </div>

            <SheetFooter className="pt-3 gap-2 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsExpenseSheetOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white">
                {editingExpense ? "Update Expense" : "Save Expense"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ================================================================= */}
      {/* Delete Expense Confirmation Dialog                                */}
      {/* ================================================================= */}
      <AlertDialog open={!!deletingExpenseId} onOpenChange={(open) => { if (!open) setDeletingExpenseId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">Delete Expense Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will remove this expense record from the ledger. This action cannot be undone and will update your total expenses and net profit calculations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteExpense}
              className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
