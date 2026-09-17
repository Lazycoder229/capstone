"use server"

import {
  createDiscountTypeSchema,
  createPromotionSchema,
  createSafeAction,
  updateDiscountTypeSchema,
  updatePromotionSchema,
  type CreateDiscountTypeInput,
  type CreatePromotionInput,
  type UpdateDiscountTypeInput,
  type UpdatePromotionInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import {
  DiscountTypeEntity,
  PromotionEntity,
  PromotionItemEntity,
  PromotionType,
} from "@/lib/database/entities"
import { toPlain, toPlainArray } from "@/lib/utils/serialize"

// ---------------------------------------------------------------------------
// Fetch — no default seeding
// ---------------------------------------------------------------------------

export async function fetchDiscounts() {
  try {
    const db = await getDatabase()
    const discountRepo = db.getRepository(DiscountTypeEntity)
    const promoRepo = db.getRepository(PromotionEntity)
    const itemRepo = db.getRepository(PromotionItemEntity)

    const discountTypes = await discountRepo.find({ order: { name: "ASC" } })
    const promotions = await promoRepo.find({ order: { startDate: "DESC" } })

    // Load linked menu-item ids for all promos in one query
    const promoIds = promotions.map((p) => p.id)
    const promoItems = promoIds.length
      ? await itemRepo.find({ where: promoIds.map((promotionId) => ({ promotionId })) })
      : []

    const itemsByPromo = new Map<string, string[]>()
    for (const row of promoItems) {
      const list = itemsByPromo.get(row.promotionId) ?? []
      list.push(row.menuItemId)
      itemsByPromo.set(row.promotionId, list)
    }

    const formattedDiscounts = toPlainArray(discountTypes).map((d: any) => ({
      ...d,
      percentage: Number(d.percentage),
    }))

    const formattedPromos = toPlainArray(promotions).map((p: any) => ({
      ...p,
      discountValue: p.discountValue != null ? Number(p.discountValue) : null,
      minSpend: p.minSpend != null ? Number(p.minSpend) : null,
      menuItemIds: itemsByPromo.get(p.id) ?? [],
    }))

    return {
      success: true,
      data: {
        discountTypes: formattedDiscounts,
        promotions: formattedPromos,
      },
    }
  } catch (error: any) {
    console.error("fetchDiscounts error:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch discounts",
      data: { discountTypes: [], promotions: [] },
    }
  }
}

// ---------------------------------------------------------------------------
// Discount type actions
// ---------------------------------------------------------------------------

export const createDiscountTypeAction = createSafeAction(
  createDiscountTypeSchema,
  async (input: CreateDiscountTypeInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(DiscountTypeEntity)

    const discount = repo.create({
      id: crypto.randomUUID(),
      name: input.name,
      percentage: String(input.percentage),
      requiresIdVerification: input.requiresIdVerification ?? true,
      isActive: input.isActive ?? true,
    })

    await repo.save(discount)
    return { discountId: discount.id, message: "Discount type created successfully." }
  }
)

export const updateDiscountTypeAction = createSafeAction(
  updateDiscountTypeSchema,
  async (input: UpdateDiscountTypeInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(DiscountTypeEntity)

    const discount = await repo.findOne({ where: { id: input.id } })
    if (!discount) throw new Error("Discount type not found.")

    if (input.name !== undefined) discount.name = input.name
    if (input.percentage !== undefined) discount.percentage = String(input.percentage)
    if (input.requiresIdVerification !== undefined) discount.requiresIdVerification = input.requiresIdVerification
    if (input.isActive !== undefined) discount.isActive = input.isActive

    await repo.save(discount)
    return { discountId: discount.id, message: "Discount type updated successfully." }
  }
)

export async function deleteDiscountTypeAction(id: string) {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(DiscountTypeEntity)
    await repo.delete(id)
    return { success: true, message: "Discount type deleted successfully." }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete discount type." }
  }
}

// ---------------------------------------------------------------------------
// Promotion actions
// ---------------------------------------------------------------------------

async function syncPromotionItems(
  promotionId: string,
  menuItemIds: string[] | undefined,
  db: Awaited<ReturnType<typeof getDatabase>>
) {
  if (menuItemIds === undefined) return
  const itemRepo = db.getRepository(PromotionItemEntity)
  await itemRepo.delete({ promotionId })
  if (menuItemIds.length > 0) {
    const rows = menuItemIds.map((menuItemId) =>
      itemRepo.create({ promotionId, menuItemId })
    )
    await itemRepo.save(rows)
  }
}

export const createPromotionAction = createSafeAction(
  createPromotionSchema,
  async (input: CreatePromotionInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(PromotionEntity)

    const promo = repo.create({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description ?? null,
      promoType: input.promoType as PromotionType,
      discountValue: input.discountValue != null ? String(input.discountValue) : null,
      minSpend: input.minSpend != null ? String(input.minSpend) : null,
      startDate: input.startDate,
      endDate: input.endDate,
      usageLimit: input.usageLimit ?? null,
      usageCount: 0,
      isActive: input.isActive ?? true,
      createdByStaffId: crypto.randomUUID(), // TODO: gamitin ang aktwal na logged-in staff id
    })

    await repo.save(promo)
    await syncPromotionItems(promo.id, input.menuItemIds, db)

    return { promotionId: promo.id, message: "Promotion created successfully." }
  }
)

export const updatePromotionAction = createSafeAction(
  updatePromotionSchema,
  async (input: UpdatePromotionInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(PromotionEntity)

    const promo = await repo.findOne({ where: { id: input.id } })
    if (!promo) throw new Error("Promotion not found.")

    if (input.name !== undefined) promo.name = input.name
    if (input.description !== undefined) promo.description = input.description ?? null
    if (input.promoType !== undefined) promo.promoType = input.promoType as PromotionType
    if (input.discountValue !== undefined)
      promo.discountValue = input.discountValue != null ? String(input.discountValue) : null
    if (input.minSpend !== undefined)
      promo.minSpend = input.minSpend != null ? String(input.minSpend) : null
    if (input.startDate !== undefined) promo.startDate = input.startDate
    if (input.endDate !== undefined) promo.endDate = input.endDate
    if (input.usageLimit !== undefined) promo.usageLimit = input.usageLimit ?? null
    if (input.isActive !== undefined) promo.isActive = input.isActive

    await repo.save(promo)
    await syncPromotionItems(promo.id, input.menuItemIds, db)

    return { promotionId: promo.id, message: "Promotion updated successfully." }
  }
)

export async function deletePromotionAction(id: string) {
  try {
    const db = await getDatabase()
    const itemRepo = db.getRepository(PromotionItemEntity)
    const promoRepo = db.getRepository(PromotionEntity)

    await itemRepo.delete({ promotionId: id })
    await promoRepo.delete(id)

    return { success: true, message: "Promotion deleted successfully." }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete promotion." }
  }
}