import { PrimeLoadingScreen } from "@/components/prime-loading-screen"

export default function CustomerLoading() {
  return (
    <PrimeLoadingScreen
      appKey="customer"
      title="Loading your dashboard"
      description="Preparing your orders and rewards…"
    />
  )
}
