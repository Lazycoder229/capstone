// apps/admin/src/app/(dashboard)/menu/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Search, ImageOff, Package, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Toaster } from "@/components/ui/sonner"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Category {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
}

interface MenuItem {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  stockQuantity: number | null
}

type MenuItemFormValues = Omit<MenuItem, "id">

const emptyForm: MenuItemFormValues = {
  categoryId: "",
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  isAvailable: true,
  stockQuantity: null,
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Litson Manok", sortOrder: 0, isActive: true },
  { id: "cat-2", name: "Sides", sortOrder: 1, isActive: true },
  { id: "cat-3", name: "Beverages", sortOrder: 2, isActive: true },
]

const MOCK_ITEMS: MenuItem[] = [
  {
    id: "item-1",
    categoryId: "cat-1",
    name: "Whole Litson Manok",
    description: "Our signature roasted chicken, basted in a house marinade.",
    price: 420,
    imageUrl: null,
    isAvailable: true,
    stockQuantity: 18,
  },
  {
    id: "item-2",
    categoryId: "cat-1",
    name: "Half Litson Manok",
    description: "Half order of our signature roasted chicken.",
    price: 230,
    imageUrl: null,
    isAvailable: true,
    stockQuantity: 24,
  },
  {
    id: "item-3",
    categoryId: "cat-2",
    name: "Java Rice",
    description: "Garlic fried rice with turmeric and annatto.",
    price: 45,
    imageUrl: null,
    isAvailable: true,
    stockQuantity: null,
  },
  {
    id: "item-4",
    categoryId: "cat-3",
    name: "Iced Tea",
    description: null,
    price: 35,
    imageUrl: null,
    isAvailable: false,
    stockQuantity: 0,
  },
]

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MenuPage() {
  const [categories] = useState<Category[]>(MOCK_CATEGORIES)
  const [items, setItems] = useState<MenuItem[]>(MOCK_ITEMS)

  const [activeCategory, setActiveCategory] = useState("all")
  const [search, setSearch] = useState("")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MenuItemFormValues>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.categoryId === activeCategory
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.trim().toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [items, activeCategory, search])

  function categoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? "Uncategorized"
  }

  function resetImageState() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  function openCreateSheet() {
    setEditingId(null)
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" })
    resetImageState()
    setSheetOpen(true)
  }

  function openEditSheet(item: MenuItem) {
    setEditingId(item.id)
    const { id, ...rest } = item
    setForm(rest)
    resetImageState()
    setSheetOpen(true)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.categoryId) {
      toast.error("Missing required fields", {
        description: "Item name and category are required.",
      })
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading(
      editingId ? "Saving changes…" : "Creating item…"
    )

    try {
      await new Promise((r) => setTimeout(r, 700))

      let finalImageUrl = form.imageUrl
      if (imageFile && imagePreview) finalImageUrl = imagePreview

      const payload: MenuItemFormValues = { ...form, imageUrl: finalImageUrl }

      if (editingId) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? { ...item, ...payload, id: editingId }
              : item
          )
        )
        toast.success("Item updated", {
          id: toastId,
          description: `"${form.name}" was saved.`,
        })
      } else {
        setItems((prev) => [
          ...prev,
          { ...payload, id: crypto.randomUUID() },
        ])
        toast.success("Item created", {
          id: toastId,
          description: `"${form.name}" was added to the menu.`,
        })
      }

      setSheetOpen(false)
    } catch (err) {
      toast.error("Save failed", {
        id: toastId,
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    const toastId = toast.loading(`Deleting "${name}"…`)
    try {
      await new Promise((r) => setTimeout(r, 500))

      setItems((prev) => prev.filter((item) => item.id !== id))
      toast.success("Item deleted", {
        id: toastId,
        description: `"${name}" was removed from the menu.`,
      })
    } catch (err) {
      toast.error("Delete failed", {
        id: toastId,
        description:
          err instanceof Error ? err.message : "Could not delete the item.",
      })
    }
  }

  async function toggleAvailability(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item) return

    const next = !item.isAvailable

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isAvailable: next } : i))
    )

    try {
      await new Promise((r) => setTimeout(r, 300))

      toast.success(next ? "Item is now live" : "Item hidden", {
        description: next
          ? `"${item.name}" is visible to customers.`
          : `"${item.name}" is hidden from the menu.`,
      })
    } catch (err) {
      // Roll back
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, isAvailable: item.isAvailable } : i
        )
      )
      toast.error("Update failed", {
        description: "Availability change was reverted.",
      })
    }
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden pb-16 sm:pb-8">
      {/* Toast notifications */}
      <Toaster richColors position="top-center" />

      <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6">
        {/* ── Mobile-First Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Menu Items</h1>
              <Badge variant="secondary" className="rounded-full text-xs font-semibold px-2.5">
                {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Manage categories, pricing, stock, and availability.
            </p>
          </div>

          {/* Sheet for Item Creation / Editing */}
          <Sheet
            open={sheetOpen}
            onOpenChange={(open) => {
              setSheetOpen(open)
              if (!open) resetImageState()
            }}
          >
            <SheetTrigger
              render={
                <Button
                  onClick={openCreateSheet}
                  className="w-full sm:w-auto bg-amber-500 text-neutral-950 hover:bg-amber-400 font-semibold shadow-sm h-11 sm:h-10 px-5 text-sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Item
                </Button>
              }
            />

            <SheetContent
              side="bottom"
              className="h-[92vh] sm:h-full sm:max-w-md p-0 flex flex-col gap-0 rounded-t-2xl sm:rounded-none inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto"
            >
              <SheetHeader className="p-4 sm:p-6 border-b shrink-0 text-left">
                <SheetTitle className="text-lg font-bold">
                  {editingId ? "Edit Menu Item" : "New Menu Item"}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Price changes only apply to new orders — past orders keep original price.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Item Name */}
                <div className="grid gap-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Item Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. Whole Litson Manok"
                    className="h-11 sm:h-10 text-sm"
                  />
                </div>

                {/* Category + Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="category" className="text-xs font-semibold">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.categoryId}
                      onValueChange={(value) =>
                        setForm((f) => ({ ...f, categoryId: value ?? f.categoryId }))
                      }
                    >
                      <SelectTrigger id="category" className="h-11 sm:h-10 text-sm w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="price" className="text-xs font-semibold">
                      Price (₱) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={form.price || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, price: Number(e.target.value) }))
                      }
                      placeholder="0.00"
                      className="h-11 sm:h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Stock + Availability */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="stock" className="text-xs font-semibold">
                      Stock Quantity{" "}
                      <span className="text-muted-foreground font-normal">(blank = unlimited)</span>
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={form.stockQuantity ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          stockQuantity:
                            e.target.value === "" ? null : Number(e.target.value),
                        }))
                      }
                      placeholder="Unlimited"
                      className="h-11 sm:h-10 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="available" className="cursor-pointer text-sm font-medium">
                        Available
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Show on customer menu
                      </p>
                    </div>
                    <Switch
                      id="available"
                      checked={form.isAvailable}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({ ...f, isAvailable: checked }))
                      }
                      className="h-6 w-11"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="grid gap-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold">
                    Description <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={form.description ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Short description shown on the menu..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>

                {/* Photo Upload */}
                <div className="grid gap-1.5">
                  <Label htmlFor="image" className="text-xs font-semibold">
                    Product Photo
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {(imagePreview || form.imageUrl) ? (
                      <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview ?? form.imageUrl ?? ""}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="cursor-pointer text-xs h-10 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-600 hover:file:bg-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              <SheetFooter className="p-4 sm:p-6 border-t shrink-0 flex-row gap-3 bg-background">
                <SheetClose
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      className="flex-1 h-11 sm:h-10 text-sm"
                    >
                      Cancel
                    </Button>
                  }
                />
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-11 sm:h-10 text-sm bg-amber-500 text-neutral-950 hover:bg-amber-400 font-semibold disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    "Save Changes"
                  ) : (
                    "Create Item"
                  )}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* ── Filters: Search & Scrollable Category Tabs ────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
          <div className="w-full min-w-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full min-w-0">
              <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-max">
                <TabsTrigger value="all" className="px-3.5 py-1.5 text-xs font-medium min-w-[60px]">
                  All Items
                </TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id} className="px-3.5 py-1.5 text-xs font-medium">
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-3 sm:top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="pl-9 pr-8 h-11 sm:h-10 text-sm w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-3 sm:top-2.5 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile-First Cards Grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full min-w-0">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="flex flex-row sm:flex-col p-3 sm:p-0 gap-3 sm:gap-0 overflow-hidden transition-shadow hover:shadow-md border bg-card w-full min-w-0"
            >
              {/* Thumbnail Image: Square 80x80 on mobile, Aspect ratio on desktop */}
              <div className="relative w-20 h-20 shrink-0 sm:w-full sm:h-44 bg-muted rounded-lg sm:rounded-none overflow-hidden">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <ImageOff className="h-6 w-6 sm:h-9 sm:w-9" />
                  </div>
                )}

                {!item.isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[1px]">
                    <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 py-0.5 font-medium">
                      Hidden
                    </Badge>
                  </div>
                )}
              </div>

              {/* Card Body & Actions */}
              <div className="flex flex-1 min-w-0 flex-col justify-between sm:p-4">
                <CardContent className="p-0 space-y-1 sm:space-y-2 min-w-0">
                  {/* Title + Price Row */}
                  <div className="flex items-baseline justify-between gap-2 min-w-0">
                    <h3 className="text-sm font-semibold leading-tight text-foreground truncate">
                      {item.name}
                    </h3>
                    <span className="shrink-0 text-sm font-bold text-amber-500">
                      ₱{item.price.toFixed(2)}
                    </span>
                  </div>

                  {item.description && (
                    <p className="line-clamp-1 sm:line-clamp-2 text-xs text-muted-foreground leading-normal">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-0.5 sm:pt-1">
                    <Badge variant="outline" className="text-[10px] sm:text-xs font-normal shrink-0">
                      {categoryName(item.categoryId)}
                    </Badge>
                    <span className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground shrink-0">
                      <Package className="h-3 w-3" />
                      {item.stockQuantity === null
                        ? "Unlimited"
                        : `${item.stockQuantity} left`}
                    </span>
                  </div>
                </CardContent>

                {/* Footer Controls: Switch on Left, Edit & Delete on Right */}
                <CardFooter className="p-0 pt-2 sm:pt-3 mt-2 border-t flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={() => toggleAvailability(item.id)}
                      className="h-5 w-9 sm:h-6 sm:w-11"
                    />
                    <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                      {item.isAvailable ? "Live" : "Hidden"}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                      onClick={() => openEditSheet(item)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit item</span>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete item</span>
                          </Button>
                        }
                      />
                      <AlertDialogContent className="w-[90vw] max-w-md rounded-xl sm:rounded-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs sm:text-sm">
                            "{item.name}" will be permanently removed from the
                            menu. Past orders won't be affected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto mt-0">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id, item.name)}
                            className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </div>
            </Card>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center text-muted-foreground bg-muted/20">
              <Package className="h-10 w-10 opacity-40" />
              <div>
                <p className="text-base font-semibold text-foreground">No items found</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {search
                    ? `No menu items match "${search}"`
                    : "Get started by adding your first menu item."}
                </p>
              </div>
              {!search && (
                <Button
                  size="sm"
                  onClick={openCreateSheet}
                  className="mt-2 bg-amber-500 text-neutral-950 hover:bg-amber-400 font-medium"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add item now
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}