"use server"

import {
  createRestaurantTableSchema,
  createSafeAction,
  updateRestaurantTableSchema,
  type CreateRestaurantTableInput,
  type UpdateRestaurantTableInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import { RestaurantTableEntity, RestaurantTableStatus } from "@/lib/database/entities"
import { toPlain, toPlainArray } from "@/lib/utils/serialize"

export async function fetchTables() {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(RestaurantTableEntity)
    let tables = await repo.find({
      order: { tableNumber: "ASC" },
    })

    return { success: true, data: toPlainArray(tables) }
  } catch (error: any) {
    console.error("fetchTables error:", error)
    return { success: false, error: error.message || "Failed to fetch tables", data: [] }
  }
}

export const createTableAction = createSafeAction(
  createRestaurantTableSchema,
  async (input: CreateRestaurantTableInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(RestaurantTableEntity)

    const existing = await repo.findOne({ where: { tableNumber: input.tableNumber } })
    if (existing) {
      throw new Error(`Table number '${input.tableNumber}' already exists.`)
    }

    const table = repo.create({
      id: crypto.randomUUID(),
      tableNumber: input.tableNumber,
      capacity: input.capacity,
      status: (input.status as RestaurantTableStatus) ?? RestaurantTableStatus.AVAILABLE,
      qrCodeUrl: input.qrCodeUrl ?? `/t/${input.tableNumber.toLowerCase().replace(/\s+/g, "-")}`,
    })

    await repo.save(table)
    return { table: toPlain(table), message: "Table created successfully." }
  }
)

export const updateTableAction = createSafeAction(
  updateRestaurantTableSchema,
  async (input: UpdateRestaurantTableInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(RestaurantTableEntity)

    const table = await repo.findOne({ where: { id: input.id } })
    if (!table) throw new Error("Table not found.")

    if (input.tableNumber !== undefined) table.tableNumber = input.tableNumber
    if (input.capacity !== undefined) table.capacity = input.capacity
    if (input.status !== undefined) table.status = input.status as RestaurantTableStatus
    if (input.qrCodeUrl !== undefined) table.qrCodeUrl = input.qrCodeUrl

    await repo.save(table)
    return { table: toPlain(table), message: "Table updated successfully." }
  }
)

export async function deleteTableAction(id: string) {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(RestaurantTableEntity)
    await repo.delete(id)
    return { success: true, message: "Table deleted successfully." }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete table." }
  }
}
