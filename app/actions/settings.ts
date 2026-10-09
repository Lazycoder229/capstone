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

    let current = latestSettings[0] ?? null

    if (!current) {
      current = settingsRepo.create({
        id: crypto.randomUUID(),
        restaurantName: "PRIME Roast & Grill",
        branchName: "Main Branch - Manila",
        contactNumber: "+63 917 123 4567",
        email: "contact@primerestaurant.ph",
        address: "123 Culinary Boulevard, Metro Manila, Philippines",
        tinNumber: "123-456-789-000",
        birMin: "MIN-2024-001234",
        currencySymbol: "₱",
        currencyCode: "PHP",
        timezone: "Asia/Manila",
        vatEnabled: true,
        vatRate: "12.00",
        vatInclusive: true,
        serviceChargeEnabled: false,
        serviceChargeRate: "5.00",
        seniorPwdDiscountEnabled: true,
        orderNumberPrefix: "ORD-",
        autoAcceptQrOrders: false,
        requireTableSelection: true,
        managerApprovalForVoids: true,
        lowStockThresholdAlert: 10,
        receiptHeader: "PRIME Roast & Grill\nCulinary Boulevard, Manila",
        receiptFooter: "Thank you for dining with us! Please come again.",
        printReceiptAuto: true,
        printKotAuto: true,
        showWifiOnReceipt: true,
        wifiSsid: "PRIME-Guest",
        wifiPassword: "deliciousroast",
        openingTime: "08:00",
        closingTime: "22:00",
        cashDrawerOpeningBalanceRequired: true,
      })
      await settingsRepo.save(current)
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

