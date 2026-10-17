import { PrimeLoadingScreen } from "@/components/prime-loading-screen"

export default function CashierLoading() {
  return (
    <PrimeLoadingScreen
      appKey="cashier"
      title="Loading your cashier workspace"
      description="Preparing orders and sales…"
    />
  )
}
