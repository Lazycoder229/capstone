"use server"

import {
  createInventoryCategorySchema,
  createInventoryItemSchema,
  createSafeAction,
  createStockLogSchema,
  updateInventoryItemSchema,
  type CreateInventoryCategoryInput,
  type CreateInventoryItemInput,
  type CreateStockLogInput,
  type UpdateInventoryItemInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import {
  InventoryCategoryEntity,
  InventoryItemEntity,
  InventoryStockLogEntity,
  MenuItemEntity,
  StockItemType,
  StockLogType,
} from "@/lib/database/entities"
import { toPlainArray } from "@/lib/utils/serialize"

export async function fetchInventory() {
  try {
    const db = await getDatabase()
    const catRepo = db.getRepository(InventoryCategoryEntity)
    const itemRepo = db.getRepository(InventoryItemEntity)
    const logRepo = db.getRepository(InventoryStockLogEntity)
    const menuRepo = db.getRepository(MenuItemEntity)

    let categories = await catRepo.find({ order: { name: "ASC" } })
    let items = await itemRepo.find({ order: { name: "ASC" } })
    const catMap = new Map(categories.map((c) => [c.id, c.name]))

    const formattedItems = items.map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      categoryName: i.categoryId ? catMap.get(i.categoryId) || "General" : "General",
      name: i.name,
      unit: i.unit,
      stockQuantity: Number(i.stockQuantity),
      reorderThreshold: i.reorderThreshold ? Number(i.reorderThreshold) : null,
      unitCost: i.unitCost ? Number(i.unitCost) : null,
      supplier: i.supplier,
      isActive: i.isActive,
    }))

    const logs = await logRepo.find({ order: { createdAt: "DESC" }, take: 50 })
    const formattedLogs = logs.map((l) => ({
      id: l.id,
      itemType: l.itemType,
      inventoryItemId: l.inventoryItemId,
      menuItemId: l.menuItemId,
      itemName: "Stock Item",
      unit: "pcs",
      type: l.type,
      quantityChange: Number(l.quantityChange),
      quantityAfter: l.quantityAfter ? Number(l.quantityAfter) : null,
      note: l.note,
      performedByStaffId: l.performedByStaffId,
      staffName: "Staff Member",
      createdAt: new Date(l.createdAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }))

    const menuItems = await menuRepo.find({ order: { name: "ASC" } })
    const formattedMenuStock = menuItems.map((m) => ({
      id: m.id,
      name: m.name,
      category: "Menu Item",
      price: Number(m.price),
      stockQuantity: m.stockQuantity,
      isAvailable: m.isAvailable,
    }))

    return {
      success: true,
      data: {
        categories: toPlainArray(categories),
        items: formattedItems,
        logs: formattedLogs,
        menuStock: formattedMenuStock,
      },
    }
  } catch (error: any) {
    console.error("fetchInventory error:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch inventory",
      data: { categories: [], items: [], logs: [], menuStock: [] },
    }
  }
}

export const createInventoryItemAction = createSafeAction(
  createInventoryItemSchema,
  async (input: CreateInventoryItemInput) => {
    const db = await getDatabase()
    const itemRepo = db.getRepository(InventoryItemEntity)

    const item = itemRepo.create({
      id: crypto.randomUUID(),
      categoryId: input.categoryId ?? null,
      name: input.name,
      unit: input.unit,
      stockQuantity: String(input.stockQuantity || 0),
      reorderThreshold: input.reorderThreshold ? String(input.reorderThreshold) : null,
      unitCost: input.unitCost ? String(input.unitCost) : null,
      supplier: input.supplier ?? null,
      isActive: input.isActive ?? true,
    })

    await itemRepo.save(item)
    return { itemId: item.id, name: item.name, message: "Inventory item registered successfully." }
  }
)

export const updateInventoryItemAction = createSafeAction(
  updateInventoryItemSchema,
  async (input: UpdateInventoryItemInput) => {
    const db = await getDatabase()
    const itemRepo = db.getRepository(InventoryItemEntity)

    const item = await itemRepo.findOne({ where: { id: input.id } })
    if (!item) throw new Error("Inventory item not found.")

    if (input.name !== undefined) item.name = input.name
    if (input.unit !== undefined) item.unit = input.unit
    if (input.categoryId !== undefined) item.categoryId = input.categoryId ?? null
    if (input.unitCost !== undefined) item.unitCost = input.unitCost ? String(input.unitCost) : null
    if (input.reorderThreshold !== undefined) item.reorderThreshold = input.reorderThreshold ? String(input.reorderThreshold) : null
    if (input.supplier !== undefined) item.supplier = input.supplier ?? null
    if (input.isActive !== undefined) item.isActive = input.isActive

    await itemRepo.save(item)
    return { itemId: item.id, message: "Inventory item updated successfully." }
  }
)

export const adjustStockAction = createSafeAction(
  createStockLogSchema,
  async (input: CreateStockLogInput) => {
    const db = await getDatabase()
    const logRepo = db.getRepository(InventoryStockLogEntity)
    const itemRepo = db.getRepository(InventoryItemEntity)
    const menuRepo = db.getRepository(MenuItemEntity)

    let quantityAfter: number | null = null

    if (input.itemType === StockItemType.INGREDIENT && input.inventoryItemId) {
      const item = await itemRepo.findOne({ where: { id: input.inventoryItemId } })
      if (!item) throw new Error("Inventory item not found.")

      const current = Number(item.stockQuantity)
      const change = Number(input.quantityChange)
      const updated = current + change
      quantityAfter = Math.max(0, updated)

      item.stockQuantity = String(quantityAfter)
      await itemRepo.save(item)
    } else if (input.itemType === StockItemType.MENU_ITEM && input.menuItemId) {
      const menu = await menuRepo.findOne({ where: { id: input.menuItemId } })
      if (!menu) throw new Error("Menu item not found.")

      const current = menu.stockQuantity || 0
      const change = Number(input.quantityChange)
      const updated = current + change
      quantityAfter = Math.max(0, updated)

      menu.stockQuantity = quantityAfter
      await menuRepo.save(menu)
    } else {
      throw new Error("A valid inventory item or menu item relation is required.")
    }

    const log = logRepo.create({
      id: crypto.randomUUID(),
      itemType: input.itemType as StockItemType,
      inventoryItemId: input.inventoryItemId ?? null,
      menuItemId: input.menuItemId ?? null,
      type: input.type as StockLogType,
      quantityChange: String(input.quantityChange),
      quantityAfter: quantityAfter !== null ? String(quantityAfter) : null,
      note: input.note ?? null,
      performedByStaffId: input.performedByStaffId,
    })

    await logRepo.save(log)
    return { logId: log.id, quantityAfter, message: "Stock adjustment recorded successfully." }
  }
)

export async function deleteInventoryItemAction(id: string) {
  try {
    const db = await getDatabase()
    const itemRepo = db.getRepository(InventoryItemEntity)
    await itemRepo.delete(id)
    return { success: true, message: "Inventory item deleted successfully." }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete item." }
  }
}
