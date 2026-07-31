import { Skeleton } from '@/components/ui/skeleton'

const MATCHUP_CARD_COUNT = 3
const STANDINGS_ROW_COUNT = 6
const POWER_ROW_COUNT = 6

/**
 * Route-segment loading skeleton for the spectator surface — what a leaguemate
 * sees on a phone while the token resolves and the league's data loads.
 * Mirrors SpectatorShell's real layout (identity header, then matchups →
 * standings → power rankings, single column, same max-width and spacing) so
 * the swap to live content doesn't reflow under their thumb.
 *
 * Row counts are deliberately smaller than the admin skeleton's: this is a
 * phone-first single column, and an over-long skeleton reads as more content
 * than actually arrives. Pure CSS pulse (Animation Governance), `--muted`
 * skeleton surface per DESIGN_SYSTEM.md. No admin markup, no controls, no auth
 * affordance — the same rules that bind the real page bind its skeleton.
 */
export default function SpectatorLoading() {
  return (
    <div
      aria-busy="true"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-3 py-4"
    >
      <span className="sr-only">Loading league view…</span>
      <header className="flex flex-col gap-1">
        <Skeleton className="h-6 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        {Array.from({ length: MATCHUP_CARD_COUNT }, (_, card) => (
          <div key={card} className="rounded-xl bg-card p-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        ))}
      </section>

      {[STANDINGS_ROW_COUNT, POWER_ROW_COUNT].map((rowCount, section) => (
        <section key={section} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <div className="rounded-xl bg-card">
            {Array.from({ length: rowCount }, (_, row) => (
              <div
                key={row}
                className="flex items-center gap-3 border-b border-border/50 px-3 py-2.5"
              >
                <Skeleton className="h-4 w-5" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="ml-auto h-4 w-16" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
