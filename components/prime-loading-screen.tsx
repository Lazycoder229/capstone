type LoadingScreenProps = {
  title?: string
  description?: string
}

export function PrimeLoadingScreen({
  title = "Loading your workspace",
  description = "Getting everything ready…",
}: LoadingScreenProps) {
  return (
    <main
      className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border bg-card px-7 py-8 text-center shadow-sm">
        <img
          src="/pardslogo.jpg"
          alt="Pards"
          className="mb-6 size-20 rounded-full object-cover"
        />
        <div
          aria-hidden="true"
          className="mb-4 size-7 animate-spin rounded-full border-[3px] border-muted border-t-orange-500 motion-reduce:animate-none"
        />
        <p className="font-semibold tracking-tight">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </main>
  )
}
