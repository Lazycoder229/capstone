import { getSalesReportData } from "@/lib/sales/report-data"
import { SalesReportsWorkspace } from "@/app/admin/(workspace)/reports/workspace"

export default async function CashierReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ start?: string; end?: string }>
}) {
  try {
    const params = searchParams ? await searchParams : {}
    const data = await getSalesReportData(params)
    return <SalesReportsWorkspace data={data} basePath="/cashier" />
  } catch (error) {
    console.error("Unable to load cashier reports:", error)
    return (
      <main className="space-y-2">
        <h1 className="text-2xl font-semibold">Reports &amp; Analytics</h1>
        <p
          role="alert"
          className="rounded-lg border border-amber-500/40 p-4 text-sm"
        >
          Reports could not load. Check the database connection and migrations.
        </p>
      </main>
    )
  }
}
