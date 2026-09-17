// apps/admin/src/app/(dashboard)/tables/page.tsx
"use client"

import { useMemo, useState } from "react"
import {
  Armchair,
  Copy,
  Download,
  Pencil,
  Plus,
  QrCode,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Toaster } from "@/components/ui/sonner"

// ---------------------------------------------------------------------------
// Types — mirrors `restaurant_tables` (id, table_number, capacity,
// qr_code_url, status)
// ---------------------------------------------------------------------------

type TableStatus = "available" | "occupied" | "reserved"

interface RestaurantTable {
  id: string
  tableNumber: string
  capacity: number
  qrCodeUrl: string
  status: TableStatus
}

type TableFormValues = Omit<RestaurantTable, "id" | "qrCodeUrl">

const emptyForm: TableFormValues = {
  tableNumber: "",
  capacity: 2,
  status: "available",
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const ORDER_BASE_URL = "https://order.primepos.app/t"

function buildQrUrl(tableId: string) {
  return `${ORDER_BASE_URL}/${tableId}`
}

const MOCK_TABLES: RestaurantTable[] = [
  { id: "table-1", tableNumber: "Table 1", capacity: 2, qrCodeUrl: buildQrUrl("table-1"), status: "available" },
  { id: "table-2", tableNumber: "Table 2", capacity: 4, qrCodeUrl: buildQrUrl("table-2"), status: "occupied" },
  { id: "table-4", tableNumber: "Table 4", capacity: 4, qrCodeUrl: buildQrUrl("table-4"), status: "occupied" },
  { id: "table-6", tableNumber: "Table 6", capacity: 6, qrCodeUrl: buildQrUrl("table-6"), status: "reserved" },
  { id: "table-7", tableNumber: "Table 7", capacity: 2, qrCodeUrl: buildQrUrl("table-7"), status: "available" },
  { id: "table-9", tableNumber: "Table 9", capacity: 4, qrCodeUrl: buildQrUrl("table-9"), status: "occupied" },
  { id: "table-10", tableNumber: "Table 10", capacity: 8, qrCodeUrl: buildQrUrl("table-10"), status: "available" },
  { id: "table-12", tableNumber: "Table 12", capacity: 2, qrCodeUrl: buildQrUrl("table-12"), status: "available" },
]

const statusLabels: Record<TableStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
}

const statusClasses: Record<TableStatus, string> = {
  available: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  occupied: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  reserved: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400",
}

const statusTabs: { value: "all" | TableStatus; label: string }[] = [
  { value: "all", label: "All tables" },
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "reserved", label: "Reserved" },
]

// ---------------------------------------------------------------------------
// Decorative QR preview — deterministic pattern derived from the table id so
// each card gets a distinct-looking code. Swap for a real QR-generation call
// (e.g. against qrCodeUrl) once the backend endpoint exists.
// ---------------------------------------------------------------------------

function QrPreview({ seed, className }: { seed: string; className?: string }) {
  const cells = useMemo(() => {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
    }
    const size = 7
    const grid: boolean[] = []
    for (let i = 0; i < size * size; i++) {
      hash = (hash * 1103515245 + 12345) >>> 0
      grid.push(((hash >> 16) & 1) === 1)
    }
    return { size, grid }
  }, [seed])

  const finderPositions = [
    [0, 0],
    [0, cells.size - 3],
    [cells.size - 3, 0],
  ]

  function isFinder(row: number, col: number) {
    return finderPositions.some(([fr, fc]) => row >= fr && row < fr + 3 && col >= fc && col < fc + 3)
  }

  return (
    <div
      className={`grid aspect-square gap-[2px] rounded-md bg-foreground p-2 ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(${cells.size}, minmax(0, 1fr))` }}
    >
      {cells.grid.map((filled, index) => {
        const row = Math.floor(index / cells.size)
        const col = index % cells.size
        const on = isFinder(row, col) || filled
        return <div key={index} className={`rounded-[1px] ${on ? "bg-background" : "bg-foreground"}`} />
      })}
    </div>
  )
}

function formatCapacity(capacity: number) {
  return `${capacity} ${capacity === 1 ? "seat" : "seats"}`
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>(MOCK_TABLES)
  const [activeTab, setActiveTab] = useState<"all" | TableStatus>("all")
  const [search, setSearch] = useState("")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TableFormValues>(emptyForm)

  const [qrPreviewTable, setQrPreviewTable] = useState<RestaurantTable | null>(null)

  const filteredTables = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tables.filter((table) => {
      const matchesTab = activeTab === "all" || table.status === activeTab
      const matchesSearch = !query || table.tableNumber.toLowerCase().includes(query)
      return matchesTab && matchesSearch
    })
  }, [tables, activeTab, search])

  const counts = useMemo(
    () => ({
      total: tables.length,
      available: tables.filter((t) => t.status === "available").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      reserved: tables.filter((t) => t.status === "reserved").length,
    }),
    [tables],
  )

  function openCreateSheet() {
    setEditingId(null)
    setForm(emptyForm)
    setSheetOpen(true)
  }

  function openEditSheet(table: RestaurantTable) {
    setEditingId(table.id)
    setForm({ tableNumber: table.tableNumber, capacity: table.capacity, status: table.status })
    setSheetOpen(true)
  }

  function saveTable() {
    if (!form.tableNumber.trim()) {
      toast.error("Table number is required")
      return
    }

    if (editingId) {
      setTables((current) =>
        current.map((table) => (table.id === editingId ? { ...table, ...form } : table)),
      )
      toast.success("Table updated", { description: `${form.tableNumber} was saved.` })
    } else {
      const id = crypto.randomUUID()
      const newTable: RestaurantTable = { id, ...form, qrCodeUrl: buildQrUrl(id) }
      setTables((current) => [...current, newTable])
      toast.success("Table added", { description: `${form.tableNumber} is ready — QR code generated.` })
    }
    setSheetOpen(false)
  }

  function deleteTable(table: RestaurantTable) {
    setTables((current) => current.filter((item) => item.id !== table.id))
    toast.success("Table removed", { description: `${table.tableNumber} and its QR code were deleted.` })
  }

  function copyLink(url: string) {
    navigator.clipboard?.writeText(url)
    toast.success("Link copied", { description: url })
  }

  return (
    <div className="w-full min-w-0 overflow-x-hidden pb-16 sm:pb-8">
      <Toaster richColors position="top-center" />
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">QR &amp; Table Setup</h1>
              <Badge variant="secondary" className="rounded-full">{filteredTables.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Manage dining tables and generate the QR codes customers scan to order.
            </p>
          </div>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button onClick={openCreateSheet} className="h-11 w-full bg-amber-500 font-semibold text-neutral-950 shadow-sm hover:bg-amber-400 sm:h-10 sm:w-auto">
                  <Plus className="mr-2 size-4" />
                  Add table
                </Button>
              }
            />
            <SheetContent side="right" className="w-full p-0 sm:max-w-md">
              <SheetHeader className="border-b p-4 text-left sm:p-6">
                <SheetTitle>{editingId ? "Edit table" : "New table"}</SheetTitle>
                <SheetDescription>
                  {editingId
                    ? "Update the table's number, capacity, or status."
                    : "A QR code linking to the customer ordering page is generated automatically."}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-1.5">
                  <Label htmlFor="table-number">Table number</Label>
                  <Input
                    id="table-number"
                    value={form.tableNumber}
                    onChange={(event) => setForm((current) => ({ ...current, tableNumber: event.target.value }))}
                    placeholder="e.g. Table 14"
                    className="h-11 sm:h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={form.capacity}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, capacity: Number(event.target.value) || 1 }))
                      }
                      className="h-11 sm:h-10"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) =>
                        setForm((current) => ({ ...current, status: (value ?? current.status) as TableStatus }))
                      }
                    >
                      <SelectTrigger className="h-11 w-full sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(statusLabels) as TableStatus[]).map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusLabels[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {editingId && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Ordering link</p>
                    <p className="mt-1 truncate text-sm font-medium">
                      {buildQrUrl(editingId)}
                    </p>
                  </div>
                )}
              </div>

              <SheetFooter className="flex-row border-t bg-background p-4 sm:p-6">
                <SheetClose
                  render={
                    <Button variant="outline" className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50">
                      Cancel
                    </Button>
                  }
                />
                <Button onClick={saveTable} className="flex-1 bg-amber-500 font-semibold text-neutral-950 hover:bg-amber-400">
                  {editingId ? "Save changes" : "Create table"}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: "Total tables", value: counts.total, icon: Armchair },
            { label: "Available", value: counts.available, icon: Armchair },
            { label: "Occupied", value: counts.occupied, icon: Armchair },
            { label: "Reserved", value: counts.reserved, icon: Armchair },
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

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | TableStatus)}>
              <TabsList className="inline-flex h-10 w-max justify-start rounded-lg bg-muted p-1">
                {statusTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="px-3 text-xs font-medium sm:px-4">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tables…"
              className="h-10 pl-9 pr-9 text-sm"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table grid */}
        {filteredTables.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTables.map((table) => (
              <Card key={table.id} className="flex h-full flex-col overflow-hidden border bg-card shadow-xs">
                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{table.tableNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatCapacity(table.capacity)}</p>
                    </div>
                    <Badge variant="outline" className={`text-[11px] ${statusClasses[table.status]}`}>
                      {statusLabels[table.status]}
                    </Badge>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQrPreviewTable(table)}
                    className="group relative mx-auto w-28 transition hover:opacity-90"
                    aria-label={`View QR code for ${table.tableNumber}`}
                  >
                    <QrPreview seed={table.id} />
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/0 opacity-0 transition group-hover:bg-background/70 group-hover:opacity-100">
                      <QrCode className="size-5 text-foreground" />
                    </div>
                  </button>
                </CardContent>

                <CardFooter className="flex items-center justify-between gap-2 border-t p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
                    onClick={() => setQrPreviewTable(table)}
                  >
                    <QrCode className="mr-1.5 size-3.5" />
                    View QR
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEditSheet(table)} aria-label={`Edit ${table.tableNumber}`}>
                    <Pencil className="size-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" aria-label={`Delete ${table.tableNumber}`}>
                          <Trash2 className="size-4" />
                        </Button>
                      }
                    />
                    <AlertDialogContent className="w-[90vw] max-w-md rounded-xl sm:rounded-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {table.tableNumber}?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs sm:text-sm">
                          This removes the table and invalidates its QR code. Any printed copies will stop working.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                        <AlertDialogCancel className="mt-0 w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTable(table)}
                          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No tables match this view.
          </div>
        )}
      </div>

      {/* QR preview dialog */}
      <Dialog open={Boolean(qrPreviewTable)} onOpenChange={(open) => !open && setQrPreviewTable(null)}>
        <DialogContent className="w-[90vw] max-w-sm rounded-xl sm:rounded-lg">
          {qrPreviewTable && (
            <>
              <DialogHeader>
                <DialogTitle>{qrPreviewTable.tableNumber} — QR code</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-2">
                <QrPreview seed={qrPreviewTable.id} className="w-48" />
                <p className="break-all text-center text-xs text-muted-foreground">{qrPreviewTable.qrCodeUrl}</p>
                <div className="grid w-full grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => copyLink(qrPreviewTable.qrCodeUrl)} className="border-amber-500 text-amber-700 hover:bg-amber-50">
                    <Copy className="mr-1.5 size-4" />
                    Copy link
                  </Button>
                  <Button className="bg-amber-500 font-semibold text-neutral-950 hover:bg-amber-400">
                    <Download className="mr-1.5 size-4" />
                    Download
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}