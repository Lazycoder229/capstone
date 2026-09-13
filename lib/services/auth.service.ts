import { randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

import { getDatabase } from "@/lib/database/data-source"
import { AppUserEntity } from "@/lib/database/entities"

const scrypt = promisify(nodeScrypt)
const passwordKeyLength = 64
const minimumPasswordLength = 8

export type AuthUser = {
  id: string
  name: string | null
  email: string
  image: string | null
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const key = (await scrypt(password, salt, passwordKeyLength)) as Buffer
  return `scrypt:${salt}:${key.toString("hex")}`
}

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, keyHex] = storedHash.split(":")
  if (algorithm !== "scrypt" || !salt || !keyHex) return false

  const expectedKey = Buffer.from(keyHex, "hex")
  const actualKey = (await scrypt(password, salt, expectedKey.length)) as Buffer

  return (
    expectedKey.length === actualKey.length &&
    timingSafeEqual(expectedKey, actualKey)
  )
}

export async function registerUser({
  email,
  name,
  password,
}: {
  email: string
  name: string
  password: string
}) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !name.trim() || password.length < minimumPasswordLength) {
    return null
  }

  const database = await getDatabase()
  const userRepository = database.getRepository(AppUserEntity)
  const existingUser = await userRepository.findOne({
    where: { email: normalizedEmail },
  })

  if (existingUser) return null

  const user = userRepository.create({
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    emailVerified: null,
    image: null,
    passwordHash: await hashPassword(password),
    roleId: null,
    contactNumber: null,
    isActive: true,
    lastLoginAt: null,
  })
  const savedUser = await userRepository.save(user)

  return {
    id: savedUser.id,
    name: savedUser.name,
    email: normalizedEmail,
    image: savedUser.image,
  } satisfies AuthUser
}

export async function authenticateUser(email: string, password: string) {
  const database = await getDatabase()
  const userRepository = database.getRepository(AppUserEntity)
  const user = await userRepository.findOne({
    where: { email: normalizeEmail(email) },
  })

  if (!user?.email) return null

  if (!user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  } satisfies AuthUser
}

export const passwordRules = {
  minimumLength: minimumPasswordLength,
}
