"use server"

import { getDatabase } from "@/lib/database/data-source"
import { BranchEntity, SystemSettingEntity } from "@/lib/database/entities"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface BranchFormData {
  name: string
  code: string
  type?: string
  address?: string
  contactNumber?: string
  email?: string
  isMain?: boolean
  isActive?: boolean
}

export interface BranchResult {
  id: string
  name: string
  code: string
  type: string
  address: string | null
  contactNumber: string | null
  email: string | null
  isMain: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Fetch all branches
// ---------------------------------------------------------------------------
export async function fetchBranches(): Promise<{
  success: boolean
  data: BranchResult[]
  error?: string
}> {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(BranchEntity)
    const branches = await repo.find({ order: { isMain: "DESC", name: "ASC" } })

    return {
      success: true,
      data: branches.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        type: b.type,
        address: b.address,
        contactNumber: b.contactNumber,
        email: b.email,
        isMain: b.isMain,
        isActive: b.isActive,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    }
  } catch (error: any) {
    console.error("fetchBranches error:", error)
    return { success: false, data: [], error: error.message || "Failed to fetch branches" }
  }
}

// ---------------------------------------------------------------------------
// Create a new branch
// ---------------------------------------------------------------------------
export async function createBranchAction(data: BranchFormData): Promise<{
  success: boolean
  data?: BranchResult
  error?: string
}> {
  try {
    if (!data.name?.trim()) return { success: false, error: "Branch name is required" }
    if (!data.code?.trim()) return { success: false, error: "Branch code is required" }

    const db = await getDatabase()
    const repo = db.getRepository(BranchEntity)

    // Check if code already exists
    const existing = await repo.findOneBy({ code: data.code.trim() })
    if (existing) return { success: false, error: `Branch code "${data.code}" already exists` }

    const branch = repo.create({
      id: crypto.randomUUID(),
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      type: data.type?.trim() || "branch",
      address: data.address?.trim() || null,
      contactNumber: data.contactNumber?.trim() || null,
      email: data.email?.trim() || null,
      isMain: data.isMain ?? false,
      isActive: data.isActive ?? true,
    })

    // If this is set as main, unset any existing main branch
    if (branch.isMain) {
      await repo.update({ isMain: true }, { isMain: false })
    }

    await repo.save(branch)

    // If it's the main branch, also sync to system settings
    if (branch.isMain) {
      await syncBranchToSettings(db, branch)
    }

    return {
      success: true,
      data: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        type: branch.type,
        address: branch.address,
        contactNumber: branch.contactNumber,
        email: branch.email,
        isMain: branch.isMain,
        isActive: branch.isActive,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      },
    }
  } catch (error: any) {
    console.error("createBranchAction error:", error)
    return { success: false, error: error.message || "Failed to create branch" }
  }
}

// ---------------------------------------------------------------------------
// Update an existing branch
// ---------------------------------------------------------------------------
export async function updateBranchAction(
  id: string,
  data: Partial<BranchFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(BranchEntity)
    const branch = await repo.findOneBy({ id })

    if (!branch) return { success: false, error: "Branch not found" }

    // Check if code changed and already exists
    if (data.code && data.code.trim().toUpperCase() !== branch.code) {
      const existing = await repo.findOneBy({ code: data.code.trim().toUpperCase() })
      if (existing) return { success: false, error: `Branch code "${data.code}" already exists` }
    }

    if (data.name !== undefined) branch.name = data.name.trim()
    if (data.code !== undefined) branch.code = data.code.trim().toUpperCase()
    if (data.type !== undefined) branch.type = data.type.trim() || "branch"
    if (data.address !== undefined) branch.address = data.address.trim() || null
    if (data.contactNumber !== undefined) branch.contactNumber = data.contactNumber.trim() || null
    if (data.email !== undefined) branch.email = data.email.trim() || null
    if (data.isActive !== undefined) branch.isActive = data.isActive
    if (data.isMain !== undefined) {
      // If setting as main, unset any other main branch
      if (data.isMain && !branch.isMain) {
        await repo.update({ isMain: true }, { isMain: false })
      }
      branch.isMain = data.isMain
    }

    await repo.save(branch)

    // If this is the main branch, sync to system settings
    if (branch.isMain) {
      await syncBranchToSettings(db, branch)
    }

    return { success: true }
  } catch (error: any) {
    console.error("updateBranchAction error:", error)
    return { success: false, error: error.message || "Failed to update branch" }
  }
}

// ---------------------------------------------------------------------------
// Delete a branch
// ---------------------------------------------------------------------------
export async function deleteBranchAction(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(BranchEntity)
    const branch = await repo.findOneBy({ id })

    if (!branch) return { success: false, error: "Branch not found" }
    if (branch.isMain) return { success: false, error: "Cannot delete the main branch. Set another branch as main first." }

    await repo.delete({ id })

    return { success: true }
  } catch (error: any) {
    console.error("deleteBranchAction error:", error)
    return { success: false, error: error.message || "Failed to delete branch" }
  }
}

// ---------------------------------------------------------------------------
// Set active branch (sets isMain, syncs to system settings)
// ---------------------------------------------------------------------------
export async function setActiveBranchAction(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const db = await getDatabase()
    const repo = db.getRepository(BranchEntity)
    const branch = await repo.findOneBy({ id })

    if (!branch) return { success: false, error: "Branch not found" }

    // Unset all main branches, set this one as main
    await repo.update({ isMain: true }, { isMain: false })
    branch.isMain = true
    branch.isActive = true
    await repo.save(branch)

    // Sync branch info to system settings
    await syncBranchToSettings(db, branch)

    return { success: true }
  } catch (error: any) {
    console.error("setActiveBranchAction error:", error)
    return { success: false, error: error.message || "Failed to set active branch" }
  }
}

// ---------------------------------------------------------------------------
// Internal: sync branch details to the SystemSettingEntity
// ---------------------------------------------------------------------------
async function syncBranchToSettings(db: any, branch: BranchEntity) {
  try {
    const settingsRepo = db.getRepository(SystemSettingEntity)
    const settings = await settingsRepo.find({ order: { updatedAt: "DESC" }, take: 1 })
    const current = settings[0]

    if (current) {
      current.branchName = branch.name
      if (branch.address) current.address = branch.address
      if (branch.contactNumber) current.contactNumber = branch.contactNumber
      if (branch.email) current.email = branch.email
      await settingsRepo.save(current)
    }
  } catch (err) {
    console.error("syncBranchToSettings error:", err)
  }
}
