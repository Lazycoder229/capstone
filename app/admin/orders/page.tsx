"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  Pencil,
  PackageCheck,
  Plus,
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

 type OrderStatus = "pending" | "preparing" | "ready" | "served" | "completed" | "cancelled"
 type OrderSource = "QR" | "Counter"
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
  items: { menuItemId?: string; name: string; quantity: number; price: number; subtotal?: number; notes?: string | null }[]
}

type OrderForm = Omit<Order, "id" | "table" | "time"> & { table: string }

const tables = [{ id: "table-4", label: "Table 4" }, { id: "table-9", label: "Table 9" }, { id: "table-2", label: "Table 2" }]
const customers = [{ id: "customer-santos", label: "Santos family" }, { id: "customer-mia", label: "Mia Navarro" }, { id: "customer-reyes", label: "Reyes birthday" }]
const staff = [{ id: "staff-admin", label: "Admin User" }, { id: "staff-cashier", label: "Cashier" }]
const menuItems = [
  { id: "item-whole", name: "Whole Litson Manok", category: "Litson Manok", price: 420 },
  { id: "item-half", name: "Half Litson Manok", category: "Litson Manok", price: 230 },
  { id: "item-rice", name: "Java Rice", category: "Sides", price: 45 },
  { id: "item-tea", name: "Iced Tea", category: "Beverages", price: 35 },
  { id: "item-lumpia", name: "Lumpia", category: "Sides", price: 75 },
  { id: "item-halo", name: "Halo-halo", category: "Desserts", price: 85 },
]
const emptyForm: OrderForm = { orderNumber: "", tableId: null, customerId: null, orderType: "counter", table: "Counter", source: "Counter", customer: "Guest checkout", status: "pending", subtotal: 0, discount: 0, tax: 0, total: 0, createdByStaffId: "staff-admin", items: [] }

const initialOrders: Order[] = [
  {
    id: "ORD-1048",
    orderNumber: "ORD-1048",
    tableId: "table-4",
    customerId: "customer-santos",
    orderType: "qr",
    table: "Table 4",
    source: "QR",
    customer: "Santos family",
    time: "12:42 PM",
    status: "preparing",
    subtotal: 615,
    discount: 0,
    tax: 0,
    total: 615,
    createdByStaffId: null,
    items: [
      { name: "Whole Litson Manok", quantity: 1, price: 420 },
      { name: "Java Rice", quantity: 2, price: 45 },
      { name: "Iced Tea", quantity: 3, price: 35 },
    ],
  },
  {
    id: "ORD-1047",
    orderNumber: "ORD-1047",
    tableId: null,
    customerId: "customer-mia",
    orderType: "counter",
    table: "Counter #22",
    source: "Counter",
    customer: "Mia Navarro",
    time: "12:38 PM",
    status: "ready",
    subtotal: 275,
    discount: 0,
    tax: 0,
    total: 275,
    createdByStaffId: "staff-cashier",
    items: [
      { name: "Half Litson Manok", quantity: 1, price: 230 },
      { name: "Java Rice", quantity: 1, price: 45 },
    ],
  },
  {
    id: "ORD-1046",
    orderNumber: "ORD-1046",
    tableId: "table-9",
    customerId: null,
    orderType: "qr",
    table: "Table 9",
    source: "QR",
    customer: "Walk-in guest",
    time: "12:31 PM",
    status: "pending",
    subtotal: 530,
    discount: 0,
    tax: 0,
    total: 530,
    createdByStaffId: null,
    items: [
      { name: "Whole Litson Manok", quantity: 1, price: 420 },
      { name: "Lumpia", quantity: 1, price: 75 },
      { name: "Iced Tea", quantity: 1, price: 35 },
    ],
  },
  {
    id: "ORD-1045",
    orderNumber: "ORD-1045",
    tableId: "table-2",
    customerId: "customer-reyes",
    orderType: "qr",
    table: "Table 2",
    source: "QR",
    customer: "Reyes birthday",
    time: "11:58 AM",
    status: "completed",
    subtotal: 890,
    discount: 0,
    tax: 0,
    total: 890,
    createdByStaffId: null,
    items: [
      { name: "Whole Litson Manok", quantity: 2, price: 420 },
      { name: "Iced Tea", quantity: 1, price: 35 },
      { name: "Halo-halo", quantity: 1, price: 15 },
    ],
  },
  {
    id: "ORD-1044",
    orderNumber: "ORD-1044",
    tableId: null,
    customerId: null,
    orderType: "counter",
    table: "Counter #21",
    source: "Counter",
    customer: "Juan Dela Cruz",
    time: "11:40 AM",
    status: "cancelled",
    subtotal: 320,
    discount: 0,
    tax: 0,
    total: 320,
    createdByStaffId: "staff-cashier",
    items: [{ name: "Half Litson Manok", quantity: 1, price: 230 }],
  },
]

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

export default function OrdersPage() {
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState("live")
  const [search, setSearch] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<OrderForm>(emptyForm)
  const [menuSearch, setMenuSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [page, setPage] = useState(1)
  const pageSize = 6

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesSearch = !query || [order.id, order.table, order.customer]
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

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    menuItems.forEach((item) => counts.set(item.category, (counts.get(item.category) ?? 0) + 1))
    return [
      { id: "all", label: "All", count: menuItems.length },
      ...Array.from(counts.entries()).map(([label, count]) => ({ id: label, label, count })),
    ]
  }, [])

  const filteredMenuItems = useMemo(
    () =>
      menuItems.filter(
        (item) =>
          (activeCategory === "all" || item.category === activeCategory) &&
          item.name.toLowerCase().includes(menuSearch.trim().toLowerCase()),
      ),
    [menuSearch, activeCategory],
  )

  function updateStatus(order: Order, status: OrderStatus) {
    setOrders((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status } : item)),
    )
    setSelectedOrder((current) => (current?.id === order.id ? { ...current, status } : current))
    toast.success(`${order.id} marked ${statusLabels[status].toLowerCase()}`)
  }

  function openCreateSheet() {
    setEditingId(null)
    setForm({ ...emptyForm, orderNumber: `ORD-${1050 + orders.length}` })
    setActiveCategory("all")
    setMenuSearch("")
    setSheetOpen(true)
  }

  function openEditSheet(order: Order) {
    setEditingId(order.id)
    setForm({ ...order, orderNumber: order.orderNumber, table: order.table })
    setActiveCategory("all")
    setMenuSearch("")
    setSheetOpen(true)
  }

  function updateFormItems(items: OrderForm["items"]) {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    setForm((current) => ({ ...current, items, subtotal, total: subtotal - current.discount + current.tax }))
  }

  function addMenuItem(menuItemId: string | null) {
    if (!menuItemId) return
    const menuItem = menuItems.find((item) => item.id === menuItemId)
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

  function updateAmount(field: "discount" | "tax", value: number) {
    setForm((current) => ({ ...current, [field]: value, total: current.subtotal - (field === "discount" ? value : current.discount) + (field === "tax" ? value : current.tax) }))
  }

  function saveOrder() {
    if (!form.orderNumber.trim()) {
      toast.error("Order number is required")
      return
    }

    const nextOrder: Order = {
      ...form,
      id: editingId ?? crypto.randomUUID(),
      time: editingId ? orders.find((order) => order.id === editingId)?.time ?? "Just now" : "Just now",
      source: form.orderType === "qr" ? "QR" : "Counter",
      customer: form.customerId ? customers.find((customer) => customer.id === form.customerId)?.label ?? "Guest" : "Guest checkout",
    }
    setOrders((current) => editingId ? current.map((order) => order.id === editingId ? nextOrder : order) : [nextOrder, ...current])
    setSheetOpen(false)
    setSelectedOrder(nextOrder)
    toast.success(editingId ? "Order updated" : "Order created", { description: `${nextOrder.orderNumber} was saved.` })
  }

  function deleteOrder(order: Order) {
    setOrders((current) => current.filter((item) => item.id !== order.id))
    setSelectedOrder(null)
    toast.success("Order deleted", { description: `${order.orderNumber} was removed from the static list.` })
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
            { label: "Today’s orders", value: orders.length, icon: ShoppingBag },
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
                        <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{order.id}</p><Badge variant="outline" className="text-[10px]">{order.source}</Badge></div>
                        <p className="truncate text-xs text-muted-foreground">{order.table} · {order.customer} · {order.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="text-left sm:text-right"><p className="font-semibold">{formatCurrency(order.total)}</p><p className="text-xs text-muted-foreground">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p></div>
                      <Badge variant="outline" className={`min-w-24 justify-center text-[11px] ${statusClasses[order.status]}`}>{statusLabels[order.status]}</Badge>
                      <Button variant="ghost" size="icon-sm" onClick={() => setSelectedOrder(order)} aria-label={`View ${order.id}`}><Eye className="size-4" /></Button>
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
                    {categories.map((category) => (
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
                  <Input id="order-number" maxLength={30} value={form.orderNumber} onChange={(event) => setForm((current) => ({ ...current, orderNumber: event.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Table</Label>
                    <Select
                      value={form.tableId ?? "none"}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          tableId: value === "none" ? null : value,
                          table: value === "none" ? "Counter" : tables.find((table) => table.id === value)?.label ?? "Table",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No table</SelectItem>
                        {tables.map((table) => <SelectItem key={table.id} value={table.id}>{table.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Customer</Label>
                    <Select value={form.customerId ?? "guest"} onValueChange={(value) => setForm((current) => ({ ...current, customerId: value === "guest" ? null : value }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guest">Guest checkout</SelectItem>
                        {customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.label}</SelectItem>)}
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
                  <div className="grid gap-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as OrderStatus }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{["pending", "preparing", "ready", "served", "completed", "cancelled"].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Staff</Label>
                    <Select value={form.createdByStaffId ?? "none"} onValueChange={(value) => setForm((current) => ({ ...current, createdByStaffId: value === "none" ? null : value }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">System / QR order</SelectItem>
                        {staff.map((member) => <SelectItem key={member.id} value={member.id}>{member.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["discount", "tax"] as const).map((field) => (
                    <div key={field} className="grid gap-1.5">
                      <Label htmlFor={`order-${field}`}>{field[0].toUpperCase() + field.slice(1)}</Label>
                      <Input id={`order-${field}`} type="number" min="0" step="0.01" value={form[field]} onChange={(event) => updateAmount(field, Number(event.target.value) || 0)} />
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sub Total</span><span>{formatCurrency(form.subtotal)}</span></div>
                  <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(form.discount)}</span></div>
                  <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(form.tax)}</span></div>
                  <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold"><span>Total Amount</span><span>{formatCurrency(form.total)}</span></div>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row border-t bg-background p-4 sm:p-6">
            <Button variant="outline" onClick={() => setSheetOpen(false)} className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50">Cancel</Button>
            <Button onClick={saveOrder} className="flex-1 bg-amber-500 font-semibold text-neutral-950 hover:bg-amber-400">
              {editingId ? "Save changes" : "Place Order"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          {selectedOrder && <>
            <SheetHeader className="border-b p-4 text-left sm:p-6">
              <div className="flex items-start justify-between gap-4 pr-8"><div><SheetTitle>{selectedOrder.id}</SheetTitle><SheetDescription>{selectedOrder.table} · {selectedOrder.source} · {selectedOrder.time}</SheetDescription></div><Badge variant="outline" className={statusClasses[selectedOrder.status]}>{statusLabels[selectedOrder.status]}</Badge></div>
            </SheetHeader>
            <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              <div><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order items</p><div className="space-y-3">{selectedOrder.items.map((item) => <div key={item.name} className="flex justify-between gap-3 text-sm"><span>{item.quantity} × {item.name}</span><span className="font-medium">{formatCurrency(item.quantity * item.price)}</span></div>)}</div><div className="mt-4 flex justify-between border-t pt-4 font-bold"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div></div>
              <div className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Customer</p><p className="mt-1 font-medium">{selectedOrder.customer}</p></div>
            </div>
            <SheetFooter className="border-t bg-background p-4 sm:p-6">
              <div className="grid w-full grid-cols-2 gap-2"><Button variant="outline" onClick={() => openEditSheet(selectedOrder)}><Pencil className="mr-2 size-4" />Edit</Button><Button variant="outline" onClick={() => deleteOrder(selectedOrder)} className="text-destructive hover:text-destructive"><Trash2 className="mr-2 size-4" />Delete</Button></div>
              {selectedOrder.status === "pending" && <Button onClick={() => updateStatus(selectedOrder, "preparing")} className="w-full bg-amber-500 font-semibold text-neutral-950 hover:bg-amber-400"><Utensils className="mr-2 size-4" />Start preparing</Button>}
              {selectedOrder.status === "preparing" && <Button onClick={() => updateStatus(selectedOrder, "ready")} className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700"><Check className="mr-2 size-4" />Mark ready</Button>}
              {selectedOrder.status === "ready" && <Button onClick={() => updateStatus(selectedOrder, "completed")} className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700"><PackageCheck className="mr-2 size-4" />Complete order</Button>}
              {["pending", "preparing"].includes(selectedOrder.status) && <Button variant="outline" onClick={() => updateStatus(selectedOrder, "cancelled")} className="w-full text-destructive hover:text-destructive"><Trash2 className="mr-2 size-4" />Void order</Button>}
              {selectedOrder.status === "completed" && <Button variant="outline" className="w-full"><CreditCard className="mr-2 size-4" />View digital receipt</Button>}
            </SheetFooter>
          </>}
        </SheetContent>
      </Sheet>
    </div>
  )
}