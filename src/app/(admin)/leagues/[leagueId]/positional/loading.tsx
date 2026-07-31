import { Skeleton } from '@/components/ui/skeleton'

const GRID_ROWS = 6
const GRID_COLUMNS = 7

/**
 * Route-segment loading skeleton for the Positional Breakdowns section. Mirrors
 * the real section's layout — identity header, the disclosure block, then the
 * teams × slots grid — so the swap to live content doesn't reflow.
 *
 * A grid placeholder rather than a plot area, for the same reason the Luck
 * Tracker uses a row list: this section's landing view is a table, and a
 * bar-chart skeleton would promise a shape that never arrives. The single-team
 * bars aren't skeletoned at all, since they only exist once a team is selected.
 */
export default function PositionalLoading() {
  return (
    <div
      aria-busy="true"
      className="flex min-h-0 flex-1 flex-col bg-background text-foreground"
    >
      <span className="sr-only">Loading positional breakdown…</span>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-4 w-36" />
      </header>
      <div className="flex flex-1 flex-col gap-8 p-4">
        <div className="flex flex-col gap-2 rounded-xl bg-card px-3 py-2.5">
          <Skeleton className="h-3 w-72" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
          <div className="flex flex-col gap-2 rounded-xl bg-card p-3">
            {Array.from({ length: GRID_ROWS }, (_, row) => (
              <div key={row} className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                {Array.from({ length: GRID_COLUMNS }, (_, column) => (
                  <Skeleton key={column} className="h-4 w-8" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
