import { Settings2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Branch } from "@/lib/database/entities/entities/Branch"
import { SystemSetting } from "@/lib/database/entities/entities/SystemSetting"
import { SettingsForm } from "./settings-form"
import type { BranchSummary, SystemSettingsFormValues } from "./types"

const defaults: SystemSettingsFormValues = {
  branchId: null,
  restaurantName: "PRIME Roast & Grill",
  branchName: "Main Branch - Manila",
  contactNumber: "+63 917 123 4567",
  email: "contact@primerestaurant.ph",
  address: "Manila, Philippines",
  tinNumber: null,
  birMin: null,
  currencySymbol: "₱",
  currencyCode: "PHP",
  timezone: "Asia/Manila",
  vatEnabled: true,
  vatRate: 12,
  vatInclusive: true,
  serviceChargeEnabled: false,
  serviceChargeRate: 5,
  seniorPwdDiscountEnabled: true,
  paymentCashEnabled: true,
  paymentGcashEnabled: true,
  paymentMayaEnabled: true,
  paymentQrphEnabled: true,
  orderNumberPrefix: "ORD-",
  autoAcceptQrOrders: false,
  requireTableSelection: true,
  managerApprovalForVoids: true,
  lowStockThresholdAlert: 10,
  receiptHeader: null,
  receiptFooter: null,
  printReceiptAuto: true,
  printKotAuto: true,
  showWifiOnReceipt: true,
  wifiSsid: null,
  wifiPassword: "",
  openingTime: "08:00",
  closingTime: "22:00",
  cashDrawerOpeningBalanceRequired: true,
  payrollDutyHours: 8,
  payrollUnpaidBreakHours: 1,
  payrollWorkdaysPerMonth: 26,
  payrollOvertimeMultiplier: 1.25,
  payrollSssEmployeeShare: 0,
  payrollSssEmployerShare: 255,
  payrollPhilhealthEmployeeShare: 0,
  payrollPhilhealthEmployerShare: 125,
  payrollPagibigEmployeeShare: 0,
  payrollPagibigEmployerShare: 4.5,
  payrollMealsDeduction: 0,
  gcashQrImage: null,
  mayaQrImage: null,
  qrphQrImage: null,
}

function useMainBranchValues(
  values: SystemSettingsFormValues,
  branches: BranchSummary[]
): SystemSettingsFormValues {
  const mainBranch = branches.find((branch) => branch.isMain)
  if (!mainBranch) return values

  return {
    ...values,
    branchId: mainBranch.id,
    branchName: mainBranch.name,
    contactNumber: mainBranch.contactNumber ?? "",
    email: mainBranch.email ?? "",
    address: collapseRepeatedAddressLines(mainBranch.address ?? ""),
  }
}

function collapseRepeatedAddressLines(address: string) {
  return address
    .split(/\r?\n/)
    .filter(
      (line, index, lines) =>
        index === 0 || line.trim() !== lines[index - 1].trim()
    )
    .join("\n")
}

async function loadSettings() {
  try {
    const dataSource = await getInitializedDataSource()
    const [record, branches] = await Promise.all([
      dataSource
        .getRepository(SystemSetting)
        .createQueryBuilder("settings")
        .addSelect("settings.gcashQrImage")
        .addSelect("settings.mayaQrImage")
        .addSelect("settings.qrphQrImage")
        .take(1)
        .getOne(),
      dataSource
        .getRepository(Branch)
        .find({ order: { isMain: "DESC", name: "ASC" } }),
    ])
    const branchSummaries: BranchSummary[] = branches.map(
      ({
        id,
        name,
        code,
        type,
        address,
        contactNumber,
        email,
        isMain,
        isActive,
      }) => ({
        id,
        name,
        code,
        type,
        address,
        contactNumber,
        email,
        isMain,
        isActive,
      })
    )
    if (!record)
      return {
        values: useMainBranchValues(defaults, branchSummaries),
        unavailable: false,
        configMissing: false,
        hasGcashQr: false,
        hasMayaQr: false,
        hasQrphQr: false,
        hasWifiPassword: false,
        branches: branchSummaries,
      }

    const {
      id: _id,
      updatedAt: _updatedAt,
      gcashQrImage,
      mayaQrImage,
      qrphQrImage,
      wifiPassword,
      ...values
    } = record
    return {
      values: useMainBranchValues(
        {
          ...defaults,
          ...values,
          address: collapseRepeatedAddressLines(values.address),
        },
        branchSummaries
      ),
      unavailable: false,
      configMissing: false,
      hasGcashQr: Boolean(gcashQrImage),
      hasMayaQr: Boolean(mayaQrImage),
      hasQrphQr: Boolean(qrphQrImage),
      hasWifiPassword: Boolean(wifiPassword),
      branches: branchSummaries,
    }
  } catch (error) {
    console.error("Unable to load system settings:", error)
    return {
      values: defaults,
      unavailable: true,
      configMissing:
        error instanceof Error &&
        error.message.startsWith("Missing database configuration:"),
      hasGcashQr: false,
      hasMayaQr: false,
      hasQrphQr: false,
      hasWifiPassword: false,
      branches: [],
    }
  }
}

export default async function SettingsPage() {
  const {
    values,
    unavailable,
    configMissing,
    hasGcashQr,
    hasMayaQr,
    hasQrphQr,
    hasWifiPassword,
    branches,
  } = await loadSettings()

  return (
    <main className="w-full space-y-6 pb-10">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">
          <Settings2 className="size-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            System Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            I-manage ang restaurant, tax, order, at receipt preferences.
          </p>
        </div>
      </div>

      {unavailable && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 text-sm">
            {configMissing
              ? "Wala pang database configuration. Idagdag ang DB_HOST, DB_USERNAME, DB_PASSWORD, at DB_DATABASE sa .env.local (optional ang DB_PORT), pagkatapos ay i-restart ang dev server."
              : "Hindi ma-access ang database. Ipinapakita ang default values; suriin ang credentials, network connection, at kung nailapat na ang migrations bago mag-save."}
          </CardContent>
        </Card>
      )}

      <Card size="sm">
        <CardHeader>
          <CardTitle>Restaurant configuration</CardTitle>
          <CardDescription>
            Naka-save ang mga value na ito sa system settings at ginagamit ng
            POS sa buong app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            initialValues={values}
            hasGcashQr={hasGcashQr}
            hasMayaQr={hasMayaQr}
            hasQrphQr={hasQrphQr}
            hasWifiPassword={hasWifiPassword}
            branches={branches}
          />
        </CardContent>
      </Card>
    </main>
  )
}
