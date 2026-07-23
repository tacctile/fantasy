import { Skeleton } from '@/components/ui/skeleton'

const SNAPSHOT_CARD_COUNT = 3
const SNAPSHOT_ROWS = 3

/**
 * Route-segment loading skeleton for the command-center home. Mirrors the real
 * layout — a slim league-identity header (the selector and sign-out live in
 * the persistent sidebar, not this page) and a responsive grid of snapshot
 * cards — so the swap to live content doesn't reflow. Pure CSS pulse
 * (Animation Governance: no rAF for simple state), `--muted` skeleton surface
 * per DESIGN_SYSTEM.md.
 */
export default function LeagueHomeLoading() {
  return (
    <div
      aria-busy="true"
      className="flex min-h-0 flex-1 flex-col bg-background text-foreground"
    >
      <span className="sr-only">Loading command center…</span>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-4 w-28" />
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: SNAPSHOT_CARD_COUNT }, (_, card) => (
            <div key={card} className="rounded-xl bg-card p-4">
              <Skeleton className="h-5 w-32" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: SNAPSHOT_ROWS }, (_, row) => (
                  <div key={row} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-5" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="ml-auto h-4 w-12" />
                  </div>
                ))}
              </div>
              <Skeleton className="mt-4 h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
