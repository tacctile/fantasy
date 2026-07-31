import { formatActualVsExpected, formatDelta } from '@/components/charts/format'
import { cn } from '@/lib/utils'
import type { LuckData } from '@/services/luck'

interface SpectatorLuckSummaryProps {
  data: LuckData
}

/**
 * Spectator luck summary (Wave 5 — Lucky/unlucky tracker, item 7).
 *
 * A SEPARATELY BUILT mobile component, not the admin view shrunk: it reuses no
 * admin chart, no admin list, and no admin component of any kind. It imports
 * only the shared chart FORMATTERS (`components/charts/format`, the layer the
 * shared-foundations fold established as legitimately shared by both surfaces)
 * and the luck service's types. That keeps the Access Model's separate-rendering-
 * path rule intact by construction rather than by discipline — and keeps the
 * spectator import-graph guard in `spectator-markup.test.ts` true when the
 * Integration sub-section wires this in.
 *
 * WHAT IT SHOWS, per the item: one season luck delta and one short label per
 * team, framed in actual-vs-expected-record terms. No diverging bar chart, no
 * per-week breakdown, no drill-down — those stay on the admin surface. A phone
 * on a Sunday afternoon gets "who's been lucky and by how much", nothing denser.
 *
 * Zero client JavaScript, like every other spectator component: no hover
 * affordance exists on a phone, so every value is directly labelled rather than
 * hidden behind a tooltip.
 *
 * NOT wired into `/share/[share_token]` by this fold — the Integration
 * sub-section owns that wiring, along with the share-token-scoped query that
 * feeds it. This is the component only.
 */
export default function SpectatorLuckSummary({
  data,
}: SpectatorLuckSummaryProps) {
  const rated = data.teams.filter((team) => team.weeksRated > 0)

  return (
    <div className="flex flex-col gap-2">
      {data.lowConfidence && (
        <p className="text-xs text-muted-foreground">
          Early-season reading — only {data.weeksCounted}{' '}
          {data.weeksCounted === 1 ? 'week' : 'weeks'} counted, so treat this
          loosely.
        </p>
      )}
      {data.nonFinalWeeksCounted > 0 && (
        <p className="text-xs text-muted-foreground">
          {data.nonFinalWeeksCounted} of {data.weeksCounted} counted weeks
          include unofficial scores.
        </p>
      )}

      {rated.length === 0 ? (
        <div className="rounded-xl bg-card px-3 py-8 text-center text-sm text-muted-foreground">
          No scored weeks yet — nothing to compare a record against.
        </div>
      ) : (
        <ol className="divide-y divide-border/50 rounded-xl bg-card tabular-nums">
          {rated.map((team) => (
            <li
              key={team.nativeRosterId}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {team.teamName ?? team.ownerDisplayName ?? '—'}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {formatActualVsExpected(
                    team.actualWins,
                    team.actualLosses,
                    team.expectedWins,
                    team.expectedLosses,
                    team.actualTies
                  )}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span
                  className={cn(
                    'block text-sm font-semibold',
                    luckTone(team.luck)
                  )}
                >
                  {formatDelta(team.luck)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {luckWord(team.luck)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="text-xs text-muted-foreground">
        Wins above or below what each team&apos;s weekly scoring earned against
        the whole league.
      </p>
    </div>
  )
}

/**
 * The short label, derived from SIGN ONLY.
 *
 * Deliberately not a magnitude band ("very lucky" past some cutoff): no wiki
 * page sets a threshold for what counts as a meaningfully lucky season —
 * declared silence, checked at decision time — and the luck page is explicit
 * that no specific constant proposed for these formulas should be treated as
 * settled. Inventing a cutoff here would present a made-up number as a finding.
 * The delta beside the word carries the magnitude, honestly and unbanded.
 */
function luckWord(luck: number): string {
  if (luck > 0) return 'lucky'
  if (luck < 0) return 'unlucky'
  return 'even'
}

function luckTone(luck: number): string {
  if (luck > 0) return 'text-positive'
  if (luck < 0) return 'text-destructive'
  return 'text-muted-foreground'
}
