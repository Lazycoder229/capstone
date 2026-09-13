import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import NextAuth from "next-auth"
import type { Session } from "next-auth"

import authConfig from "@/auth.config"

type AuthenticatedRequest = NextRequest & { auth: Session | null }

const requests = new Map<string, { count: number; resetAt: number }>()

const windowMs = 60_000
const maxRequests = 120
const allowedMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
const allowedHeaders = "Content-Type, Authorization, X-CSRF-Token"

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true

  const configuredOrigins = process.env.CORS_ORIGINS?.split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  if (!configuredOrigins?.length) {
    return origin === process.env.NEXT_PUBLIC_APP_URL
  }

  return configuredOrigins.includes(origin)
}

function applySecurityHeaders(response: NextResponse, isApiRoute: boolean) {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  )
  response.headers.set(
    "Content-Security-Policy",
    process.env.NODE_ENV === "production"
      ? "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'"
      : "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; base-uri 'self'; frame-ancestors 'none'; object-src 'none'",
  )

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    )
  }

  if (isApiRoute) {
    response.headers.set("Cache-Control", "no-store")
  }
}

function applyCorsHeaders(response: NextResponse, origin: string | null) {
  if (!origin || !isAllowedOrigin(origin)) return

  response.headers.set("Access-Control-Allow-Origin", origin)
  response.headers.set("Access-Control-Allow-Methods", allowedMethods)
  response.headers.set("Access-Control-Allow-Headers", allowedHeaders)
  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.set("Access-Control-Max-Age", "600")
  response.headers.append("Vary", "Origin")
}

function isRateLimited(request: NextRequest) {
  const now = Date.now()
  const key = getClientKey(request)
  const current = requests.get(key)

  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  current.count += 1
  return current.count > maxRequests
}

function securityProxy(request: AuthenticatedRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith("/api/")
  const origin = request.headers.get("origin")
  const response =
    request.method === "OPTIONS" && isApiRoute
      ? new NextResponse(null, { status: 204 })
      : NextResponse.next()

  if (isApiRoute) {
    if (!isAllowedOrigin(origin)) {
      return new NextResponse("Forbidden origin", { status: 403 })
    }

    if (isRateLimited(request)) {
      const limitedResponse = new NextResponse("Too many requests", {
        status: 429,
      })
      limitedResponse.headers.set("Retry-After", "60")
      applySecurityHeaders(limitedResponse, true)
      applyCorsHeaders(limitedResponse, origin)
      return limitedResponse
    }

    applyCorsHeaders(response, origin)
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/private/")) {
    if (!request.auth) {
      if (isApiRoute) {
        const unauthorizedResponse = NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        )
        applySecurityHeaders(unauthorizedResponse, true)
        applyCorsHeaders(unauthorizedResponse, origin)
        return unauthorizedResponse
      }

      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  applySecurityHeaders(response, isApiRoute)
  return response
}

const { auth } = NextAuth(authConfig)

export const proxy = auth(securityProxy)

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}