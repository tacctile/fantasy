import { Skeleton } from '@/components/ui/skeleton'

const MATCHUP_CARD_COUNT = 4
const STANDINGS_ROW_COUNT = 10
const POWER_ROW_COUNT = 10

/**
 * Route-segment loading skeleton for the league dashboard. Mirrors the
 * shell's real layout — header strip, week-selector row, two-column matchup
 * cards, then standings and power rankings side-by-side — so the swap to
 * live content doesn't reflow. Pure CSS pulse (Animation Governance: no rAF
 * for simple state), `--muted` skeleton surface per DESIGN_SYSTEM.md.
 */
export default function LeagueDashboardLoading() {
  return (
    <div
      aria-busy="true"
      className="flex min-h-0 flex-1 flex-col bg-background text-foreground"
    >
      <span className="sr-only">Loading league dashboard…</span>
      {/* Header: league name + platform badge + season left; actions right */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-4">
        {/* Matchups: week heading + selector pills, then mirrored cards */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Skeleton className="h-4 w-20" />
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-7 w-9 rounded-full" />
              ))}
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: MATCHUP_CARD_COUNT }, (_, i) => (
              <div key={i} className="rounded-xl bg-card p-4">
                <div className="grid grid-cols-2 items-start gap-x-4">
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1 h-7 w-20" />
                  </div>
                  <div className="flex flex-col items-end">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1 h-7 w-20" />
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
                  {Array.from({ length: 5 }, (_, row) => (
                    <div key={row} className="grid grid-cols-2 gap-x-4">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="ml-auto h-4 w-40" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Standings + power rankings side-by-side (lg-up) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[STANDINGS_ROW_COUNT, POWER_ROW_COUNT].map((rowCount, section) => (
            <div key={section} className="flex flex-col gap-3">
              <Skeleton className="h-4 w-28" />
              <div className="rounded-xl bg-card">
                {Array.from({ length: rowCount }, (_, row) => (
                  <div
                    key={row}
                    className="flex items-center gap-3 border-b border-border/50 px-3 py-2"
                  >
                    <Skeleton className="h-4 w-6" />
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="ml-auto h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
