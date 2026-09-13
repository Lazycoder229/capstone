import { NextResponse } from "next/server"

import { passwordRules, registerUser } from "@/lib/services/auth.service"

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as Record<string, unknown>).email !== "string" ||
    typeof (body as Record<string, unknown>).name !== "string" ||
    typeof (body as Record<string, unknown>).password !== "string"
  ) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 },
    )
  }

  const { email, name, password } = body as {
    email: string
    name: string
    password: string
  }

  if (password.length < passwordRules.minimumLength) {
    return NextResponse.json(
      {
        error: `Password must be at least ${passwordRules.minimumLength} characters`,
      },
      { status: 400 },
    )
  }

  const user = await registerUser({ email, name, password })
  if (!user) {
    return NextResponse.json(
      { error: "Unable to create account" },
      { status: 409 },
    )
  }

  return NextResponse.json({ user }, { status: 201 })
}
