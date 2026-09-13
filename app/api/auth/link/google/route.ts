import { NextResponse } from "next/server"

import { auth, signIn } from "@/auth"

export const runtime = "nodejs"

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return signIn("google", {
    redirectTo: "/",
  })
}
