"use client"

import { signIn } from "next-auth/react"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { apiClient, isAxiosError } from "@/lib/api-client"

type AuthMode = "login" | "register"

export default function Page() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    if (mode === "register") {
      try {
        await apiClient.post("/api/auth/register", { name, email, password })
      } catch (requestError) {
        const message = isAxiosError(requestError)
          ? requestError.response?.data?.error
          : null
        setError(message ?? "Unable to create your account.")
        setIsLoading(false)
        return
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    })

    if (result?.error) {
      setError("The email or password is incorrect.")
      setIsLoading(false)
      return
    }

    window.location.assign(result?.url ?? "/")
  }

  async function handleGoogleSignIn() {
    setError("")
    setIsLoading(true)
    await signIn("google", { callbackUrl: "/" })
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError("")
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#f2efe9] px-4 py-8 text-[#20221f] sm:px-8">
      <div className="pointer-events-none absolute -left-24 -top-28 size-72 rounded-full bg-[#cad8c0]/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-8rem] size-96 rounded-full bg-[#e7c9aa]/70 blur-3xl" />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-black/10 bg-[#fbfaf7]/90 shadow-[0_24px_80px_rgba(51,54,45,0.15)] backdrop-blur md:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden flex-col justify-between bg-[#27372f] p-10 text-[#f4f1e8] md:flex lg:p-14">
          <div>
            <div className="mb-16 flex items-center gap-3 text-sm font-semibold tracking-[0.2em] uppercase">
              <span className="grid size-9 place-items-center rounded-full bg-[#d9e2c9] text-[#27372f]">Q</span>
              Qrots
            </div>
            <p className="mb-5 max-w-xs text-sm tracking-[0.18em] text-[#d9e2c9] uppercase">
              A quieter place to begin
            </p>
            <h1 className="max-w-sm text-4xl leading-[1.08] font-medium tracking-[-0.03em] lg:text-5xl">
              Keep your work close, clear, and yours.
            </h1>
          </div>
          <p className="max-w-xs text-sm leading-6 text-[#c4cec0]">
            One account for your workspace, with secure sign-in whenever you return.
          </p>
        </div>

        <div className="p-6 sm:p-10 lg:p-14">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-[#687267] uppercase">
                Welcome back
              </p>
              <h2 className="text-3xl font-medium tracking-[-0.03em]">
                {mode === "login" ? "Sign in to Qrots" : "Create your account"}
              </h2>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-[#e1ead8] font-semibold text-[#35513d] md:hidden">
              Q
            </span>
          </div>

          <div className="mb-8 grid grid-cols-2 border-b border-black/10">
            {(["login", "register"] as AuthMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => switchMode(item)}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  mode === item
                    ? "border-[#35513d] text-[#27372f]"
                    : "border-transparent text-[#899088] hover:text-[#27372f]"
                }`}
              >
                {item === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <label className="block text-sm font-medium">
                Full name
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white/70 px-4 font-normal outline-none transition focus:border-[#54745a] focus:ring-3 focus:ring-[#b9cbb2]/50"
                />
              </label>
            )}

            <label className="block text-sm font-medium">
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white/70 px-4 font-normal outline-none transition focus:border-[#54745a] focus:ring-3 focus:ring-[#b9cbb2]/50"
              />
            </label>

            <label className="block text-sm font-medium">
              Password
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white/70 px-4 font-normal outline-none transition focus:border-[#54745a] focus:ring-3 focus:ring-[#b9cbb2]/50"
              />
            </label>

            {error && (
              <p className="rounded-xl border border-[#d9a9a0] bg-[#fff0ec] px-4 py-3 text-sm text-[#9b4436]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-xl bg-[#35513d] text-[#f7f5ed] hover:bg-[#27372f]"
            >
              {isLoading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-3 text-xs text-[#899088]">
            <span className="h-px flex-1 bg-black/10" />
            or continue with
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="h-11 w-full rounded-xl border-black/10 bg-white/60"
          >
            <span className="mr-2 grid size-5 place-items-center rounded-full bg-[#4285f4] text-xs font-bold text-white">
              G
            </span>
            Continue with Google
          </Button>

          <p className="mt-8 text-center text-xs leading-5 text-[#899088]">
            By continuing, you agree to keep your account secure and use Qrots responsibly.
          </p>
        </div>
      </section>
    </main>
  )
}
