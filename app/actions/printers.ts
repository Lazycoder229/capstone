"use server"

import {
  createPrinterSchema,
  createSafeAction,
  updatePrinterSchema,
  type CreatePrinterInput,
  type UpdatePrinterInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import {
  ConnectionType,
  PrinterEntity,
  PrinterLocation,
} from "@/lib/database/entities"
import { toPlainArray } from "@/lib/utils/serialize"

export async function fetchPrinters() {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(PrinterEntity)

    let printers = await repo.find({
      order: { name: "ASC" },
    })

    return { success: true, data: toPlainArray(printers) }
  } catch (error: any) {
    console.error("fetchPrinters error:", error)
    return { success: false, error: error.message || "Failed to fetch printers", data: [] }
  }
}

export const createPrinterAction = createSafeAction(
  createPrinterSchema,
  async (input: CreatePrinterInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(PrinterEntity)

    const printer = repo.create({
      id: crypto.randomUUID(),
      name: input.name,
      location: input.location as PrinterLocation,
      connectionType: input.connectionType as ConnectionType,
      ipAddress: input.ipAddress ?? null,
      isActive: input.isActive ?? true,
    })

    await repo.save(printer)
    return { printerId: printer.id, message: "Printer configured successfully." }
  }
)

export const updatePrinterAction = createSafeAction(
  updatePrinterSchema,
  async (input: UpdatePrinterInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(PrinterEntity)

    const printer = await repo.findOne({ where: { id: input.id } })
    if (!printer) throw new Error("Printer not found.")

    if (input.name !== undefined) printer.name = input.name
    if (input.location !== undefined) printer.location = input.location as PrinterLocation
    if (input.connectionType !== undefined) printer.connectionType = input.connectionType as ConnectionType
    if (input.ipAddress !== undefined) printer.ipAddress = input.ipAddress ?? null
    if (input.isActive !== undefined) printer.isActive = input.isActive

    await repo.save(printer)
    return { printerId: printer.id, message: "Printer configuration updated." }
  }
)

export async function deletePrinterAction(id: string) {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(PrinterEntity)
    await repo.delete(id)
    return { success: true, message: "Printer deleted successfully." }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete printer." }
  }
}
