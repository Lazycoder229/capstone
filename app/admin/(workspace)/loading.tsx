import { PrimeLoadingScreen } from "@/components/prime-loading-screen"

export default function AdminLoading() {
  return (
    <PrimeLoadingScreen
      appKey="admin"
      title="Loading your admin dashboard"
      description="Preparing live restaurant data…"
    />
  )
}
