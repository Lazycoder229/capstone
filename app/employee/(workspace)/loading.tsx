import { PrimeLoadingScreen } from "@/components/prime-loading-screen"

export default function EmployeeLoading() {
  return (
    <PrimeLoadingScreen
      appKey="employee"
      title="Loading your employee dashboard"
      description="Preparing your attendance and payslips…"
    />
  )
}
