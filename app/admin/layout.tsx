// app/admin/layout.tsx
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeaderTitle } from "@/components/admin-header-title";
import { Separator } from "@/components/ui/separator";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="min-w-0 max-w-full overflow-x-hidden flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/95 backdrop-blur-sm px-3.5 py-2.5 sm:px-4 sm:py-3 shrink-0">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <AdminHeaderTitle />
        </header>
        <div className="p-3 sm:p-6 w-full min-w-0 max-w-full flex-1">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
