"use server"

import {
  createReservationSchema,
  createSafeAction,
  updateReservationSchema,
  type CreateReservationInput,
  type UpdateReservationInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import {
  AppUserEntity,
  CustomerEntity,
  ReservationEntity,
  ReservationStatus,
  RestaurantTableEntity,
} from "@/lib/database/entities"
import { toPlain, toPlainArray } from "@/lib/utils/serialize"

export async function fetchReservations() {
  try {
    const db = await getDatabase()
    const resRepo = db.getRepository(ReservationEntity)
    const tableRepo = db.getRepository(RestaurantTableEntity)

    const reservations = await resRepo.find({
      order: { reservationDate: "DESC", reservationTime: "ASC" },
      take: 50,
    })

    const allTables = await tableRepo.find({
      order: { tableNumber: "ASC" },
    })
    const tableMap = new Map(allTables.map((t) => [t.id, t.tableNumber]))

    const result = reservations.map((r) => {
      const dateStr =
        typeof r.reservationDate === "string"
          ? r.reservationDate.split("T")[0]
          : r.reservationDate instanceof Date
            ? r.reservationDate.toISOString().split("T")[0]
            : String(r.reservationDate)

      const timeStr =
        typeof r.reservationTime === "string"
          ? r.reservationTime.slice(0, 5)
          : "12:00"

      return {
        ...toPlain(r),
        reservationDate: dateStr,
        reservationTime: timeStr,
        table: r.tableId ? tableMap.get(r.tableId) || "Table" : null,
      }
    })

    const custRepo = db.getRepository(CustomerEntity)
    const userRepo = db.getRepository(AppUserEntity)

    const [allCustomers, allStaff] = await Promise.all([
      custRepo.find({ order: { name: "ASC" } }),
      userRepo.find({ order: { name: "ASC" } }),
    ])

    return {
      success: true,
      data: result,
      tables: toPlainArray(allTables),
      customers: toPlainArray(allCustomers),
      staff: toPlainArray(allStaff),
    }
  } catch (error: any) {
    console.error("fetchReservations error:", error)
    return { success: false, error: error.message || "Failed to fetch reservations", data: [], tables: [], customers: [], staff: [] }
  }
}

export const createReservationAction = createSafeAction(
  createReservationSchema,
  async (input: CreateReservationInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(ReservationEntity)

    const reservation = repo.create({
      id: crypto.randomUUID(),
      customerId: input.customerId ?? null,
      customerName: input.customerName,
      contactNumber: input.contactNumber,
      email: input.email ?? null,
      tableId: input.tableId ?? null,
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime,
      numberOfGuests: input.numberOfGuests,
      status: ReservationStatus.PENDING,
      notes: input.notes ?? null,
      createdByStaffId: input.createdByStaffId ?? null,
    })

    await repo.save(reservation)
    return { reservationId: reservation.id, message: "Reservation registered successfully." }
  }
)

export const updateReservationAction = createSafeAction(
  updateReservationSchema,
  async (input: UpdateReservationInput) => {
    const db = await getDatabase()
    const repo = db.getRepository(ReservationEntity)

    const reservation = await repo.findOne({ where: { id: input.id } })
    if (!reservation) throw new Error("Reservation not found.")

    if (input.customerName !== undefined) reservation.customerName = input.customerName
    if (input.contactNumber !== undefined) reservation.contactNumber = input.contactNumber
    if (input.email !== undefined) reservation.email = input.email ?? null
    if (input.tableId !== undefined) reservation.tableId = input.tableId ?? null
    if (input.reservationDate !== undefined) reservation.reservationDate = input.reservationDate
    if (input.reservationTime !== undefined) reservation.reservationTime = input.reservationTime
    if (input.numberOfGuests !== undefined) reservation.numberOfGuests = input.numberOfGuests
    if (input.status !== undefined) reservation.status = input.status as ReservationStatus
    if (input.notes !== undefined) reservation.notes = input.notes ?? null

    await repo.save(reservation)
    return { reservationId: reservation.id, message: "Reservation updated successfully." }
  }
)

export async function deleteReservationAction(id: string) {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(ReservationEntity)
    await repo.delete(id)
    return { success: true, message: "Reservation cancelled and deleted successfully." }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete reservation." }
  }
}
