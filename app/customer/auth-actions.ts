"use server"

import { redirect } from "next/navigation"
import { randomUUID } from "node:crypto"
import { z } from "zod"
import { getInitializedDataSource } from "@/lib/database/data-source"
import { Customer } from "@/lib/database/entities/entities/Customer"
import { hashPassword, verifyPassword } from "@/lib/security/password"
import {
  createCustomerSession,
  destroyCustomerSession,
} from "@/lib/customer-auth/session"

export type CustomerAuthState = { message: string } | null

const emailSchema = z.string().trim().email().max(255)

function customerReturnTo(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value : ""
  if (!raw) return "/customer/dashboard"
  if (!raw.startsWith("/") || raw.startsWith("//"))
    return "/customer/dashboard"
  try {
    const url = new URL(raw, "http://prime.local")
    if (
      url.origin !== "http://prime.local" ||
      url.pathname !== "/customer/kiosk"
    )
      return "/customer/dashboard"
    const tableId = url.searchParams.get("tableId")
    if (!tableId) return "/customer/kiosk"
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      tableId
    )
      ? `/customer/kiosk?tableId=${encodeURIComponent(tableId)}`
      : "/customer/dashboard"
  } catch {
    return "/customer/dashboard"
  }
}

export async function registerCustomer(
  _previous: CustomerAuthState,
  formData: FormData
): Promise<CustomerAuthState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter your full name.").max(100),
      email: emailSchema,
      contactNumber: z.string().trim().max(20),
      password: z
        .string()
        .min(8, "Use a password with at least 8 characters.")
        .max(100),
      confirmPassword: z.string(),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    })
    .safeParse({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? "").toLowerCase(),
      contactNumber: String(formData.get("contactNumber") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    })
  if (!parsed.success)
    return { message: parsed.error.issues[0]?.message ?? "Check your details." }

  let customerId: string
  try {
    const source = await getInitializedDataSource()
    const customer = await source.transaction(async (manager) => {
      const repository = manager.getRepository(Customer)
      const existing = await repository.findOneBy({ email: parsed.data.email })
      if (existing)
        throw new Error("An account with this email already exists.")
      return repository.save(
        repository.create({
          id: randomUUID(),
          email: parsed.data.email,
          password: hashPassword(parsed.data.password),
          name: parsed.data.name,
          contactNumber: parsed.data.contactNumber || null,
          loyaltyPointsBalance: 0,
          isGuest: false,
          dateOfBirth: null,
          pwdIdNumber: null,
          updatedAt: null,
        })
      )
    })
    customerId = customer.id
  } catch (error) {
    const duplicate =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    return {
      message:
        error instanceof Error &&
        error.message === "An account with this email already exists."
          ? error.message
          : duplicate
            ? "An account with this email already exists."
            : "Could not create the account. Please try again.",
    }
  }
  await createCustomerSession(customerId)
  redirect(customerReturnTo(formData.get("returnTo")))
}

export async function loginCustomer(
  _previous: CustomerAuthState,
  formData: FormData
): Promise<CustomerAuthState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1).max(100) })
    .safeParse({
      email: String(formData.get("email") ?? "").toLowerCase(),
      password: String(formData.get("password") ?? ""),
    })
  if (!parsed.success) return { message: "Enter a valid email and password." }
  try {
    const source = await getInitializedDataSource()
    const customer = await source
      .getRepository(Customer)
      .createQueryBuilder("customer")
      .addSelect("customer.password")
      .where("customer.email = :email", { email: parsed.data.email })
      .andWhere("customer.isGuest = :isGuest", { isGuest: false })
      .getOne()
    if (
      !customer?.password ||
      !(await verifyPassword(parsed.data.password, customer.password))
    )
      return { message: "Email or password is incorrect." }
    if (customer.password.startsWith("$2")) {
      customer.password = hashPassword(parsed.data.password)
      await source.getRepository(Customer).save(customer)
    }
    await createCustomerSession(customer.id)
  } catch (error) {
    console.error("Customer login failed:", error)
    return { message: "Could not sign in. Please try again." }
  }
  redirect(customerReturnTo(formData.get("returnTo")))
}

export async function logoutCustomer() {
  await destroyCustomerSession()
  redirect("/customer/login")
}
