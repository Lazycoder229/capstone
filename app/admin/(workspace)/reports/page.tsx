import { getSalesReportData } from "@/lib/sales/report-data"
import { SalesReportsWorkspace } from "./workspace"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ start?: string; end?: string }>
}) {
  try {
    const params = searchParams ? await searchParams : {}
    const data = await getSalesReportData(params, { includeForecast: true })
    return <SalesReportsWorkspace data={data} />
  } catch (error) {
    console.error("Unable to load sales reports:", error)
    return (
      <main className="space-y-2">
        <h1 className="text-2xl font-semibold">Sales & Reports</h1>
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
