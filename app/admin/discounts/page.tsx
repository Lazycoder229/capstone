"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BadgePercent,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Toaster } from "@/components/ui/sonner"
import {
  createDiscountTypeAction,
  createPromotionAction,
  deleteDiscountTypeAction,
  deletePromotionAction,
  fetchDiscounts,
  updateDiscountTypeAction,
  updatePromotionAction,
} from "@/app/actions/discounts"
import { fetchMenuItems } from "@/app/actions/menu"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiscountType {
  id: string
  name: string
  percentage: number
  requiresIdVerification: boolean
  isActive: boolean
}

type DiscountTypeForm = Omit<DiscountType, "id">

type PromoType = "percentage" | "fixed_amount" | "buy_x_get_y"

interface Promotion {
  id: string
  name: string
  description: string | null
  promoType: PromoType
  discountValue: number | null
  minSpend: number | null
  startDate: string
  endDate: string
  usageLimit: number | null
  usageCount: number
  isActive: boolean
  createdByStaffId: string
  menuItemIds: string[]
}

type PromotionForm = Omit<Promotion, "id" | "usageCount" | "createdByStaffId">

interface MenuItemOption {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (d: Date) => d.toISOString().split("T")[0]
const today = new Date()
const addDays = (d: Date, n: number) => {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function formatCurrency(value: number) {
  return `₱${value.toLocaleString("en-PH")}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function promoTypeLabel(type: PromoType) {
  return type === "percentage"
    ? "Percentage off"
    : type === "fixed_amount"
    ? "Fixed amount off"
    : "Buy X Get Y"
}

function promoValueLabel(promo: Promotion) {
  if (promo.promoType === "percentage" && promo.discountValue != null)
    return `${promo.discountValue}% off`
  if (promo.promoType === "fixed_amount" && promo.discountValue != null)
    return `${formatCurrency(promo.discountValue)} off`
  return "—"
}

function promoStatus(promo: Promotion): "active" | "scheduled" | "expired" | "inactive" {
  if (!promo.isActive) return "inactive"
  const now = fmt(today)
  if (promo.endDate < now) return "expired"
  if (promo.startDate > now) return "scheduled"
  return "active"
}

const promoStatusLabels: Record<string, string> = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  inactive: "Inactive",
}

const promoStatusClasses: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  scheduled: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  expired: "bg-muted text-muted-foreground border-border",
  inactive: "bg-destructive/10 text-destructive border-destructive/20",
}

// ---------------------------------------------------------------------------
// Empty forms
// ---------------------------------------------------------------------------

const emptyDiscountForm: DiscountTypeForm = {
  name: "",
  percentage: 20,
  requiresIdVerification: true,
  isActive: true,
}

const emptyPromoForm: PromotionForm = {
  name: "",
  description: null,
  promoType: "percentage",
  discountValue: null,
  minSpend: null,
  startDate: fmt(today),
  endDate: fmt(addDays(today, 30)),
  usageLimit: null,
  isActive: true,
  menuItemIds: [],
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const promoTabs = [
  { value: "all", label: "All promos" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired / Inactive" },
]

const pageTabs = [
  { value: "promos", label: "Promotions" },
  { value: "discounts", label: "Discount types" },
]

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DiscountsPage() {
  const [pageTab, setPageTab] = useState("promos")

  // ---- Data state ----
  const [promos, setPromos] = useState<Promotion[]>([])
  const [discounts, setDiscounts] = useState<DiscountType[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ---- Promo UI state ----
  const [promoTab, setPromoTab] = useState("all")
  const [promoSearch, setPromoSearch] = useState("")
  const [promoPage, setPromoPage] = useState(1)
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null)
  const [promoSheetOpen, setPromoSheetOpen] = useState(false)
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null)
  const [promoForm, setPromoForm] = useState<PromotionForm>(emptyPromoForm)

  // ---- Discount UI state ----
  const [discountSearch, setDiscountSearch] = useState("")
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountType | null>(null)
  const [discountSheetOpen, setDiscountSheetOpen] = useState(false)
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null)
  const [discountForm, setDiscountForm] = useState<DiscountTypeForm>(emptyDiscountForm)

  const pageSize = 6

  // ---------------------------------------------------------------------------
  // Load data from server
  // ---------------------------------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [discountsRes, menuRes] = await Promise.all([fetchDiscounts(), fetchMenuItems()])

      if (discountsRes.success) {
        setDiscounts(discountsRes.data.discountTypes as DiscountType[])
        setPromos(discountsRes.data.promotions as Promotion[])
      } else {
        toast.error("Failed to load data", { description: (discountsRes as any).error })
      }

      if (menuRes.success) {
        setMenuItems((menuRes.data as any[]).map((m) => ({ id: m.id, name: m.name })))
      }
    } catch (err: any) {
      toast.error("Failed to load data", { description: err.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ---------------------------------------------------------------------------
  // Filtering + pagination
  // ---------------------------------------------------------------------------

  const filteredPromos = useMemo(() => {
    const query = promoSearch.trim().toLowerCase()
    return promos.filter((p) => {
      const matchesSearch =
        !query ||
        [p.name, p.description ?? "", promoTypeLabel(p.promoType)]
          .join(" ")
          .toLowerCase()
          .includes(query)
      const ps = promoStatus(p)
      const matchesTab =
        promoTab === "all"
          ? true
          : promoTab === "active"
          ? ps === "active"
          : promoTab === "scheduled"
          ? ps === "scheduled"
          : ps === "expired" || ps === "inactive"
      return matchesSearch && matchesTab
    })
  }, [promos, promoTab, promoSearch])

  const totalPromoPages = Math.max(1, Math.ceil(filteredPromos.length / pageSize))
  const paginatedPromos = useMemo(
    () => filteredPromos.slice((promoPage - 1) * pageSize, promoPage * pageSize),
    [filteredPromos, promoPage],
  )

  useEffect(() => { setPromoPage(1) }, [promoTab, promoSearch])

  const filteredDiscounts = useMemo(() => {
    const query = discountSearch.trim().toLowerCase()
    return discounts.filter(
      (d) => !query || d.name.toLowerCase().includes(query),
    )
  }, [discounts, discountSearch])

  const counts = useMemo(() => ({
    active: promos.filter((p) => promoStatus(p) === "active").length,
    scheduled: promos.filter((p) => promoStatus(p) === "scheduled").length,
    totalUsage: promos.reduce((sum, p) => sum + p.usageCount, 0),
    discountTypes: discounts.filter((d) => d.isActive).length,
  }), [promos, discounts])

  // ---------------------------------------------------------------------------
  // Promo CRUD
  // ---------------------------------------------------------------------------

  function openCreatePromo() {
    setEditingPromoId(null)
    setPromoForm(emptyPromoForm)
    setPromoSheetOpen(true)
  }

  function openEditPromo(promo: Promotion) {
    setEditingPromoId(promo.id)
    setPromoForm({
      name: promo.name,
      description: promo.description,
      promoType: promo.promoType,
      discountValue: promo.discountValue,
      minSpend: promo.minSpend,
      startDate: promo.startDate,
      endDate: promo.endDate,
      usageLimit: promo.usageLimit,
      isActive: promo.isActive,
      menuItemIds: promo.menuItemIds,
    })
    setPromoSheetOpen(true)
  }

  async function savePromo() {
    if (!promoForm.name.trim()) {
      toast.error("Promo name is required")
      return
    }
    if (promoForm.endDate < promoForm.startDate) {
      toast.error("End date must be after start date")
      return
    }

    setSaving(true)
    try {
      if (editingPromoId) {
        const result = await updatePromotionAction({ id: editingPromoId, ...promoForm })
        if (!result.success) {
          toast.error("Failed to update promotion", { description: result.error })
          return
        }
        toast.success("Promotion updated", { description: `${promoForm.name} was saved.` })
      } else {
        const result = await createPromotionAction(promoForm)
        if (!result.success) {
          toast.error("Failed to create promotion", { description: result.error })
          return
        }
        toast.success("Promotion created", { description: `${promoForm.name} is now live.` })
      }
      setPromoSheetOpen(false)
      await loadData()
    } catch (err: any) {
      toast.error("Something went wrong", { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function deletePromo(promo: Promotion) {
    try {
      const result = await deletePromotionAction(promo.id)
      if (!result.success) {
        toast.error("Failed to delete promotion", { description: result.error })
        return
      }
      setSelectedPromo(null)
      toast.success("Promotion deleted", { description: `${promo.name} was removed.` })
      await loadData()
    } catch (err: any) {
      toast.error("Something went wrong", { description: err.message })
    }
  }

  async function togglePromoActive(promo: Promotion) {
    try {
      const next = !promo.isActive
      const result = await updatePromotionAction({ id: promo.id, isActive: next })
      if (!result.success) {
        toast.error("Failed to update promotion", { description: result.error })
        return
      }
      toast.success(next ? `${promo.name} activated` : `${promo.name} deactivated`)
      await loadData()
      setSelectedPromo((current) => (current?.id === promo.id ? { ...current, isActive: next } : current))
    } catch (err: any) {
      toast.error("Something went wrong", { description: err.message })
    }
  }

  // ---------------------------------------------------------------------------
  // Discount CRUD
  // ---------------------------------------------------------------------------

  function openCreateDiscount() {
    setEditingDiscountId(null)
    setDiscountForm(emptyDiscountForm)
    setDiscountSheetOpen(true)
  }

  function openEditDiscount(discount: DiscountType) {
    setEditingDiscountId(discount.id)
    setDiscountForm({
      name: discount.name,
      percentage: discount.percentage,
      requiresIdVerification: discount.requiresIdVerification,
      isActive: discount.isActive,
    })
    setDiscountSheetOpen(true)
  }

  async function saveDiscount() {
    if (!discountForm.name.trim()) {
      toast.error("Discount name is required")
      return
    }
    if (discountForm.percentage <= 0 || discountForm.percentage > 100) {
      toast.error("Percentage must be between 1 and 100")
      return
    }

    setSaving(true)
    try {
      if (editingDiscountId) {
        const result = await updateDiscountTypeAction({
          id: editingDiscountId,
          ...discountForm,
        })
        if (!result.success) {
          toast.error("Failed to update discount", { description: result.error })
          return
        }
        toast.success("Discount type updated", { description: `${discountForm.name} was saved.` })
      } else {
        const result = await createDiscountTypeAction(discountForm)
        if (!result.success) {
          toast.error("Failed to create discount", { description: result.error })
          return
        }
        toast.success("Discount type added", {
          description: `${discountForm.name} is now available at checkout.`,
        })
      }
      setDiscountSheetOpen(false)
      await loadData()
    } catch (err: any) {
      toast.error("Something went wrong", { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function deleteDiscount(discount: DiscountType) {
    try {
      const result = await deleteDiscountTypeAction(discount.id)
      if (!result.success) {
        toast.error("Failed to delete discount", { description: result.error })
        return
      }
      setSelectedDiscount(null)
      toast.success("Discount type removed", { description: `${discount.name} was deleted.` })
      await loadData()
    } catch (err: any) {
      toast.error("Something went wrong", { description: err.message })
    }
  }

  async function toggleDiscountActive(discount: DiscountType) {
    try {
      const next = !discount.isActive
      const result = await updateDiscountTypeAction({ id: discount.id, isActive: next })
      if (!result.success) {
        toast.error("Failed to update discount", { description: result.error })
        return
      }
      toast.success(next ? `${discount.name} enabled` : `${discount.name} disabled`)
      await loadData()
      setSelectedDiscount((current) =>
        current?.id === discount.id ? { ...current, isActive: next } : current,
      )
    } catch (err: any) {
      toast.error("Something went wrong", { description: err.message })
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="w-full min-w-0 overflow-x-hidden pb-16 sm:pb-8">
      <Toaster richColors position="top-center" />
      <div className="space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Discounts &amp; Promos
              </h1>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Manage promotions, Senior Citizen / PWD discounts, and special rates.
            </p>
          </div>
          <Button
            onClick={pageTab === "promos" ? openCreatePromo : openCreateDiscount}
            className="h-11 w-full bg-amber-500 font-semibold text-neutral-950 shadow-sm hover:bg-amber-400 sm:h-10 sm:w-auto"
          >
            <Plus className="mr-2 size-4" />
            {pageTab === "promos" ? "New promotion" : "Add discount type"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: "Active promotions", value: counts.active, icon: Flame },
            { label: "Scheduled promos", value: counts.scheduled, icon: CalendarRange },
            { label: "Total promo uses", value: counts.totalUsage, icon: ShoppingBag },
            { label: "Active discount types", value: counts.discountTypes, icon: BadgePercent },
          ].map((metric) => (
            <Card key={metric.label} className="border bg-card shadow-xs">
              <CardContent className="flex items-center gap-2 p-2.5 sm:p-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  <metric.icon className="size-3.5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[10px] font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="truncate text-sm font-bold sm:text-base">
                    {metric.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Page-level tab switch */}
        <div className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Tabs value={pageTab} onValueChange={setPageTab}>
            <TabsList className="inline-flex h-10 w-max justify-start rounded-lg bg-muted p-1">
              {pageTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="px-3 text-xs font-medium sm:px-4"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* ================================================================ */}
        {/* PROMOTIONS TAB                                                   */}
        {/* ================================================================ */}
        {pageTab === "promos" && (
          <Card className="border bg-card shadow-xs">
            <CardHeader className="gap-4 p-4 pb-3 sm:p-6 sm:pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base font-bold sm:text-lg">
                  Promotions
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    value={promoSearch}
                    onChange={(e) => setPromoSearch(e.target.value)}
                    placeholder="Search promotions…"
                    className="h-10 pl-9 pr-9 text-sm"
                  />
                  {promoSearch && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setPromoSearch("")}
                      className="absolute right-2.5 top-2.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Tabs value={promoTab} onValueChange={setPromoTab}>
                  <TabsList className="inline-flex h-10 w-max justify-start rounded-lg bg-muted p-1">
                    {promoTabs.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="px-3 text-xs font-medium sm:px-4"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPromos.length ? (
                <div className="divide-y">
                  {paginatedPromos.map((promo) => {
                    const ps = promoStatus(promo)
                    return (
                      <div
                        key={promo.id}
                        className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            <Tag className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{promo.name}</p>
                              <Badge variant="outline" className="text-[10px]">
                                {promoTypeLabel(promo.promoType)}
                              </Badge>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
                              {promo.usageLimit != null
                                ? ` · ${promo.usageCount}/${promo.usageLimit} uses`
                                : ` · ${promo.usageCount} uses`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <p className="text-sm font-bold text-amber-600">
                            {promoValueLabel(promo)}
                          </p>
                          <Badge
                            variant="outline"
                            className={`min-w-24 justify-center text-[11px] ${promoStatusClasses[ps]}`}
                          >
                            {promoStatusLabels[ps]}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSelectedPromo(promo)}
                            aria-label={`View ${promo.name}`}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No promotions match this view.
                </div>
              )}
            </CardContent>

            {!loading && filteredPromos.length > pageSize && (
              <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
                <p className="text-xs text-muted-foreground">
                  Showing {(promoPage - 1) * pageSize + 1}–
                  {Math.min(promoPage * pageSize, filteredPromos.length)} of{" "}
                  {filteredPromos.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={promoPage === 1}
                    onClick={() => setPromoPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="px-2 text-xs font-medium">
                    {promoPage} / {totalPromoPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={promoPage === totalPromoPages}
                    onClick={() => setPromoPage((p) => Math.min(totalPromoPages, p + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ================================================================ */}
        {/* DISCOUNT TYPES TAB                                               */}
        {/* ================================================================ */}
        {pageTab === "discounts" && (
          <Card className="border bg-card shadow-xs">
            <CardHeader className="gap-4 p-4 pb-3 sm:p-6 sm:pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-bold sm:text-lg">
                    Discount types
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Senior Citizen, PWD, and other fixed-rate discounts applied at checkout.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    value={discountSearch}
                    onChange={(e) => setDiscountSearch(e.target.value)}
                    placeholder="Search discount types…"
                    className="h-10 pl-9 pr-9 text-sm"
                  />
                  {discountSearch && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setDiscountSearch("")}
                      className="absolute right-2.5 top-2.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDiscounts.length ? (
                <div className="divide-y">
                  {filteredDiscounts.map((discount) => (
                    <div
                      key={discount.id}
                      className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          <BadgePercent className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{discount.name}</p>
                            {discount.requiresIdVerification && (
                              <Badge variant="outline" className="text-[10px]">
                                ID required
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {discount.percentage}% off · {discount.isActive ? "Enabled" : "Disabled"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <p className="text-sm font-bold text-amber-600">
                          {discount.percentage}%
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            discount.isActive
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                              : "border-border bg-muted text-muted-foreground"
                          }
                        >
                          {discount.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setSelectedDiscount(discount)}
                          aria-label={`View ${discount.name}`}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No discount types match this search.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ================================================================== */}
      {/* PROMOTION — CREATE / EDIT SHEET                                     */}
      {/* ================================================================== */}
      <Sheet open={promoSheetOpen} onOpenChange={setPromoSheetOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4 text-left sm:p-6">
            <SheetTitle>{editingPromoId ? "Edit promotion" : "New promotion"}</SheetTitle>
            <SheetDescription>
              {editingPromoId
                ? "Update the promotion details below."
                : "Set up a new promo to apply at checkout."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
            <div className="grid gap-1.5">
              <Label htmlFor="promo-name">Promotion name</Label>
              <Input
                id="promo-name"
                value={promoForm.name}
                onChange={(e) =>
                  setPromoForm((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="e.g. Weekday Lunch Special"
                className="h-11 sm:h-10"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="promo-desc">Description (optional)</Label>
              <Textarea
                id="promo-desc"
                value={promoForm.description ?? ""}
                onChange={(e) =>
                  setPromoForm((c) => ({
                    ...c,
                    description: e.target.value || null,
                  }))
                }
                placeholder="Short description shown at checkout…"
                className="resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Promo type</Label>
                <Select
                  value={promoForm.promoType}
                  onValueChange={(value) =>
                    setPromoForm((c) => ({
                      ...c,
                      promoType: value as PromoType,
                      discountValue: null,
                    }))
                  }
                >
                  <SelectTrigger className="h-11 w-full sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage off</SelectItem>
                    <SelectItem value="fixed_amount">Fixed amount off</SelectItem>
                    <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {promoForm.promoType !== "buy_x_get_y" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="promo-value">
                    {promoForm.promoType === "percentage" ? "Discount %" : "Amount off (₱)"}
                  </Label>
                  <Input
                    id="promo-value"
                    type="number"
                    min={0}
                    value={promoForm.discountValue ?? ""}
                    onChange={(e) =>
                      setPromoForm((c) => ({
                        ...c,
                        discountValue: Number(e.target.value) || null,
                      }))
                    }
                    placeholder={promoForm.promoType === "percentage" ? "e.g. 15" : "e.g. 100"}
                    className="h-11 sm:h-10"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="promo-min-spend">Minimum spend (₱, optional)</Label>
              <Input
                id="promo-min-spend"
                type="number"
                min={0}
                value={promoForm.minSpend ?? ""}
                onChange={(e) =>
                  setPromoForm((c) => ({
                    ...c,
                    minSpend: Number(e.target.value) || null,
                  }))
                }
                placeholder="e.g. 300"
                className="h-11 sm:h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="promo-start">Start date</Label>
                <Input
                  id="promo-start"
                  type="date"
                  value={promoForm.startDate}
                  onChange={(e) =>
                    setPromoForm((c) => ({ ...c, startDate: e.target.value }))
                  }
                  className="h-11 sm:h-10"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="promo-end">End date</Label>
                <Input
                  id="promo-end"
                  type="date"
                  value={promoForm.endDate}
                  onChange={(e) =>
                    setPromoForm((c) => ({ ...c, endDate: e.target.value }))
                  }
                  className="h-11 sm:h-10"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="promo-limit">Usage limit (optional)</Label>
              <Input
                id="promo-limit"
                type="number"
                min={1}
                value={promoForm.usageLimit ?? ""}
                onChange={(e) =>
                  setPromoForm((c) => ({
                    ...c,
                    usageLimit: Number(e.target.value) || null,
                  }))
                }
                placeholder="Unlimited"
                className="h-11 sm:h-10"
              />
            </div>

            {/* Linked menu items */}
            <div className="grid gap-1.5">
              <Label>Linked menu items (optional)</Label>
              <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                {menuItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No menu items found.</p>
                ) : (
                  menuItems.map((item) => {
                    const linked = promoForm.menuItemIds.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setPromoForm((c) => ({
                            ...c,
                            menuItemIds: linked
                              ? c.menuItemIds.filter((id) => id !== item.id)
                              : [...c.menuItemIds, item.id],
                          }))
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          linked
                            ? "border-amber-500 bg-amber-500 text-neutral-950"
                            : "border-border text-muted-foreground hover:border-amber-400 hover:text-amber-700"
                        }`}
                      >
                        {item.name}
                      </button>
                    )
                  })
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Leave empty to apply to the entire order.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive promos won&apos;t appear at checkout.
                </p>
              </div>
              <Switch
                checked={promoForm.isActive}
                onCheckedChange={(checked) =>
                  setPromoForm((c) => ({ ...c, isActive: checked }))
                }
              />
            </div>
          </div>

          <SheetFooter className="flex-row border-t bg-background p-4 sm:p-6">
            <Button
              variant="outline"
              onClick={() => setPromoSheetOpen(false)}
              disabled={saving}
              className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button
              onClick={savePromo}
              disabled={saving}
              className="flex-1 bg-amber-500 font-semibold text-neutral-950 hover:bg-amber-400"
            >
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingPromoId ? "Save changes" : "Create promotion"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ================================================================== */}
      {/* PROMOTION — DETAIL SHEET                                            */}
      {/* ================================================================== */}
      <Sheet
        open={Boolean(selectedPromo)}
        onOpenChange={(open) => !open && setSelectedPromo(null)}
      >
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          {selectedPromo && (
            <>
              <SheetHeader className="border-b p-4 text-left sm:p-6">
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div>
                    <SheetTitle>{selectedPromo.name}</SheetTitle>
                    <SheetDescription>
                      {promoTypeLabel(selectedPromo.promoType)}
                      {selectedPromo.discountValue != null
                        ? ` · ${promoValueLabel(selectedPromo)}`
                        : ""}
                    </SheetDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={promoStatusClasses[promoStatus(selectedPromo)]}
                  >
                    {promoStatusLabels[promoStatus(selectedPromo)]}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
                {selectedPromo.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedPromo.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Start date</p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(selectedPromo.startDate)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">End date</p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(selectedPromo.endDate)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Times used</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedPromo.usageCount}
                      {selectedPromo.usageLimit != null
                        ? ` / ${selectedPromo.usageLimit}`
                        : " (unlimited)"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Min. spend</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedPromo.minSpend != null
                        ? formatCurrency(selectedPromo.minSpend)
                        : "None"}
                    </p>
                  </div>
                </div>

                {selectedPromo.menuItemIds.length > 0 && (
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Linked menu items
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPromo.menuItemIds.map((id) => {
                        const item = menuItems.find((m) => m.id === id)
                        return (
                          <Badge key={id} variant="outline" className="text-xs">
                            {item?.name ?? id}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <SheetFooter className="flex-col gap-2 border-t bg-background p-4 sm:p-6">
                <div className="grid w-full grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      openEditPromo(selectedPromo)
                      setSelectedPromo(null)
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        />
                      }
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-md rounded-xl sm:rounded-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedPromo.name}?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs sm:text-sm">
                          This permanently removes the promotion. Orders that already used it won't be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                        <AlertDialogCancel className="mt-0 w-full sm:w-auto">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePromo(selectedPromo)}
                          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Button
                  onClick={() => togglePromoActive(selectedPromo)}
                  variant="outline"
                  className={`w-full ${
                    selectedPromo.isActive
                      ? "text-destructive hover:text-destructive"
                      : "text-emerald-700 hover:text-emerald-700"
                  }`}
                >
                  {selectedPromo.isActive ? "Deactivate promotion" : "Activate promotion"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ================================================================== */}
      {/* DISCOUNT TYPE — CREATE / EDIT SHEET                                 */}
      {/* ================================================================== */}
      <Sheet open={discountSheetOpen} onOpenChange={setDiscountSheetOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4 text-left sm:p-6">
            <SheetTitle>
              {editingDiscountId ? "Edit discount type" : "New discount type"}
            </SheetTitle>
            <SheetDescription>
              {editingDiscountId
                ? "Update the discount rate and settings."
                : "Add a fixed-rate discount available at checkout — e.g. Senior Citizen, PWD."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 p-4 sm:p-6">
            <div className="grid gap-1.5">
              <Label htmlFor="disc-name">Discount name</Label>
              <Input
                id="disc-name"
                value={discountForm.name}
                onChange={(e) =>
                  setDiscountForm((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="e.g. Senior Citizen"
                className="h-11 sm:h-10"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="disc-pct">Discount percentage (%)</Label>
              <Input
                id="disc-pct"
                type="number"
                min={1}
                max={100}
                value={discountForm.percentage}
                onChange={(e) =>
                  setDiscountForm((c) => ({
                    ...c,
                    percentage: Number(e.target.value) || 0,
                  }))
                }
                className="h-11 sm:h-10"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Requires ID verification</p>
                <p className="text-xs text-muted-foreground">
                  Cashier must check a valid government ID before applying.
                </p>
              </div>
              <Switch
                checked={discountForm.requiresIdVerification}
                onCheckedChange={(checked) =>
                  setDiscountForm((c) => ({
                    ...c,
                    requiresIdVerification: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive types won&apos;t appear at checkout.
                </p>
              </div>
              <Switch
                checked={discountForm.isActive}
                onCheckedChange={(checked) =>
                  setDiscountForm((c) => ({ ...c, isActive: checked }))
                }
              />
            </div>
          </div>

          <SheetFooter className="flex-row border-t bg-background p-4 sm:p-6">
            <Button
              variant="outline"
              onClick={() => setDiscountSheetOpen(false)}
              disabled={saving}
              className="flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
            >
              Cancel
            </Button>
            <Button
              onClick={saveDiscount}
              disabled={saving}
              className="flex-1 bg-amber-500 font-semibold text-neutral-950 hover:bg-amber-400"
            >
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingDiscountId ? "Save changes" : "Add discount type"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ================================================================== */}
      {/* DISCOUNT TYPE — DETAIL SHEET                                        */}
      {/* ================================================================== */}
      <Sheet
        open={Boolean(selectedDiscount)}
        onOpenChange={(open) => !open && setSelectedDiscount(null)}
      >
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          {selectedDiscount && (
            <>
              <SheetHeader className="border-b p-4 text-left sm:p-6">
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div>
                    <SheetTitle>{selectedDiscount.name}</SheetTitle>
                    <SheetDescription>
                      {selectedDiscount.percentage}% discount ·{" "}
                      {selectedDiscount.requiresIdVerification
                        ? "ID required"
                        : "No ID required"}
                    </SheetDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      selectedDiscount.isActive
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                        : "border-border bg-muted text-muted-foreground"
                    }
                  >
                    {selectedDiscount.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedDiscount.percentage}% off
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">ID verification</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedDiscount.requiresIdVerification ? "Required" : "Not required"}
                    </p>
                  </div>
                </div>
              </div>

              <SheetFooter className="flex-col gap-2 border-t bg-background p-4 sm:p-6">
                <div className="grid w-full grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      openEditDiscount(selectedDiscount)
                      setSelectedDiscount(null)
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        />
                      }
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-md rounded-xl sm:rounded-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete {selectedDiscount.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs sm:text-sm">
                          This removes the discount type from checkout. Historical order discounts won't be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                        <AlertDialogCancel className="mt-0 w-full sm:w-auto">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteDiscount(selectedDiscount)}
                          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Button
                  variant="outline"
                  onClick={() => toggleDiscountActive(selectedDiscount)}
                  className={`w-full ${
                    selectedDiscount.isActive
                      ? "text-destructive hover:text-destructive"
                      : "text-emerald-700 hover:text-emerald-700"
                  }`}
                >
                  {selectedDiscount.isActive
                    ? "Disable discount type"
                    : "Enable discount type"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}