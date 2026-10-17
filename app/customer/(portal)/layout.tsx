import { getCustomerSession } from "@/lib/customer-auth/session"
import { CustomerSidebar } from "@/components/customer-sidebar"
import { PrimePosChatbot } from "@/components/prime-pos-chatbot"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default async function CustomerPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const customer = await getCustomerSession()
  // Scanned table QR codes open the menu without requiring an account first.
  // Other portal pages enforce authentication in their own server components.
  if (!customer) {
    return (
      <>
        <div className="min-h-svh bg-muted/20">
          <div className="mx-auto max-w-7xl px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:p-6">
            {children}
          </div>
        </div>
        <PrimePosChatbot role="customer" />
      </>
    )
  }
  return (
    <>
      <SidebarProvider>
        <CustomerSidebar customerName={customer.name} email={customer.email} />
        <SidebarInset className="max-w-full min-w-0 flex-1 overflow-x-clip">
          <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b bg-background/95 px-3.5 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)] backdrop-blur-sm sm:px-4 sm:py-3 print:hidden">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
          </header>
          <div className="w-full max-w-full min-w-0 flex-1 p-2 sm:p-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <PrimePosChatbot role="customer" />
    </>
  )
}
