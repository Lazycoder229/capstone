import { CustomerWorkspaceShell } from "@/components/customer-workspace-shell"
import { requireCustomerSession } from "@/lib/customer-auth/session"

export default async function AuthenticatedCustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const customer = await requireCustomerSession()

  return (
    <CustomerWorkspaceShell customerName={customer.name} email={customer.email}>
      {children}
    </CustomerWorkspaceShell>
  )
}
