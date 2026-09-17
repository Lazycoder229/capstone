"use server"

import {
  createOrderVoidSchema,
  createSafeAction,
  resolveOrderVoidSchema,
  type CreateOrderVoidInput,
  type ResolveOrderVoidInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import {
  OrderEntity,
  OrderStatus,
  OrderVoidEntity,
  VoidStatus,
} from "@/lib/database/entities"

export async function fetchVoids() {
  try {
    const db = await getDatabase()
    const voidRepo = db.getRepository(OrderVoidEntity)
    const orderRepo = db.getRepository(OrderEntity)

    const voids = await voidRepo.find({
      order: { requestedAt: "DESC" },
      take: 50,
    })

    const allOrders = await orderRepo.find()
    const orderMap = new Map(allOrders.map((o) => [o.id, o]))

    const result = voids.map((v) => {
      const order = orderMap.get(v.orderId)
      return {
        id: v.id,
        orderId: v.orderId,
        orderNumber: order?.orderNumber || "",
        amount: Number(order?.total || 0),
        reason: v.reason,
        resolutionNotes: v.resolutionNotes,
        status: v.status,
        requestedBy: "Cashier Staff",
        requestedAt: new Date(v.requestedAt).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        resolvedAt: v.resolvedAt
          ? new Date(v.resolvedAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null,
      }
    })

    return { success: true, data: result }
  } catch (error: any) {
    console.error("fetchVoids error:", error)
    return { success: false, error: error.message || "Failed to fetch voids", data: [] }
  }
}

export const createVoidAction = createSafeAction(
  createOrderVoidSchema,
  async (input: CreateOrderVoidInput) => {
    const db = await getDatabase()
    const voidRepo = db.getRepository(OrderVoidEntity)

    const voidReq = voidRepo.create({
      id: crypto.randomUUID(),
      orderId: input.orderId,
      requestedByStaffId: input.requestedByStaffId,
      reason: input.reason,
      status: VoidStatus.PENDING,
    })

    await voidRepo.save(voidReq)
    return { voidId: voidReq.id, message: "Void request submitted for manager approval." }
  }
)

export const resolveVoidAction = createSafeAction(
  resolveOrderVoidSchema,
  async (input: ResolveOrderVoidInput) => {
    const db = await getDatabase()
    const voidRepo = db.getRepository(OrderVoidEntity)
    const orderRepo = db.getRepository(OrderEntity)

    const voidReq = await voidRepo.findOne({ where: { id: input.voidId } })
    if (!voidReq) throw new Error("Void request not found.")

    if (input.status === "rejected" && !input.resolutionNotes?.trim()) {
      throw new Error("A rejection reason is required.")
    }

    voidReq.status = input.status as VoidStatus
    voidReq.approvedByStaffId = input.approvedByStaffId
    voidReq.resolutionNotes = input.resolutionNotes?.trim() || null
    voidReq.resolvedAt = new Date()
    await voidRepo.save(voidReq)

    // If approved, mark order as cancelled
    if (input.status === "approved") {
      const order = await orderRepo.findOne({ where: { id: voidReq.orderId } })
      if (order) {
        order.status = OrderStatus.CANCELLED
        await orderRepo.save(order)
      }
    }

    return {
      voidId: voidReq.id,
      status: voidReq.status,
      message: `Void request has been ${input.status}.`,
    }
  }
)
