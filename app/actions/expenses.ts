"use server"

import {
  createExpenseCategorySchema,
  createExpenseSchema,
  createSafeAction,
  type CreateExpenseCategoryInput,
  type CreateExpenseInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import { ExpenseCategoryEntity, ExpenseEntity } from "@/lib/database/entities"

export const createExpenseCategoryAction = createSafeAction(
  createExpenseCategorySchema,
  async (input: CreateExpenseCategoryInput) => {
    const db = await getDatabase()
    const catRepo = db.getRepository(ExpenseCategoryEntity)

    const existing = await catRepo.findOne({ where: { name: input.name } })
    if (existing) {
      throw new Error(`Expense category '${input.name}' already exists.`)
    }

    const category = catRepo.create({
      id: crypto.randomUUID(),
      name: input.name,
      isActive: input.isActive ?? true,
    })

    await catRepo.save(category)
    return { categoryId: category.id, name: category.name }
  }
)

export const createExpenseAction = createSafeAction(
  createExpenseSchema,
  async (input: CreateExpenseInput) => {
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
    return {
      expenseId: expense.id,
      amount: expense.amount,
      description: expense.description,
      message: "Expense recorded successfully.",
    }
  }
)
