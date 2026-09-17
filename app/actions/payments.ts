"use server"

import {
  createPaymentSchema,
  createSafeAction,
  type CreatePaymentInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import {
  OrderEntity,
  OrderStatus,
  OrderStatusHistoryEntity,
  PaymentEntity,
  RestaurantTableEntity,
  RestaurantTableStatus,
} from "@/lib/database/entities"

export const createPaymentAction = createSafeAction(
  createPaymentSchema,
  async (input: CreatePaymentInput) => {
    const db = await getDatabase()

    return db.transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity)
      const paymentRepo = manager.getRepository(PaymentEntity)
      const historyRepo = manager.getRepository(OrderStatusHistoryEntity)

      const order = await orderRepo.findOne({ where: { id: input.orderId } })
      if (!order) throw new Error("Order not found.")
      if (order.status === OrderStatus.CANCELLED) {
        throw new Error("Cancelled orders cannot be paid.")
      }

      const existingPayment = await paymentRepo.findOne({ where: { orderId: order.id } })
      if (existingPayment) throw new Error("This order has already been paid.")

      const amountPaid = Number(input.amountPaid)
      if (amountPaid < Number(order.total)) {
        throw new Error("Payment amount cannot be less than the order total.")
      }

      const payment = paymentRepo.create({
        id: crypto.randomUUID(),
        orderId: order.id,
        receiptNumber: `RCT-${Date.now().toString().slice(-8)}`,
        amountPaid: String(amountPaid),
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber ?? null,
        processedByStaffId: input.processedByStaffId ?? crypto.randomUUID(),
      })
      await paymentRepo.save(payment)

      if (order.status !== OrderStatus.COMPLETED) {
        order.status = OrderStatus.COMPLETED
        await orderRepo.save(order)
        await historyRepo.save(
          historyRepo.create({
            id: crypto.randomUUID(),
            orderId: order.id,
            status: OrderStatus.COMPLETED,
            changedByStaffId: input.processedByStaffId ?? null,
          }),
        )
      }

      if (order.tableId) {
        const tableRepo = manager.getRepository(RestaurantTableEntity)
        const table = await tableRepo.findOne({ where: { id: order.tableId } })
        if (table && table.status === RestaurantTableStatus.OCCUPIED) {
          table.status = RestaurantTableStatus.AVAILABLE
          await tableRepo.save(table)
        }
      }

      return {
        paymentId: payment.id,
        receiptNumber: payment.receiptNumber,
        change: amountPaid - Number(order.total),
        message: "Payment recorded successfully.",
      }
    })
  },
)
