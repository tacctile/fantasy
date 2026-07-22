import { Skeleton } from '@/components/ui/skeleton'

// Mirrors PlayerRow's six cells (name, pos badge, team, ADP, pos rank,
// status) at the real px-3 py-2 density; widths vary per column so the
// shimmer reads as the actual table, not a generic block.
const ROW_CELLS = [
  { cell: 'flex-1', bar: 'h-4 w-36' },
  { cell: 'w-16 shrink-0', bar: 'h-5 w-10 rounded-full' },
  { cell: 'w-16 shrink-0', bar: 'h-4 w-9' },
  { cell: 'w-16 shrink-0', bar: 'ml-auto h-4 w-8' },
  { cell: 'w-20 shrink-0', bar: 'ml-auto h-4 w-10' },
  { cell: 'w-28 shrink-0', bar: 'h-4 w-20' },
] as const

const SKELETON_ROW_COUNT = 12
const SIDEBAR_CARD_COUNT = 5

/**
 * Route-segment loading skeleton for the draft board. Mirrors the shell's
 * real layout density — header strip, filter toolbar, six-column player
 * table, and the lg-up roster sidebar — so the swap to live content doesn't
 * reflow. Pure CSS pulse (Animation Governance: no rAF for simple state),
 * `--muted` skeleton surface per DESIGN_SYSTEM.md.
 */
export default function DraftBoardLoading() {
  return (
    <div
      aria-busy="true"
      className="flex min-h-0 flex-1 flex-col bg-background text-foreground"
    >
      <span className="sr-only">Loading draft board…</span>
      {/* Header: league name + platform badge + season left; selector/ADP/sign-out right */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <section aria-label="Player board" className="min-w-0 flex-1 p-4">
          {/* Toolbar: search, six position chips, availability toggle, match count */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-3">
            <Skeleton className="h-8 w-56" />
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-11 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="ml-auto h-4 w-28" />
          </div>
          {/* Table: sticky-header band + player rows at live cell density */}
          <div className="overflow-hidden rounded-xl bg-card">
            <div className="flex items-center border-b px-0 py-0">
              {ROW_CELLS.map((column, i) => (
                <div key={i} className={`px-3 py-2 ${column.cell}`}>
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
            {Array.from({ length: SKELETON_ROW_COUNT }, (_, row) => (
              <div
                key={row}
                className="flex items-center border-b border-border/50"
              >
                {ROW_CELLS.map((column, i) => (
                  <div key={i} className={`px-3 py-2 ${column.cell}`}>
                    <Skeleton className={column.bar} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
        {/* Roster sidebar (lg-up, mirrors RosterPanel's team cards) */}
        <aside
          aria-label="Roster panel"
          className="hidden w-80 shrink-0 border-l p-4 lg:block"
        >
          <div className="flex items-baseline justify-between pb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: SIDEBAR_CARD_COUNT }, (_, i) => (
              <div key={i} className="rounded-xl bg-card p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="mt-2 h-3 w-56" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
