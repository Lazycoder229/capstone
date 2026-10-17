import { Suspense } from "react"
import { CustomerWorkspaceShell } from "@/components/customer-workspace-shell"
import { PrimeLoadingScreen } from "@/components/prime-loading-screen"
import { requireCustomerSession } from "@/lib/customer-auth/session"

export default function AuthenticatedCustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense
      fallback={
        <PrimeLoadingScreen appKey="customer" title="Loading your account" />
      }
    >
      <AuthorizedCustomerWorkspace>{children}</AuthorizedCustomerWorkspace>
    </Suspense>
  )
}

async function AuthorizedCustomerWorkspace({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const customer = await requireCustomerSession()

  return (
    <CustomerWorkspaceShell customerName={customer.name} email={customer.email}>
      {children}
    </CustomerWorkspaceShell>
  )
}
