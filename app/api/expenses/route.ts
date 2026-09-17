import { NextRequest, NextResponse } from "next/server"
import { createExpenseSchema, validateApiRequest } from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import { ExpenseEntity } from "@/lib/database/entities"

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase()
    const expenseRepo = db.getRepository(ExpenseEntity)
    const expenses = await expenseRepo.find({
      order: { expenseDate: "DESC" },
      take: 50,
    })

    return NextResponse.json({ success: true, data: expenses })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch expenses" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  // Validate request body using Zod schema
  const validation = await validateApiRequest(req, createExpenseSchema)
  if ("errorResponse" in validation) {
    return validation.errorResponse
  }

  const input = validation.data

  try {
    const db = await getDatabase()
    const expenseRepo = db.getRepository(ExpenseEntity)

    const expense = expenseRepo.create({
      id: crypto.randomUUID(),
      categoryId: input.categoryId,
      description: input.description,
      amount: String(input.amount),
      expenseDate: input.expenseDate,
      receiptReference: input.receiptReference ?? null,
      notes: input.notes ?? null,
      recordedByStaffId: input.recordedByStaffId,
    })

    await expenseRepo.save(expense)

    return NextResponse.json(
      {
        success: true,
        data: expense,
        message: "Expense recorded successfully",
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record expense" },
      { status: 500 }
    )
  }
}
