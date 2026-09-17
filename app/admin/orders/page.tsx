"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  Loader2,
  Pencil,
  PackageCheck,
  Plus,
  Printer,
  Receipt as ReceiptIcon,
  Search,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"
import { createOrderAction, deleteOrderAction, fetchOrders, updateOrderStatusAction } from "@/app/actions/orders"
import { createPaymentAction } from "@/app/actions/payments"
import { fetchMenuItems, fetchCategories } from "@/app/actions/menu"
import { fetchTables } from "@/app/actions/tables"
import { fetchSystemSettings } from "@/app/actions/settings"
import { fetchDiscounts } from "@/app/actions/discounts"
import { DigitalReceipt, type DigitalReceiptStoreInfo, type DigitalReceiptPaymentInfo } from "@/components/digital-receipt"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrderStatus = "pending" | "preparing" | "ready" | "served" | "completed" | "cancelled"
type OrderSource = "QR" | "Counter"

type OrderItem = {
  id?: string
  menuItemId?: string
  name: string
  quantity: number
  price: number
  subtotal?: number
  notes?: string | null
}

type Order = {
  id: string
  orderNumber: string
  tableId: string | null
  customerId: string | null
  orderType: "qr" | "counter"
  table: string
  source: OrderSource
  customer: string
  time: string
  status: OrderStatus
  subtotal: number
  discount: number
  tax: number
  total: number
  createdByStaffId: string | null
  items: OrderItem[]
}

type OrderForm = Omit<Order, "id" | "table" | "time"> & { table: string }

type MenuItemData = {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  stockQuantity: number | null
}

type CategoryData = {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
}

type TableData = {
  id: string
  tableNumber: string
  capacity: number
  status: string
  qrCodeUrl: string | null
}

type DiscountTypeData = {
  id: string
  name: string
  percentage: number
  requiresIdVerification: boolean
  isActive: boolean
}

const emptyForm: OrderForm = {
  orderNumber: "",
  tableId: null,
  customerId: null,
  orderType: "counter",
  table: "Counter",
  source: "Counter",
  customer: "Guest checkout",
  status: "pending",
  subtotal: 0,
  discount: 0,
  tax: 0,
  total: 0,
  createdByStaffId: null,
  items: [],
}

// Fallback store/receipt info used until Settings > Receipt & Print loads (or if it's unset).
const DEFAULT_STORE_INFO: DigitalReceiptStoreInfo = {
  restaurantName: "Restaurant",
  branchName: "",
  address: "",
  contactNumber: "",
  tinNumber: "",
  birMin: "",
  receiptHeader: "",
  receiptFooter: "Thank you for dining with us!",
  currencySymbol: "₱",
  vatEnabled: false,
  vatRate: 12,
  vatInclusive: false,
  serviceChargeEnabled: false,
  serviceChargeRate: 0,
  showWifiOnReceipt: false,
  wifiSsid: "",
  wifiPassword: "",
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  completed: "Completed",
  cancelled: "Cancelled",
}

const statusClasses: Record<OrderStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  preparing: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  ready: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  served: "bg-teal-500/10 text-teal-700 border-teal-500/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
}

const tabs = [
  { value: "live", label: "Live orders" },
  { value: "counter", label: "Counter orders" },
  { value: "history", label: "Order history" },
  { value: "voided", label: "Voided / cancelled" },
]

function formatCurrency(value: number) {
  return `₱${value.toLocaleString("en-PH")}`
}

// Mirrors the VAT logic in createOrderAction (lib/database, orders.ts server action)
// so the on-screen preview matches exactly what gets persisted:
//  - vatInclusive: VAT already lives inside the discounted subtotal — extracted for
//    display only, never added again.
//  - vatExclusive: VAT is computed on top of the discounted subtotal and added.
function computeTotals(
  subtotal: number,
  discountAmount: number,
  store: Pick<DigitalReceiptStoreInfo, "vatEnabled" | "vatRate" | "vatInclusive">,
) {
  const netAfterDiscount = subtotal - discountAmount
  let tax = 0
  let total = netAfterDiscount

  if (store.vatEnabled) {
    if (store.vatInclusive) {
      tax = Number((netAfterDiscount * (store.vatRate / (100 + store.vatRate))).toFixed(2))
      total = netAfterDiscount
    } else {
      tax = Number((netAfterDiscount * (store.vatRate / 100)).toFixed(2))
      total = netAfterDiscount + tax
    }
  }

  return { tax, total }
}

export default function OrdersPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItemsData, setMenuItemsData] = useState<MenuItemData[]>([])
  const [categoriesData, setCategoriesData] = useState<CategoryData[]>([])
  const [tablesData, setTablesData] = useState<TableData[]>([])
  const [discountTypesData, setDiscountTypesData] = useState<DiscountTypeData[]>([])
  const [storeInfo, setStoreInfo] = useState<DigitalReceiptStoreInfo>(DEFAULT_STORE_INFO)
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState("live")
  const [search, setSearch] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash" | "card" | "other">("cash")
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentReference, setPaymentReference] = useState("")
  const [isPaying, setIsPaying] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<OrderForm>(emptyForm)
  const [menuSearch, setMenuSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [page, setPage] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pageSize = 6

  // Discount selection for the order being built/edited — always resolved against
  // an active DiscountTypeEntity server-side; this is never sent as a raw amount.
  const [selectedDiscountTypeId, setSelectedDiscountTypeId] = useState<string | null>(null)
  const [discountIdNumber, setDiscountIdNumber] = useState("")
  const [discountHolderName, setDiscountHolderName] = useState("")

  // Digital receipt sheet (used both for "View digital receipt" and right after a successful payment)
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)
  const [receiptPayment, setReceiptPayment] = useState<DigitalReceiptPaymentInfo | undefined>(undefined)

  function closeReceipt() {
    setReceiptOrder(null)
    setReceiptPayment(undefined)
  }

  // ---------------------------------------------------------------------------
  // Load data from backend
  // ---------------------------------------------------------------------------
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersRes, menuRes, catRes, tablesRes, settingsRes, discountsRes] = await Promise.all([
        fetchOrders(),
        fetchMenuItems(),
        fetchCategories(),
        fetchTables(),
        fetchSystemSettings(),
        fetchDiscounts(),
      ])

      if (ordersRes.success && ordersRes.data) {
        setOrders(ordersRes.data as Order[])
      }
      if (menuRes.success && menuRes.data) {
        setMenuItemsData(menuRes.data as MenuItemData[])
      }
      if (catRes.success && catRes.data) {
        setCategoriesData(catRes.data as CategoryData[])
      }
      if (tablesRes.success && tablesRes.data) {
        setTablesData(tablesRes.data as TableData[])
      }
      if (discountsRes.success && discountsRes.data) {
        const activeDiscounts = (discountsRes.data.discountTypes as DiscountTypeData[]).filter(
          (d) => d.isActive,
        )
        setDiscountTypesData(activeDiscounts)
      }
      if (settingsRes.success && settingsRes.data) {
        const d = settingsRes.data as Record<string, unknown>
        setStoreInfo({
          restaurantName: (d.restaurantName as string) || DEFAULT_STORE_INFO.restaurantName,
          branchName: (d.branchName as string) || "",
          address: (d.address as string) || "",
          contactNumber: (d.contactNumber as string) || "",
          tinNumber: (d.tinNumber as string) || "",
          birMin: (d.birMin as string) || "",
          receiptHeader: (d.receiptHeader as string) || "",
          receiptFooter: (d.receiptFooter as string) || "",
          currencySymbol: (d.currencySymbol as string) || DEFAULT_STORE_INFO.currencySymbol,
          vatEnabled: Boolean(d.vatEnabled),
          vatRate: (d.vatRate as number) ?? DEFAULT_STORE_INFO.vatRate,
          vatInclusive: Boolean(d.vatInclusive),
          serviceChargeEnabled: Boolean(d.serviceChargeEnabled),
          serviceChargeRate: (d.serviceChargeRate as number) ?? 0,
          showWifiOnReceipt: Boolean(d.showWifiOnReceipt),
          wifiSsid: (d.wifiSsid as string) || "",
          wifiPassword: (d.wifiPassword as string) || "",
        })
      }
    } catch (err) {
      console.error("Failed to load orders data:", err)
      toast.error("Failed to load data", { description: "Please refresh the page." })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ---------------------------------------------------------------------------
  // Derived data: category map for menu items in POS grid
  // ---------------------------------------------------------------------------
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    categoriesData.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categoriesData])

  const menuItemsWithCategory = useMemo(() => {
    return menuItemsData
      .filter((item) => item.isAvailable)
      .map((item) => ({
        ...item,
        category: categoryMap.get(item.categoryId) || "Other",
      }))
  }, [menuItemsData, categoryMap])

  const selectedDiscountType = useMemo(
    () => discountTypesData.find((d) => d.id === selectedDiscountTypeId) ?? null,
    [discountTypesData, selectedDiscountTypeId],
  )

  // ---------------------------------------------------------------------------
  // Filtered / paginated orders
  // ---------------------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesSearch = !query || [order.id, order.orderNumber, order.table, order.customer]
        .join(" ")
        .toLowerCase()
        .includes(query)
      const matchesTab =
        activeTab === "live"
          ? ["pending", "preparing", "ready"].includes(order.status)
          : activeTab === "counter"
            ? order.source === "Counter" && order.status !== "cancelled"
            : activeTab === "history"
              ? order.status === "completed"
              : order.status === "cancelled"
      return matchesSearch && matchesTab
    })
  }, [activeTab, orders, search])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const paginatedOrders = useMemo(
    () => filteredOrders.slice((page - 1) * pageSize, page * pageSize),
    [filteredOrders, page],
  )

  useEffect(() => {
    setPage(1)
  }, [activeTab, search])

  // ---------------------------------------------------------------------------
  // Menu categories for POS grid
  // ---------------------------------------------------------------------------
  const posCategories = useMemo(() => {
    const counts = new Map<string, number>()
    menuItemsWithCategory.forEach((item) => counts.set(item.category, (counts.get(item.category) ?? 0) + 1))
    return [
      { id: "all", label: "All", count: menuItemsWithCategory.length },
      ...Array.from(counts.entries()).map(([label, count]) => ({ id: label, label, count })),
    ]
  }, [menuItemsWithCategory])

  const filteredMenuItems = useMemo(
    () =>
      menuItemsWithCategory.filter(
        (item) =>
          (activeCategory === "all" || item.category === activeCategory) &&
          item.name.toLowerCase().includes(menuSearch.trim().toLowerCase()),
      ),
    [menuItemsWithCategory, menuSearch, activeCategory],
  )

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  async function updateStatus(order: Order, status: OrderStatus) {
    // Optimistic update
    setOrders((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status } : item)),
    )
    setSelectedOrder((current) => (current?.id === order.id ? { ...current, status } : current))

    try {
      const res = await updateOrderStatusAction({
        orderId: order.id,
        status,
      })
      if (!res.success) {
        throw new Error(res.error || "Failed to update status")
      }
      await loadData()
      toast.success(`${order.orderNumber} marked ${statusLabels[status].toLowerCase()}`)
    } catch (err) {
      // Rollback
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, status: order.status } : item)),
      )
      setSelectedOrder((current) => (current?.id === order.id ? { ...current, status: order.status } : current))
      toast.error("Failed to update order status", {
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    }
  }

  function openCreateSheet() {
    setEditingId(null)
    setForm({ ...emptyForm })
    setActiveCategory("all")
    setMenuSearch("")
    setSelectedDiscountTypeId(null)
    setDiscountIdNumber("")
    setDiscountHolderName("")
    setSheetOpen(true)
  }

  function openEditSheet(order: Order) {
    setEditingId(order.id)
    setForm({ ...order, orderNumber: order.orderNumber, table: order.table })
    setActiveCategory("all")
    setMenuSearch("")
    // Editing only changes status/items locally today (no discount-update action exists
    // yet), so we don't try to reverse-map the order's stored discount back to a type here.
    setSelectedDiscountTypeId(null)
    setDiscountIdNumber("")
    setDiscountHolderName("")
    setSheetOpen(true)
  }

  // Recomputes discount + tax + total from a subtotal and the currently selected
  // discount type, using the same formula as the server so the preview never lies.
  function recomputeForm(subtotal: number, items: OrderForm["items"], discountTypeId: string | null) {
    const discountType = discountTypesData.find((d) => d.id === discountTypeId) ?? null
    const discountAmount = discountType ? Number((subtotal * (discountType.percentage / 100)).toFixed(2)) : 0
    const { tax, total } = computeTotals(subtotal, discountAmount, storeInfo)
    setForm((current) => ({ ...current, items, subtotal, discount: discountAmount, tax, total }))
  }

  function updateFormItems(items: OrderForm["items"]) {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    recomputeForm(subtotal, items, selectedDiscountTypeId)
  }

  function selectDiscountType(value: string) {
    const discountTypeId = value === "none" ? null : value
    setSelectedDiscountTypeId(discountTypeId)
    if (discountTypeId === null) {
      setDiscountIdNumber("")
      setDiscountHolderName("")
    }
    recomputeForm(form.subtotal, form.items, discountTypeId)
  }

  function addMenuItem(menuItemId: string | null) {
    if (!menuItemId) return
    const menuItem = menuItemsWithCategory.find((item) => item.id === menuItemId)
    if (!menuItem) return
    const existing = form.items.find((item) => item.menuItemId === menuItem.id)
    const items = existing
      ? form.items.map((item) => item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...form.items, { menuItemId: menuItem.id, name: menuItem.name, quantity: 1, price: menuItem.price, subtotal: menuItem.price, notes: null }]
    updateFormItems(items)
  }

  function changeItemQuantity(index: number, quantity: number) {
    if (quantity <= 0) {
      updateFormItems(form.items.filter((_, itemIndex) => itemIndex !== index))
      return
    }
    updateFormItems(form.items.map((item, itemIndex) => itemIndex === index ? { ...item, quantity, subtotal: quantity * item.price } : item))
  }

  function openPayment(order: Order) {
    setPaymentOrder(order)
    setPaymentAmount(order.total)
    setPaymentMethod("cash")
    setPaymentReference("")
  }

  async function savePayment() {
    if (!paymentOrder || paymentAmount < paymentOrder.total) {
      toast.error("Payment must cover the order total.")
      return
    }

    setIsPaying(true)
    const toastId = toast.loading("Recording payment…")
    try {
      const res = await createPaymentAction({
        orderId: paymentOrder.id,
        amountPaid: paymentAmount,
        paymentMethod,
        referenceNumber: paymentReference || null,
        processedByStaffId: null,
      })
      if (!res.success) throw new Error(res.error || "Failed to record payment")

      // Snapshot the just-paid order + payment details, then open the digital receipt
      // automatically so the cashier can show/print it for the customer right away.
      setReceiptOrder({ ...paymentOrder, status: "completed" })
      setReceiptPayment({
        receiptNumber: res.data.receiptNumber,
        amountPaid: paymentAmount,
        change: res.data.change,
        paymentMethod,
        referenceNumber: paymentReference || null,
      })

      setPaymentOrder(null)
      setSelectedOrder(null)
      await loadData()
      toast.success("Payment recorded", {
        id: toastId,
        description: `${res.data.receiptNumber} · Change ${formatCurrency(res.data.change)}`,
      })
    } catch (err) {
      toast.error("Payment failed", {
        id: toastId,
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setIsPaying(false)
    }
  }

  async function saveOrder() {
    if (form.items.length === 0) {
      toast.error("Cart is empty", { description: "Add at least one item to the order." })
      return
    }

    if (selectedDiscountType?.requiresIdVerification && !discountIdNumber.trim()) {
      toast.error("ID number required", { description: `${selectedDiscountType.name} requires a valid ID number.` })
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading(editingId ? "Saving changes…" : "Placing order…")

    try {
      if (editingId) {
        // For editing, update status if changed
        const existing = orders.find((o) => o.id === editingId)
        if (existing && existing.status !== form.status) {
          const res = await updateOrderStatusAction({
            orderId: editingId,
            status: form.status,
          })
          if (!res.success) {
            throw new Error(res.error || "Failed to update order")
          }
        }

        // Update local state
        const updatedOrder: Order = {
          ...form,
          id: editingId,
          time: orders.find((o) => o.id === editingId)?.time ?? "Just now",
          source: form.orderType === "qr" ? "QR" : "Counter",
          customer: form.customer,
        }
        setOrders((current) => current.map((o) => o.id === editingId ? updatedOrder : o))
        setSelectedOrder(updatedOrder)
        toast.success("Order updated", { id: toastId, description: `${updatedOrder.orderNumber} was saved.` })
      } else {
        // Create new order via server action — discount is resolved server-side from
        // discountTypeId against DiscountTypeEntity, and VAT from SystemSettingEntity.
        // We never send a raw discount/tax amount.
        const res = await createOrderAction({
          tableId: form.tableId || null,
          customerId: form.customerId || null,
          orderType: form.orderType || "counter",
          discountTypeId: selectedDiscountTypeId,
          discountIdNumber: discountIdNumber || undefined,
          discountHolderName: discountHolderName || undefined,
          createdByStaffId: form.createdByStaffId || null,
          items: form.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.price,
            notes: item.notes || null,
          })),
        })

        if (!res.success) {
          throw new Error(res.error || "Failed to create order")
        }

        toast.success("Order placed", { id: toastId, description: `${res.data.orderNumber} was created.` })

        // Reload orders from backend to get complete data
        await loadData()
      }

      setSheetOpen(false)
    } catch (err) {
      toast.error("Save failed", {
        id: toastId,
        description: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteOrder(order: Order) {
    const toastId = toast.loading(`Deleting ${order.orderNumber}…`)
    const res = await deleteOrderAction(order.id)
    if (!res.success) {
      toast.error("Delete failed", { id: toastId, description: res.error })
      return
    }

    setOrders((current) => current.filter((item) => item.id !== order.id))
    setSelectedOrder(null)
    await loadData()
    toast.success("Order deleted", { id: toastId, description: `${order.orderNumber} was permanently removed.` })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 overflow-x-hidden pb-16 sm:pb-8">
      <Toaster richColors position="top-center" />
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Orders</h1>
              <Badge variant="secondary" className="rounded-full">{filteredOrders.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">Monitor incoming orders and keep the floor moving.</p>
          </div>
          <Button onClick={openCreateSheet} className="h-11 w-full bg-amber-500 font-semibold text-neutral-950 shadow-sm hover:bg-amber-400 sm:h-10 sm:w-auto">
            <Plus className="mr-2 size-4" />
            New order
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: "Awaiting action", value: orders.filter((o) => ["pending", "preparing"].includes(o.status)).length, icon: Clock3 },
            { label: "Ready to serve", value: orders.filter((o) => o.status === "ready").length, icon: PackageCheck },
            { label: "Today's orders", value: orders.length, icon: ShoppingBag },
            { label: "Sales today", value: formatCurrency(orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0)), icon: CreditCard },
          ].map((metric) => (
            <Card key={metric.label} className="border bg-card shadow-xs">
              <CardContent className="flex items-center gap-2 p-2.5 sm:p-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  <metric.icon className="size-3.5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[10px] font-medium text-muted-foreground">{metric.label}</p>
                  <p className="truncate text-sm font-bold sm:text-base">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border bg-card shadow-xs">
          <CardHeader className="gap-4 p-4 pb-3 sm:p-6 sm:pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-bold sm:text-lg">Order queue</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders…" className="h-10 pl-9 pr-9 text-sm" />
                {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>}
              </div>
            </div>
            <div className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="inline-flex h-10 w-max justify-start rounded-lg bg-muted p-1">
                  {tabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value} className="px-3 text-xs font-medium sm:px-4">{tab.label}</TabsTrigger>)}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrders.length ? (
              <div className="divide-y">
                {paginatedOrders.map((order) => (
                  <div key={order.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400"><Utensils className="size-5" /></div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{order.orderNumber}</p><Badge variant="outline" className="text-[10px]">{order.source}</Badge></div>
                        <p className="truncate text-xs text-muted-foreground">{order.table} · {order.customer} · {order.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="text-left sm:text-right"><p className="font-semibold">{formatCurrency(order.total)}</p><p className="text-xs text-muted-foreground">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p></div>
                      <Badge variant="outline" className={`min-w-24 justify-center text-[11px] ${statusClasses[order.status]}`}>{statusLabels[order.status]}</Badge>
                      <Button variant="ghost" size="icon-sm" onClick={() => setSelectedOrder(order)} aria-label={`View ${order.orderNumber}`}><Eye className="size-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="p-12 text-center text-sm text-muted-foreground">No orders match this view.</div>}
          </CardContent>
          {filteredOrders.length > pageSize && (
            <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon-sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Previous page">
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="px-2 text-xs font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="icon-sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} aria-label="Next page">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* NEW ORDER / EDIT ORDER — POS-style centered layout: category tabs + menu grid on the left, live cart + totals on the right */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto p-0 sm:!max-w-6xl lg:overflow-hidden">
          <SheetHeader className="border-b px-4 py-4 text-left sm:px-6">
            <SheetTitle>{editingId ? "Edit order" : "New order"}</SheetTitle>
            <SheetDescription>Tap menu items to build the cart, then confirm the order on the right.</SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
            {/* LEFT: catalog */}
            <div className="flex flex-col lg:flex-1 lg:overflow-hidden">
              <div className="space-y-3 border-b p-4 sm:p-6">
                <div className="flex items-center gap-2 rounded-full bg-muted p-1">
                  {(["counter", "qr"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, orderType: type }))}
                      className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                        form.orderType === type ? "bg-amber-500 text-neutral-950 shadow-sm" : "text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      {type === "counter" ? "Dine in / Counter" : "QR / Table order"}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Search menu…" className="h-10 bg-background pl-9" />
                </div>
                <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex w-max gap-2">
                    {posCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setActiveCategory(category.id)}
                        className={`flex min-w-20 flex-col items-center gap-0.5 rounded-xl border px-3 py-2 text-center transition ${
                          activeCategory === category.id
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-amber-200 bg-white text-amber-600 hover:border-amber-400 hover:bg-amber-50"
                        }`}
                      >
                        <span className="text-xs font-semibold">{category.label}</span>
                        <span className="text-[10px]">{category.count} items</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 lg:flex-1 lg:overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {filteredMenuItems.map((menuItem) => {
                    const existingIndex = form.items.findIndex((item) => item.menuItemId === menuItem.id)
                    const qty = existingIndex >= 0 ? form.items[existingIndex].quantity : 0
                    return (
                      <div
                        key={menuItem.id}
                        className={`flex min-h-32 flex-col justify-between rounded-xl border p-3 shadow-xs transition ${
                          qty > 0 ? "border-amber-500 ring-1 ring-amber-500/30 bg-amber-500/5" : "bg-background hover:border-amber-400"
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{menuItem.category}</span>
                          <p className="line-clamp-2 text-sm font-semibold leading-tight">{menuItem.name}</p>
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-bold text-amber-600">{formatCurrency(menuItem.price)}</p>
                          {qty > 0 ? (
                            <div className="flex items-center justify-between rounded-lg bg-amber-500 px-1.5 py-1">
                              <button
                                type="button"
                                aria-label={`Decrease ${menuItem.name}`}
                                onClick={() => changeItemQuantity(existingIndex, qty - 1)}
                                className="flex size-6 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                              >
                                −
                              </button>
                              <span className="text-sm font-bold text-white">{qty}</span>
                              <button
                                type="button"
                                aria-label={`Increase ${menuItem.name}`}
                                onClick={() => addMenuItem(menuItem.id)}
                                className="flex size-6 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => addMenuItem(menuItem.id)}
                              className="w-full border border-amber-500 bg-amber-50 font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              Add to Dish
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {!filteredMenuItems.length && (
                    <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No menu items match this search.</p>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: live cart + order details + totals */}
            <div className="flex w-full flex-col border-t bg-muted/10 lg:w-[380px] lg:shrink-0 lg:overflow-hidden lg:border-l lg:border-t-0">
              <div className="space-y-3 border-b p-4 sm:p-5">
                <div className="grid gap-1.5">
                  <Label htmlFor="order-number">Order number</Label>
                  <Input id="order-number" maxLength={30} value={form.orderNumber} onChange={(event) => setForm((current) => ({ ...current, orderNumber: event.target.value }))} placeholder="Auto-generated" disabled />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid min-w-0 gap-1.5">
                    <Label>Table</Label>
                    <Select
                      value={form.tableId ?? "none"}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          tableId: value === "none" ? null : value,
                          table: value === "none" ? "Counter" : tablesData.find((table) => table.id === value)?.tableNumber ?? "Table",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Select table">
                          {(val) => {
                            if (!val || val === "none") return "No table"
                            const t = tablesData.find((table) => table.id === val)
                            return t ? `${t.tableNumber} (Cap: ${t.capacity})` : form.table || "Table"
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No table</SelectItem>
                        {tablesData.map((table) => {
                          const isTaken = table.status !== "available" && table.id !== form.tableId
                          return (
                            <SelectItem key={table.id} value={table.id} disabled={isTaken}>
                              {table.tableNumber} (Cap: {table.capacity}){isTaken ? ` - ${table.status}` : ""}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid min-w-0 gap-1.5">
                    <Label>Customer</Label>
                    <Select value={form.customerId ?? "guest"} onValueChange={(value) => setForm((current) => ({ ...current, customerId: value === "guest" ? null : value, customer: value === "guest" ? "Guest checkout" : value }))}>
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Select customer">
                          {(val) => (val === "guest" || !val ? "Guest checkout" : val)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guest">Guest checkout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 lg:flex-1 lg:overflow-y-auto">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current order</p>
                  <span className="text-xs text-muted-foreground">{form.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                </div>
                {form.items.length ? (
                  <div className="space-y-1">
                    {form.items.map((item, index) => (
                      <div key={`${item.menuItemId ?? item.name}-${index}`} className="flex items-center gap-2 rounded-lg px-1 py-2 hover:bg-muted/40">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="outline" size="icon-sm" className="border-amber-500 text-amber-700 hover:bg-amber-50" onClick={() => changeItemQuantity(index, item.quantity - 1)} aria-label={`Decrease ${item.name}`}>−</Button>
                          <span className="w-5 text-center text-sm">{item.quantity}</span>
                          <Button type="button" variant="outline" size="icon-sm" className="border-amber-500 text-amber-700 hover:bg-amber-50" onClick={() => changeItemQuantity(index, item.quantity + 1)} aria-label={`Increase ${item.name}`}>+</Button>
                        </div>
                        <span className="w-16 shrink-0 text-right text-sm font-semibold">{formatCurrency(item.quantity * item.price)}</span>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${item.name}`} onClick={() => changeItemQuantity(index, 0)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">Tap menu cards on the left to start this order.</div>
                )}
              </div>

              <div className="space-y-3 border-t p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid min-w-0 gap-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as OrderStatus }))}>
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue>{(val) => statusLabels[val as OrderStatus] || val}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>{["pending", "preparing", "ready", "served", "completed", "cancelled"].map((status) => <SelectItem key={status} value={status}>{statusLabels[status as OrderStatus] || status}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid min-w-0 gap-1.5">
                    <Label>Staff</Label>
                    <Select value={form.createdByStaffId ?? "none"} onValueChange={(value) => setForm((current) => ({ ...current, createdByStaffId: value === "none" ? null : value }))}>
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue>{(val) => (!val || val === "none" ? "System / QR order" : val)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">System / QR order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Discount — picked from an active DiscountTypeEntity, amount is always
                    auto-computed (subtotal × percentage), never hand-typed. */}
                <div className="grid gap-1.5">
                  <Label>Discount</Label>
                  <Select value={selectedDiscountTypeId ?? "none"} onValueChange={selectDiscountType}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue>
                        {(val) =>
                          val === "none" || !val
                            ? "No discount"
                            : `${discountTypesData.find((d) => d.id === val)?.name ?? "Discount"} (${discountTypesData.find((d) => d.id === val)?.percentage ?? 0}%)`
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No discount</SelectItem>
                      {discountTypesData.map((discountType) => (
                        <SelectItem key={discountType.id} value={discountType.id}>
                          {discountType.name} ({discountType.percentage}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDiscountType && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid min-w-0 gap-1.5">
                      <Label htmlFor="discount-holder">Holder name</Label>
                      <Input
                        id="discount-holder"
                        value={discountHolderName}
                        onChange={(event) => setDiscountHolderName(event.target.value)}
                        placeholder="Full name on ID"
                      />
                    </div>
                    <div className="grid min-w-0 gap-1.5">
                      <Label htmlFor="discount-id-number">
                        ID number{selectedDiscountType.requiresIdVerification ? " *" : ""}
                      </Label>
                      <Input
                        id="discount-id-number"
                        value={discountIdNumber}
                        onChange={(event) => setDiscountIdNumber(event.target.value)}
                        placeholder={selectedDiscountType.requiresIdVerification ? "Required" : "Optional"}
                      />
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-muted/50 p-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sub Total</span><span>{formatCurrency(form.subtotal)}</span></div>
                  <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(form.discount)}</span></div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {storeInfo.vatEnabled ? `VAT (${storeInfo.vatRate}%)${storeInfo.vatInclusive ? " incl." : ""}` : "Tax"}
                    </span>
                    <span>{formatCurrency(form.tax)}</span>
                  </div>
                  <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold"><span>Total Amount</span><span>{formatCurrency(form.total)}</span></div>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row border-t bg-background p-4 sm:p-6">
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={isSubmitting} className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50">Cancel</Button>
            <Button onClick={saveOrder} disabled={isSubmitting} className="flex-1 bg-amber-500 font-semibold text-neutral-950 hover:bg-amber-400">
              {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {editingId ? "Save changes" : "Place Order"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          {selectedOrder && <>
            <SheetHeader className="border-b p-4 text-left sm:p-6">
              <div className="flex items-start justify-between gap-4 pr-8"><div><SheetTitle>{selectedOrder.orderNumber}</SheetTitle><SheetDescription>{selectedOrder.table} · {selectedOrder.source} · {selectedOrder.time}</SheetDescription></div><Badge variant="outline" className={statusClasses[selectedOrder.status]}>{statusLabels[selectedOrder.status]}</Badge></div>
            </SheetHeader>
            <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              <div><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order items</p><div className="space-y-3">{selectedOrder.items.map((item, idx) => <div key={`${item.name}-${idx}`} className="flex justify-between gap-3 text-sm"><span>{item.quantity} × {item.name}</span><span className="font-medium">{formatCurrency(item.quantity * item.price)}</span></div>)}</div><div className="mt-4 flex justify-between border-t pt-4 font-bold"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div></div>
              <div className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Customer</p><p className="mt-1 font-medium">{selectedOrder.customer}</p></div>
            </div>
            <SheetFooter className="border-t bg-background p-4 sm:p-6">
              {!(["completed", "cancelled"] as OrderStatus[]).includes(selectedOrder.status) && <Button onClick={() => openPayment(selectedOrder)} className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700"><CreditCard className="mr-2 size-4" />Take payment</Button>}
              <div className="grid w-full grid-cols-2 gap-2"><Button variant="outline" onClick={() => openEditSheet(selectedOrder)}><Pencil className="mr-2 size-4" />Edit</Button><Button variant="outline" onClick={() => deleteOrder(selectedOrder)} className="text-destructive hover:text-destructive"><Trash2 className="mr-2 size-4" />Delete</Button></div>
              {selectedOrder.status === "pending" && <Button onClick={() => updateStatus(selectedOrder, "preparing")} className="w-full bg-amber-500 font-semibold text-neutral-950 hover:bg-amber-400"><Utensils className="mr-2 size-4" />Start preparing</Button>}
              {selectedOrder.status === "preparing" && <Button onClick={() => updateStatus(selectedOrder, "ready")} className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700"><Check className="mr-2 size-4" />Mark ready</Button>}
              {selectedOrder.status === "ready" && <Button onClick={() => updateStatus(selectedOrder, "completed")} className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700"><PackageCheck className="mr-2 size-4" />Complete order</Button>}
              {["pending", "preparing"].includes(selectedOrder.status) && <Button variant="outline" onClick={() => updateStatus(selectedOrder, "cancelled")} className="w-full text-destructive hover:text-destructive"><Trash2 className="mr-2 size-4" />Void order</Button>}
              {selectedOrder.status === "completed" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setReceiptPayment(undefined)
                    setReceiptOrder(selectedOrder)
                  }}
                >
                  <ReceiptIcon className="mr-2 size-4" />
                  View digital receipt
                </Button>
              )}
            </SheetFooter>
          </>}
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(paymentOrder)} onOpenChange={(open) => !open && setPaymentOrder(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {paymentOrder && <>
            <SheetHeader className="border-b p-4 text-left sm:p-6">
              <SheetTitle>Take payment</SheetTitle>
              <SheetDescription>{paymentOrder.orderNumber} · Total {formatCurrency(paymentOrder.total)}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-1.5">
                <Label htmlFor="payment-amount">Amount received</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min={paymentOrder.total}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(Number(event.target.value) || 0)}
                  className="h-11"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Payment method</Label>
                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod((value ?? "cash") as typeof paymentMethod)}>
                  <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod !== "cash" && <div className="grid gap-1.5">
                <Label htmlFor="payment-reference">Reference number</Label>
                <Input
                  id="payment-reference"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  placeholder="Optional transaction reference"
                  className="h-11"
                />
              </div>}
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Change</span><span className="font-semibold">{formatCurrency(Math.max(0, paymentAmount - paymentOrder.total))}</span></div>
              </div>
            </div>
            <SheetFooter className="flex-row border-t bg-background p-4 sm:p-6">
              <Button variant="outline" onClick={() => setPaymentOrder(null)} disabled={isPaying} className="flex-1">Cancel</Button>
              <Button onClick={savePayment} disabled={isPaying} className="flex-1 bg-emerald-600 font-semibold text-white hover:bg-emerald-700">
                {isPaying ? <Loader2 className="size-4 animate-spin" /> : "Confirm payment"}
              </Button>
            </SheetFooter>
          </>}
        </SheetContent>
      </Sheet>

      {/* Digital receipt — opens for "View digital receipt" on a completed order,
          and automatically right after a payment is recorded (see savePayment). */}
      <Sheet open={Boolean(receiptOrder)} onOpenChange={(open) => !open && closeReceipt()}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          {receiptOrder && (
            <>
              <SheetHeader className="border-b p-4 text-left sm:p-6">
                <SheetTitle>{receiptPayment ? "Payment successful" : "Digital receipt"}</SheetTitle>
                <SheetDescription>
                  {receiptOrder.orderNumber} · {receiptPayment ? "Show or print this for the customer." : "A copy of this order's receipt."}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <DigitalReceipt store={storeInfo} order={receiptOrder} payment={receiptPayment} />
              </div>
              <SheetFooter className="flex-row border-t bg-background p-4 sm:p-6">
                <Button variant="outline" onClick={closeReceipt} className="flex-1">
                  Close
                </Button>
                <Button onClick={() => window.print()} className="flex-1 bg-amber-500 font-semibold text-neutral-950 hover:bg-amber-400">
                  <Printer className="mr-2 size-4" />
                  Print
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}