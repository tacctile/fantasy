import Link from 'next/link'

import ChartEmpty from '@/components/charts/chart-empty'
import ChartFrame from '@/components/charts/chart-frame'
import {
  formatActualVsExpected,
  formatDelta,
} from '@/components/charts/format'
import { divergingBar, maxMagnitude } from '@/components/charts/scales'
import { divergingVar, tokenColor } from '@/components/charts/series'
import { teamLabel } from '@/components/score-trends/team-label'
import { cn } from '@/lib/utils'
import type { LuckData, TeamLuck } from '@/services/luck'

import { luckWeekNote } from './luck-notes'

interface LuckRankedChartProps {
  data: LuckData
  /** Base path for the drill-down links, e.g. /leagues/<id>/luck. */
  basePath: string
  selectedRosterId: number | null
}

/**
 * The league-wide luck ranking: a horizontal diverging bar per team, centred at
 * zero, luckiest at the top (Wave 5 — Lucky/unlucky tracker, item 5).
 *
 * EVERY BAR IS LABELLED IN RECORD TERMS ("7-2 actual / 5.4-3.6 expected"), which
 * the item requires and which is the whole reason this reads without a legend:
 * the bar shows the size and direction of the gap, the label says what the gap
 * IS. An abstract luck index — a number with no units a reader can check — is
 * explicitly rejected by the item, and by the wave's standing anti-pattern note
 * on opaque composite scores.
 *
 * Sorted signed (luckiest → unluckiest) rather than by absolute magnitude
 * (2026-07-31): the bars then form one continuous spectrum crossing the zero
 * line exactly once, so the centre line reads as a real boundary between
 * "luckier than it scored" and "unluckier". Sorting by |luck| would alternate
 * sides down the list and make the centre line meaningless.
 *
 * Both arms share ONE scale (`maxMagnitude` across the league), so a +2 and a
 * −2 render at identical lengths — sizing arms independently would silently
 * misrepresent the comparison the chart exists to make.
 *
 * Colour is the diverging scale, never the categorical one: polarity about zero
 * is what this chart encodes, not series identity. Rendered with zero client
 * JavaScript like every chart in this wave.
 */
export default function LuckRankedChart({
  data,
  basePath,
  selectedRosterId,
}: LuckRankedChartProps) {
  const rated = data.teams.filter((team) => team.weeksRated > 0)

  if (rated.length === 0) {
    return (
      <ChartFrame title="Luck ranking">
        <ChartEmpty message="No weeks have been scored in this league yet — nothing to compare a record against." />
      </ChartFrame>
    )
  }

  const scale = maxMagnitude(rated.map((team) => team.luck))

  return (
    <section className="flex flex-col gap-3 tabular-nums">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold">Luck ranking</h3>
        <p className="text-xs text-muted-foreground">{luckWeekNote(data)}</p>
      </div>

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-card">
        {rated.map((team) => (
          <LuckRow
            key={team.nativeRosterId}
            team={team}
            scale={scale}
            basePath={basePath}
            isSelected={team.nativeRosterId === selectedRosterId}
          />
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Bars measure wins above or below what this team&apos;s weekly scoring
        earned against the whole league. Right of centre: won more than it
        scored for. Left: scored better than its record shows.
      </p>
    </section>
  )
}

/**
 * One team's row: name, the diverging bar, and the actual-vs-expected record.
 *
 * The whole row is the drill-down link (item 6's entry point), URL-driven like
 * every other selection on this surface so the section stays server-rendered
 * and a drilled-in view is shareable rather than transient state.
 */
function LuckRow({
  team,
  scale,
  basePath,
  isSelected,
}: {
  team: TeamLuck
  scale: number
  basePath: string
  isSelected: boolean
}) {
  const arm = divergingBar(team.luck, scale)
  const record = formatActualVsExpected(
    team.actualWins,
    team.actualLosses,
    team.expectedWins,
    team.expectedLosses,
    team.actualTies
  )
  const href = isSelected ? basePath : `${basePath}?team=${team.nativeRosterId}`

  return (
    <li>
      <Link
        href={href}
        aria-current={isSelected ? 'true' : undefined}
        className={cn(
          'grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_4rem] items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted sm:grid-cols-[2rem_minmax(0,9rem)_minmax(0,1fr)_11rem_4rem]',
          isSelected && 'bg-muted'
        )}
      >
        <span className="hidden text-xs text-muted-foreground sm:block">
          {team.rank}
        </span>

        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{teamLabel(team)}</span>
          {/* The record framing is never dropped, only relocated: on a narrow
              admin viewport the dedicated column would truncate, so it moves
              under the name rather than leaving the bar unlabelled. */}
          <span className="truncate text-xs text-muted-foreground sm:hidden">
            {record}
          </span>
        </span>

        {/* The diverging track: two equal arms about a shared centre line. */}
        <span className="relative block h-4">
          <span className="sr-only">
            {teamLabel(team)}: {record}, {formatDelta(team.luck)} wins versus
            expectation
            {team.hasRatingGap
              ? `, with ${team.weeksRated - team.gamesPlayed} scored week(s) that had no opponent`
              : ''}
          </span>
          <span
            aria-hidden
            className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-chart-grid"
          />
          {arm.side === 'zero' ? (
            <span
              aria-hidden
              className="absolute inset-y-1 left-1/2 w-1 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: tokenColor(divergingVar('zero')) }}
            />
          ) : (
            <span
              aria-hidden
              className="absolute inset-y-0.5 rounded-sm"
              style={{
                // Each arm is measured out from the centre across half the
                // track, which is what makes the two sides comparable.
                [arm.side === 'positive' ? 'left' : 'right']: '50%',
                width: `${Math.max(arm.sizePct / 2, 0.5)}%`,
                backgroundColor: tokenColor(divergingVar(arm.side)),
              }}
            />
          )}
        </span>

        <span className="hidden text-xs text-muted-foreground sm:block">
          {record}
        </span>

        <span
          className={cn(
            'text-right font-semibold',
            arm.side === 'positive' && 'text-positive',
            arm.side === 'negative' && 'text-destructive',
            arm.side === 'zero' && 'text-muted-foreground'
          )}
        >
          {formatDelta(team.luck)}
        </span>
      </Link>
    </li>
  )
}
