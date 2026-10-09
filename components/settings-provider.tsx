"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { fetchSystemSettings } from "@/app/actions/settings"

export interface SystemSettingsData {
  id?: string
  restaurantName: string
  branchName: string
  contactNumber: string
  email: string
  address: string
  tinNumber?: string | null
  birMin?: string | null
  currencySymbol: string
  currencyCode: string
  timezone: string
  vatEnabled: boolean
  vatRate: number
  vatInclusive: boolean
  serviceChargeEnabled: boolean
  serviceChargeRate: number
  seniorPwdDiscountEnabled: boolean
  orderNumberPrefix: string
  autoAcceptQrOrders: boolean
  requireTableSelection: boolean
  managerApprovalForVoids: boolean
  lowStockThresholdAlert: number
  receiptHeader?: string | null
  receiptFooter?: string | null
  printReceiptAuto: boolean
  printKotAuto: boolean
  showWifiOnReceipt: boolean
  wifiSsid?: string | null
  wifiPassword?: string | null
  openingTime: string
  closingTime: string
  cashDrawerOpeningBalanceRequired: boolean
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsData = {
  restaurantName: "PRIME Roast & Grill",
  branchName: "Main Branch - Manila",
  contactNumber: "+63 917 123 4567",
  email: "contact@primerestaurant.ph",
  address: "123 Culinary Boulevard, Metro Manila, Philippines",
  currencySymbol: "₱",
  currencyCode: "PHP",
  timezone: "Asia/Manila",
  vatEnabled: true,
  vatRate: 12,
  vatInclusive: true,
  serviceChargeEnabled: false,
  serviceChargeRate: 5,
  seniorPwdDiscountEnabled: true,
  orderNumberPrefix: "ORD-",
  autoAcceptQrOrders: false,
  requireTableSelection: true,
  managerApprovalForVoids: true,
  lowStockThresholdAlert: 10,
  receiptHeader: "",
  receiptFooter: "Thank you for dining with us!",
  printReceiptAuto: true,
  printKotAuto: true,
  showWifiOnReceipt: true,
  wifiSsid: "",
  wifiPassword: "",
  openingTime: "08:00",
  closingTime: "22:00",
  cashDrawerOpeningBalanceRequired: true,
}

interface SettingsContextType {
  settings: SystemSettingsData
  isLoading: boolean
  refreshSettings: () => Promise<void>
  formatCurrency: (amount: number) => string
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SYSTEM_SETTINGS,
  isLoading: true,
  refreshSettings: async () => {},
  formatCurrency: (amount: number) => `₱${Number(amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
})

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettingsData>(DEFAULT_SYSTEM_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetchSystemSettings()
      if (res.success && res.data) {
        setSettings({
          ...DEFAULT_SYSTEM_SETTINGS,
          ...(res.data as any),
        })
      }
    } catch (err) {
      console.error("Failed to fetch system settings:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSettings()

    // Listen to settings update custom event from Settings page
    const handleSettingsUpdated = () => {
      refreshSettings()
    }
    window.addEventListener("system_settings_updated", handleSettingsUpdated)
    return () => {
      window.removeEventListener("system_settings_updated", handleSettingsUpdated)
    }
  }, [refreshSettings])

  const formatCurrency = useCallback(
    (amount: number) => {
      const symbol = settings.currencySymbol || "₱"
      return `${symbol}${Number(amount || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    },
    [settings.currencySymbol],
  )

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings,
        formatCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSystemSettings() {
  return useContext(SettingsContext)
}
