import { Skeleton } from '@/components/ui/skeleton'

const LIST_ROWS = 6

/**
 * Route-segment loading skeleton for the Luck Tracker. Mirrors the real
 * section's layout — identity header, the disclosure block, then the ranked
 * row list — so the swap to live content doesn't reflow.
 *
 * No `ChartSkeleton` here, unlike Score Trends: this section's primary view is
 * a ranked list of rows rather than a plotted chart area, and a bar-chart
 * placeholder would promise a shape that never arrives. Fewer rows than a full
 * league, for the same reason.
 */
export default function LuckLoading() {
  return (
    <div
      aria-busy="true"
      className="flex min-h-0 flex-1 flex-col bg-background text-foreground"
    >
      <span className="sr-only">Loading luck tracker…</span>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-4 w-24" />
      </header>
      <div className="flex flex-1 flex-col gap-8 p-4">
        <div className="flex flex-col gap-2 rounded-xl bg-card px-3 py-2.5">
          <Skeleton className="h-3 w-72" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-48" />
          <div className="flex flex-col gap-2 rounded-xl bg-card p-3">
            {Array.from({ length: LIST_ROWS }, (_, row) => (
              <div key={row} className="flex items-center gap-3">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="ml-auto h-4 w-32" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
