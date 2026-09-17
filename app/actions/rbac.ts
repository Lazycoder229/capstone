"use server"

import {
  assignRolePermissionsSchema,
  assignUserRoleSchema,
  createRoleSchema,
  createSafeAction,
  type AssignRolePermissionsInput,
  type AssignUserRoleInput,
  type CreateRoleInput,
} from "@/lib/validations"
import { getDatabase } from "@/lib/database/data-source"
import {
  AppUserEntity,
  PermissionEntity,
  RoleEntity,
  RolePermissionEntity,
} from "@/lib/database/entities"
import { toPlainArray } from "@/lib/utils/serialize"

export async function fetchRbacData() {
  try {
    const db = await getDatabase()
    const roleRepo = db.getRepository(RoleEntity)
    const permRepo = db.getRepository(PermissionEntity)
    const rpRepo = db.getRepository(RolePermissionEntity)
    const userRepo = db.getRepository(AppUserEntity)

    let roles = await roleRepo.find({ order: { name: "ASC" } })
    let permissions = await permRepo.find({ order: { module: "ASC", code: "ASC" } })
    const rolePermissions = await rpRepo.find()
    const users = await userRepo.find({ order: { name: "ASC" } })

    return {
      success: true,
      data: {
        roles: toPlainArray(roles),
        permissions: toPlainArray(permissions),
        rolePermissions: toPlainArray(rolePermissions),
        users: users.map((u) => ({
          id: u.id,
          name: u.name || "Staff Member",
          email: u.email || "",
          roleId: u.roleId,
          isActive: u.isActive,
        })),
      },
    }
  } catch (error: any) {
    console.error("fetchRbacData error:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch RBAC data",
      data: { roles: [], permissions: [], rolePermissions: [], users: [] },
    }
  }
}

export const createRoleAction = createSafeAction(
  createRoleSchema,
  async (input: CreateRoleInput) => {
    const db = await getDatabase()
    const roleRepo = db.getRepository(RoleEntity)
    const rpRepo = db.getRepository(RolePermissionEntity)

    const existing = await roleRepo.findOne({ where: { name: input.name } })
    if (existing) {
      throw new Error(`Role '${input.name}' already exists.`)
    }

    const role = roleRepo.create({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description ?? null,
      isSystem: input.isSystem ?? false,
    })

    await roleRepo.save(role)

    if (input.permissionIds && input.permissionIds.length > 0) {
      const perms = input.permissionIds.map((pId) =>
        rpRepo.create({
          roleId: role.id,
          permissionId: pId,
        })
      )
      await rpRepo.save(perms)
    }

    return { roleId: role.id, name: role.name, message: "Role created successfully." }
  }
)

export const assignRolePermissionsAction = createSafeAction(
  assignRolePermissionsSchema,
  async (input: AssignRolePermissionsInput) => {
    const db = await getDatabase()
    const rpRepo = db.getRepository(RolePermissionEntity)

    // Remove existing
    await rpRepo.delete({ roleId: input.roleId })

    // Save new
    const perms = input.permissionIds.map((pId) =>
      rpRepo.create({
        roleId: input.roleId,
        permissionId: pId,
      })
    )
    await rpRepo.save(perms)

    return { message: "Role permissions saved successfully." }
  }
)

export const assignUserRoleAction = createSafeAction(
  assignUserRoleSchema,
  async (input: AssignUserRoleInput) => {
    const db = await getDatabase()
    const userRepo = db.getRepository(AppUserEntity)

    const user = await userRepo.findOne({ where: { id: input.userId } })
    if (!user) throw new Error("User not found.")

    user.roleId = input.roleId
    await userRepo.save(user)

    return { message: "Staff role assigned successfully." }
  }
)
