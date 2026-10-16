import { z } from "zod"

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Gamitin ang oras na HH:mm.")
const qrImage = z
  .string()
  .max(420_000, "Hanggang 300 KB lang ang QR image.")
  .refine(
    (value) => !value || /^data:image\/(png|jpeg|webp);base64,/.test(value),
    "PNG, JPG, o WebP image lang ang puwede."
  )
  .transform((value) => value || null)

export const systemSettingsSchema = z
  .object({
    branchId: z
      .string()
      .uuid()
      .or(z.literal(""))
      .transform((value) => value || null),
    restaurantName: z.string().trim().min(1).max(150),
    branchName: z.string().trim().min(1).max(100),
    contactNumber: z.string().trim().max(50),
    email: z.union([z.email().max(120), z.literal("")]),
    address: z.string().trim(),
    tinNumber: optionalText(50),
    birMin: optionalText(50),
    currencySymbol: z.string().trim().min(1).max(10),
    currencyCode: z
      .string()
      .trim()
      .min(1)
      .max(10)
      .transform((value) => value.toUpperCase()),
    timezone: z.string().trim().min(1).max(50),
    vatEnabled: z.boolean(),
    vatRate: z.coerce.number().min(0).max(100),
    vatInclusive: z.boolean(),
    serviceChargeEnabled: z.boolean(),
    serviceChargeRate: z.coerce.number().min(0).max(100),
    seniorPwdDiscountEnabled: z.boolean(),
    paymentCashEnabled: z.boolean(),
    paymentGcashEnabled: z.boolean(),
    paymentMayaEnabled: z.boolean(),
    paymentQrphEnabled: z.boolean(),
    orderNumberPrefix: z.string().trim().min(1).max(20),
    autoAcceptQrOrders: z.boolean(),
    requireTableSelection: z.boolean(),
    managerApprovalForVoids: z.boolean(),
    lowStockThresholdAlert: z.coerce.number().int().min(0).max(4_294_967_295),
    receiptHeader: optionalText(65_535),
    receiptFooter: optionalText(65_535),
    printReceiptAuto: z.boolean(),
    printKotAuto: z.boolean(),
    showWifiOnReceipt: z.boolean(),
    wifiSsid: optionalText(100),
    wifiPassword: z.string().trim().max(100),
    openingTime: time,
    closingTime: time,
    cashDrawerOpeningBalanceRequired: z.boolean(),
    payrollDutyHours: z.coerce.number().positive().max(24),
    payrollUnpaidBreakHours: z.coerce.number().min(0).max(24),
    payrollWorkdaysPerMonth: z.coerce.number().positive().max(31),
    payrollOvertimeMultiplier: z.coerce.number().min(1).max(5),
    payrollSssEmployeeShare: z.coerce.number().min(0).max(99_999_999.99),
    payrollSssEmployerShare: z.coerce.number().min(0).max(99_999_999.99),
    payrollPhilhealthEmployeeShare: z.coerce.number().min(0).max(99_999_999.99),
    payrollPhilhealthEmployerShare: z.coerce.number().min(0).max(99_999_999.99),
    payrollPagibigEmployeeShare: z.coerce.number().min(0).max(99_999_999.99),
    payrollPagibigEmployerShare: z.coerce.number().min(0).max(99_999_999.99),
    payrollMealsDeduction: z.coerce.number().min(0).max(99_999_999.99),
    gcashQrImage: qrImage,
    mayaQrImage: qrImage,
    qrphQrImage: qrImage,
  })
  .refine(
    (settings) =>
      settings.paymentCashEnabled ||
      settings.paymentGcashEnabled ||
      settings.paymentMayaEnabled ||
      settings.paymentQrphEnabled,
    { message: "Enable at least one payment method." }
  )

export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>
