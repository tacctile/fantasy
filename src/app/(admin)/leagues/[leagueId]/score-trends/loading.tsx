import ChartSkeleton from '@/components/charts/chart-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

const LIST_ROWS = 6

/**
 * Route-segment loading skeleton for Score Trends. Mirrors the real section's
 * layout — identity header, a tall chart, a second tall chart, then the season
 * list — so the swap to live content doesn't reflow. Chart placeholders come
 * from the shared `ChartSkeleton` primitive (fixed bar cycle, never random),
 * and the list shows fewer rows than a full league on purpose: a skeleton
 * denser than the data promises more than arrives.
 */
export default function ScoreTrendsLoading() {
  return (
    <div
      aria-busy="true"
      className="flex min-h-0 flex-1 flex-col bg-background text-foreground"
    >
      <span className="sr-only">Loading score trends…</span>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-4 w-24" />
      </header>
      <div className="flex flex-1 flex-col gap-8 p-4">
        {[0, 1].map((chart) => (
          <div key={chart} className="flex flex-col gap-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-56" />
            <ChartSkeleton bars={12} height="lg" />
          </div>
        ))}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-28" />
          <div className="flex flex-col gap-2 rounded-xl bg-card p-3">
            {Array.from({ length: LIST_ROWS }, (_, row) => (
              <div key={row} className="flex items-center gap-3">
                <Skeleton className="h-4 w-5" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="ml-auto h-6 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
