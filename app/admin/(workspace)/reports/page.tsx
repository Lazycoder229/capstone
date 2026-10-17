import { getSalesReportData } from "@/lib/sales/report-data"
import { SalesReportsWorkspace } from "./workspace"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ start?: string; end?: string }>
}) {
  // searchParams is request-time data. Keep it outside the data error boundary
  // so Next can handle its static-generation bailout instead of logging it as
  // a report/database failure during the build.
  const params = searchParams ? await searchParams : {}
  try {
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
