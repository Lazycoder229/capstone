"use server"

import {
  createCategorySchema,
  createMenuItemSchema,
  createSafeAction,
  updateCategorySchema,
  updateMenuItemSchema,
  type CreateCategoryInput,
  type CreateMenuItemInput,
  type UpdateCategoryInput,
  type UpdateMenuItemInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import { CategoryEntity, MenuItemEntity } from "@/lib/database/entities"
import { toPlain, toPlainArray } from "@/lib/utils/serialize"

export async function fetchCategories() {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(CategoryEntity)
    const categories = await repo.find({
      order: { sortOrder: "ASC", createdAt: "ASC" },
    })

    return { success: true, data: toPlainArray(categories) }
  } catch (error: any) {
    console.error("fetchCategories error:", error)
    return { success: false, error: error.message || "Failed to fetch categories", data: [] }
  }
}

export async function fetchMenuItems() {
  try {
    const db = await getDatabase()
    const itemRepo = db.getRepository(MenuItemEntity)
    const catRepo = db.getRepository(CategoryEntity)

    const items = await itemRepo.find({
      order: { createdAt: "DESC" },
    })

    // Format prices for UI and serialize to plain objects
    const formatted = items.map((i) => ({
      ...toPlain(i),
      price: Number(i.price),
    }))

    return { success: true, data: formatted }
  } catch (error: any) {
    console.error("fetchMenuItems error:", error)
    return { success: false, error: error.message || "Failed to fetch menu items", data: [] }
  }
}

export const createCategoryAction = createSafeAction(
  createCategorySchema,
  async (input: CreateCategoryInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(CategoryEntity)

    const cat = repo.create({
      id: crypto.randomUUID(),
      name: input.name,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    })

    await repo.save(cat)
    return { category: toPlain(cat), message: "Category created successfully." }
  }
)

export const updateCategoryAction = createSafeAction(
  updateCategorySchema,
  async (input: UpdateCategoryInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(CategoryEntity)

    const cat = await repo.findOne({ where: { id: input.id } })
    if (!cat) throw new Error("Category not found.")

    if (input.name !== undefined) cat.name = input.name
    if (input.sortOrder !== undefined) cat.sortOrder = input.sortOrder
    if (input.isActive !== undefined) cat.isActive = input.isActive

    await repo.save(cat)
    return { category: toPlain(cat), message: "Category updated successfully." }
  }
)

export async function deleteCategoryAction(id: string) {
  try {
    const db = await getDatabase()
    const catRepo = db.getRepository(CategoryEntity)
    const itemRepo = db.getRepository(MenuItemEntity)

    const itemCount = await itemRepo.count({ where: { categoryId: id } })
    if (itemCount > 0) {
      return {
        success: false,
        error: `Cannot delete category: ${itemCount} menu item(s) are assigned to it.`,
      }
    }

    await catRepo.delete(id)
    return { success: true, message: "Category deleted successfully." }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete category." }
  }
}

export const createMenuItemAction = createSafeAction(
  createMenuItemSchema,
  async (input: CreateMenuItemInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(MenuItemEntity)

    const item = repo.create({
      id: crypto.randomUUID(),
      categoryId: input.categoryId,
      name: input.name,
      description: input.description ?? null,
      price: String(input.price),
      imageUrl: input.imageUrl ?? null,
      isAvailable: input.isAvailable ?? true,
      stockQuantity: input.stockQuantity ?? null,
    })

    await repo.save(item)
    return { item: { ...toPlain(item), price: Number(item.price) }, message: "Menu item created successfully." }
  }
)

export const updateMenuItemAction = createSafeAction(
  updateMenuItemSchema,
  async (input: UpdateMenuItemInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(MenuItemEntity)

    const item = await repo.findOne({ where: { id: input.id } })
    if (!item) throw new Error("Menu item not found.")

    if (input.categoryId !== undefined) item.categoryId = input.categoryId
    if (input.name !== undefined) item.name = input.name
    if (input.description !== undefined) item.description = input.description ?? null
    if (input.price !== undefined) item.price = String(input.price)
    if (input.imageUrl !== undefined) item.imageUrl = input.imageUrl ?? null
    if (input.isAvailable !== undefined) item.isAvailable = input.isAvailable
    if (input.stockQuantity !== undefined) item.stockQuantity = input.stockQuantity ?? null

    await repo.save(item)
    return { item: { ...toPlain(item), price: Number(item.price) }, message: "Menu item updated successfully." }
  }
)

export async function deleteMenuItemAction(id: string) {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(MenuItemEntity)
    await repo.delete(id)
    return { success: true, message: "Menu item deleted successfully." }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete menu item." }
  }
}
