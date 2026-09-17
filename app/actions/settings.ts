"use server"

import {
  createSafeAction,
  updateSystemSettingSchema,
  type UpdateSystemSettingInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import { SystemSettingEntity } from "@/lib/database/entities"

export const updateSystemSettingsAction = createSafeAction(
  updateSystemSettingSchema,
  async (input: UpdateSystemSettingInput) => {
    const db = await getDatabase()
    const settingsRepo = db.getRepository(SystemSettingEntity)

    const latestSettings = await settingsRepo.find({
      order: { updatedAt: "DESC" },
      take: 1,
    })

    let current = latestSettings[0] ?? null

    if (!current) {
      current = settingsRepo.create({
        id: crypto.randomUUID(),
        ...input,
        vatRate: input.vatRate !== undefined ? String(input.vatRate) : undefined,
        serviceChargeRate: input.serviceChargeRate !== undefined ? String(input.serviceChargeRate) : undefined,
      })
    } else {
      Object.assign(current, input)
      if (input.vatRate !== undefined) {
        current.vatRate = String(input.vatRate)
      }
      if (input.serviceChargeRate !== undefined) {
        current.serviceChargeRate = String(input.serviceChargeRate)
      }
    }

    await settingsRepo.save(current)
    return {
      message: "POS System Settings updated successfully.",
      restaurantName: current.restaurantName,
      updatedAt: current.updatedAt,
    }
  }
)

export async function fetchSystemSettings() {
  try {
    const db = await getDatabase()
    const settingsRepo = db.getRepository(SystemSettingEntity)

    const latestSettings = await settingsRepo.find({
      order: { updatedAt: "DESC" },
      take: 1,
    })

    const current = latestSettings[0] ?? null

    if (!current) {
      return { success: true, data: null }
    }

    return {
      success: true,
      data: {
        ...current,
        vatRate: Number(current.vatRate),
        serviceChargeRate: Number(current.serviceChargeRate),
      },
    }
  } catch (error: any) {
    console.error("fetchSystemSettings error:", error)
    return { success: false, error: error.message || "Failed to fetch settings", data: null }
  }
}

