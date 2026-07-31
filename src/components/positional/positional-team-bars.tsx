import ChartEmpty from '@/components/charts/chart-empty'
import { formatDelta, formatPoints } from '@/components/charts/format'
import { divergingBar, maxMagnitude } from '@/components/charts/scales'
import { positionVar, tokenColor } from '@/components/charts/series'
import { teamLabel } from '@/components/score-trends/team-label'
import { cn } from '@/lib/utils'
import type {
  PositionalBreakdownData,
  PositionalBucket,
  PositionalTeam,
  TeamBucketTotal,
} from '@/services/positional'

import { bucketLabel, positionalWeekNote } from './positional-notes'

interface PositionalTeamBarsProps {
  data: PositionalBreakdownData
  team: PositionalTeam
}

/**
 * One team against the league, position by position (Wave 5 — Positional
 * breakdowns, item 2).
 *
 * HORIZONTAL BARS, ANCHORED ON THE LEAGUE AVERAGE — the item's explicit shape,
 * and radar is explicitly rejected for this view by both the item and the
 * wave's standing anti-pattern note. The rejection is not stylistic: a radar's
 * area distorts with axis ORDER, so the same team reads stronger or weaker
 * depending on which position is drawn first, which is exactly the comparison
 * this view exists to make honestly.
 *
 * The zero line is the LEAGUE AVERAGE for that position, not zero points — a
 * bar right of centre means this team out-scores the league there. That is what
 * makes a QB bar and a K bar comparable at all: raw totals differ by an order
 * of magnitude between positions, so plotting raw points would say nothing
 * except "kickers score less than quarterbacks".
 *
 * ONE SHARED SCALE ACROSS THE WHOLE LEAGUE, not per team: the scale is the
 * largest deviation any team has at any position, so switching the selected
 * team never rescales the chart underneath the reader. Sizing per team would
 * make every team look equally extreme.
 *
 * COLOUR IS POSITION IDENTITY (the `--pos-*` tokens the badge language already
 * uses), not polarity: this chart's categorical dimension IS position, and a
 * QB bar matching its QB badge is the association a reader already has.
 * Polarity is carried by the bar's side of the centre line and by the signed,
 * colour-coded delta at the endpoint — encoded twice, so it never depends on
 * colour alone.
 *
 * Rank and percentile sit at the bar endpoint, which the item requires: a bar
 * says how far from average, the label says how far up the league.
 */
export default function PositionalTeamBars({
  data,
  team,
}: PositionalTeamBarsProps) {
  // Unmapped is excluded here on purpose: it has no league-average meaning and
  // no rank (the service leaves it out of positional ranks), so plotting it
  // against the same centre line would invent a comparison. It stays visible in
  // the detail table and in its own disclosure.
  const buckets = data.buckets.filter((bucket) => bucket.kind !== 'unmapped')

  if (buckets.length === 0 || data.weeksCounted === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">{teamLabel(team)} vs. league</h3>
        <ChartEmpty message="No weeks have been scored in this league yet — there is no league average to compare against." />
      </section>
    )
  }

  // The scale spans every team's deviation, at every position.
  const scale = maxMagnitude(
    data.teams.flatMap((entry) =>
      entry.buckets
        .filter((slot) => buckets.some((bucket) => bucket.key === slot.key))
        .map((slot) => slot.deltaVsAverage)
    )
  )

  return (
    <section className="flex flex-col gap-3 tabular-nums">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold">{teamLabel(team)} vs. league</h3>
        <p className="text-xs text-muted-foreground">
          {positionalWeekNote(data)}
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-card">
        {buckets.map((bucket) => {
          const slot = team.buckets.find((entry) => entry.key === bucket.key)
          if (slot === undefined) return null
          return (
            <PositionalBarRow
              key={bucket.key}
              bucket={bucket}
              slot={slot}
              scale={scale}
              teamCount={data.teams.length}
            />
          )
        })}
      </ul>

      <p className="text-xs text-muted-foreground">
        Each bar is this team&apos;s started points at that slot against the
        league average for the same slot. Right of centre: above average.
      </p>
    </section>
  )
}

/** One position's row: label, the average-anchored bar, and rank at the endpoint. */
function PositionalBarRow({
  bucket,
  slot,
  scale,
  teamCount,
}: {
  bucket: PositionalBucket
  slot: TeamBucketTotal
  scale: number
  teamCount: number
}) {
  const arm = divergingBar(slot.deltaVsAverage, scale)
  const rankLabel = `${slot.rank} of ${teamCount}`

  return (
    <li className="grid grid-cols-[minmax(0,4.5rem)_minmax(0,1fr)_5rem] items-center gap-3 px-3 py-2.5 text-sm sm:grid-cols-[minmax(0,6rem)_minmax(0,1fr)_6rem_5rem]">
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{bucketLabel(bucket)}</span>
        <span className="truncate text-xs text-muted-foreground">
          {slot.starts} {slot.starts === 1 ? 'start' : 'starts'}
        </span>
      </span>

      <span className="relative block h-4">
        <span className="sr-only">
          {bucketLabel(bucket)}: {formatPoints(slot.points)} points,{' '}
          {formatDelta(slot.deltaVsAverage)} versus a league average of{' '}
          {formatPoints(bucket.leagueAverage)}, ranked {rankLabel}
        </span>
        <span
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-chart-grid"
        />
        {arm.side === 'zero' ? (
          <span
            aria-hidden
            className="absolute inset-y-1 left-1/2 w-1 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: tokenColor(positionVar(bucket.key)) }}
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-y-0.5 rounded-sm"
            style={{
              [arm.side === 'positive' ? 'left' : 'right']: '50%',
              width: `${Math.max(arm.sizePct / 2, 0.5)}%`,
              backgroundColor: tokenColor(positionVar(bucket.key)),
            }}
          />
        )}
      </span>

      {/* Points and rank both matter, but the narrow admin viewport can only
          carry one column — rank survives, since the bar already encodes the
          magnitude and the detail table carries every raw total. */}
      <span className="hidden text-xs text-muted-foreground sm:block">
        {formatPoints(slot.points)} pts
      </span>

      <span className="flex flex-col items-end">
        <span
          className={cn(
            'font-semibold',
            arm.side === 'positive' && 'text-positive',
            arm.side === 'negative' && 'text-destructive',
            arm.side === 'zero' && 'text-muted-foreground'
          )}
        >
          {formatDelta(slot.deltaVsAverage)}
        </span>
        <span className="text-xs text-muted-foreground">{rankLabel}</span>
      </span>
    </li>
  )
}
