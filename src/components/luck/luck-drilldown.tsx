import CategoryAxis from '@/components/charts/category-axis'
import ChartEmpty from '@/components/charts/chart-empty'
import ChartFrame from '@/components/charts/chart-frame'
import ChartMark from '@/components/charts/chart-mark'
import {
  formatActualVsExpected,
  formatDelta,
  formatPoints,
  formatWeek,
} from '@/components/charts/format'
import {
  divergingBar,
  extent,
  maxMagnitude,
  niceDomain,
  polylinePoints,
  positionOf,
} from '@/components/charts/scales'
import { divergingVar, tokenColor } from '@/components/charts/series'
import ValueAxis from '@/components/charts/value-axis'
import { teamLabel } from '@/components/score-trends/team-label'
import { cn } from '@/lib/utils'
import type { LuckData, TeamLuck, TeamLuckWeek } from '@/services/luck'

import { luckWeekNote } from './luck-notes'

interface LuckDrilldownProps {
  data: LuckData
  team: TeamLuck
}

/**
 * One team's luck, week by week (Wave 5 — Lucky/unlucky tracker, item 6).
 *
 * A SEPARATE VIEW from the ranked chart, as the item requires — it replaces the
 * league ranking rather than sitting beside it, because the two answer different
 * questions and stacking them invites reading a per-team bar as a league one.
 *
 * Two charts, deliberately (2026-07-31). The per-week diverging bars answer
 * "which weeks did this to me" — each bar is that week's actual result minus
 * that week's all-play share, so winning while scoring 3rd of 10 shows as a
 * visible positive and losing while scoring 2nd shows as a visible negative.
 * The cumulative line answers "where did the season end up", which the bars
 * alone force the reader to sum mentally. Neither chart re-derives anything:
 * both read values `services/luck.ts` already computed.
 */
export default function LuckDrilldown({ data, team }: LuckDrilldownProps) {
  const rated = team.weeks.filter((week) => week.expectedWinShare !== null)

  if (rated.length === 0) {
    return (
      <ChartFrame title={`Weekly luck — ${teamLabel(team)}`}>
        <ChartEmpty message="This team has no rated weeks yet — no scores to compare against the league." />
      </ChartFrame>
    )
  }

  const weekLabels = data.weeks.map(formatWeek)
  const interval = data.weeks.length > 12 ? 2 : 1
  const record = formatActualVsExpected(
    team.actualWins,
    team.actualLosses,
    team.expectedWins,
    team.expectedLosses,
    team.actualTies
  )

  return (
    <div className="flex flex-col gap-8">
      <WeeklyLuckBars
        data={data}
        team={team}
        weekLabels={weekLabels}
        interval={interval}
        record={record}
      />
      <CumulativeLuckLine
        data={data}
        team={team}
        weekLabels={weekLabels}
        interval={interval}
      />
    </div>
  )
}

/**
 * Per-week luck contribution: a diverging bar per week about a zero baseline.
 *
 * Bars, not a line — a week's luck is a discrete event, and a line between
 * weeks would imply a continuity that doesn't exist (the same reasoning the
 * weekly-points chart records for using bars).
 */
function WeeklyLuckBars({
  data,
  team,
  weekLabels,
  interval,
  record,
}: {
  data: LuckData
  team: TeamLuck
  weekLabels: string[]
  interval: number
  record: string
}) {
  const contributions = team.weeks.map(weeklyLuck)
  const scale = maxMagnitude(
    contributions.filter((value): value is number => value !== null)
  )

  return (
    <ChartFrame
      title={`Weekly luck — ${teamLabel(team)}`}
      subtitle={`${record} · ${luckWeekNote(data)}`}
      height="md"
      caption={<CategoryAxis labels={weekLabels} interval={interval} />}
    >
      {/* The zero baseline sits at the vertical centre, so a bar's side is
          readable before any label: above = won more than the scoring earned. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-chart-grid"
      />
      <div className="absolute inset-0 flex items-stretch gap-px">
        {team.weeks.map((week, index) => {
          const value = contributions[index]
          if (value === null) {
            return (
              <div key={week.week} className="min-w-0 flex-1" aria-hidden />
            )
          }
          const arm = divergingBar(value, scale)
          return (
            <ChartMark
              key={week.week}
              className="min-w-0 flex-1"
              label={weeklyLuckLabel(team, week, value)}
              tooltip={
                <span>
                  {formatWeek(week.week)} · {formatDelta(value)} ·{' '}
                  {resultWord(week)}
                </span>
              }
            >
              <div
                className={cn(
                  'absolute inset-x-0 rounded-sm',
                  !week.isFinal && 'opacity-60'
                )}
                style={{
                  // Each arm occupies at most half the plot, measured out from
                  // the centre line — one shared scale for both directions.
                  [arm.side === 'negative' ? 'top' : 'bottom']: '50%',
                  height: `${Math.max(arm.sizePct / 2, 0.5)}%`,
                  backgroundColor: tokenColor(divergingVar(arm.side)),
                }}
              />
            </ChartMark>
          )
        })}
      </div>
    </ChartFrame>
  )
}

/**
 * Season luck accumulation as a line — the one place in this section a line is
 * correct, because a running total IS continuous between its points (the same
 * distinction the cumulative score-trend chart records).
 *
 * The zero reference line is the context: staying above it all season is a
 * different story from crossing it in week 9, and a bare line without the
 * baseline loses that entirely.
 */
function CumulativeLuckLine({
  data,
  team,
  weekLabels,
  interval,
}: {
  data: LuckData
  team: TeamLuck
  weekLabels: string[]
  interval: number
}) {
  const series = team.weeks.map((week) => week.cumulativeLuck)
  const domain = niceDomain(extent([...series, 0]) ?? { min: -1, max: 1 }, {
    includeZero: true,
  })
  const segments = polylinePoints(series, domain)
  const zeroPct = positionOf(0, domain)
  const final = series.length === 0 ? 0 : series[series.length - 1]

  return (
    <ChartFrame
      title="Cumulative luck"
      subtitle={`Running wins above or below expectation · ends at ${formatDelta(
        final
      )}`}
      height="md"
      caption={<CategoryAxis labels={weekLabels} interval={interval} />}
    >
      <ValueAxis domain={domain} format={(value) => formatPoints(value, 1)} />
      <div
        aria-hidden
        className="absolute inset-x-0 h-px bg-chart-neutral"
        style={{ bottom: `${zeroPct}%` }}
      />
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {segments.map((points, index) => (
          <polyline
            key={index}
            points={points}
            fill="none"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            stroke={tokenColor(
              divergingVar(final > 0 ? 'positive' : final < 0 ? 'negative' : 'zero')
            )}
          />
        ))}
      </svg>
      <span className="sr-only">
        {teamLabel(team)} cumulative luck over {data.weeksCounted} counted
        weeks, ending at {formatDelta(final)} wins versus expectation.
      </span>
    </ChartFrame>
  )
}

/**
 * A week's own luck contribution: what the result gave, minus what the scoring
 * earned across the league that week. Null for a week that couldn't be rated —
 * never a zero, which would read as "dead even" rather than "no data".
 */
function weeklyLuck(week: TeamLuckWeek): number | null {
  if (week.expectedWinShare === null) return null
  return Math.round((week.actualWinShare - week.expectedWinShare) * 1000) / 1000
}

/** Plain-language result for a week, including the honest no-opponent case. */
function resultWord(week: TeamLuckWeek): string {
  switch (week.result) {
    case 'win':
      return 'won'
    case 'loss':
      return 'lost'
    case 'tie':
      return 'tied'
    case 'no_game':
      return 'no opponent'
  }
}

/** The screen-reader line for one week's bar — the tooltip is presentational. */
function weeklyLuckLabel(
  team: TeamLuck,
  week: TeamLuckWeek,
  value: number
): string {
  const scored =
    week.points === null ? 'no score' : `scored ${formatPoints(week.points)}`
  const against =
    week.opponentPoints === null
      ? ''
      : ` against ${formatPoints(week.opponentPoints)}`
  return `${teamLabel(team)}, ${formatWeek(week.week)}: ${scored}${against}, ${resultWord(
    week
  )} — ${formatDelta(value)} versus expectation${week.isFinal ? '' : ' (unofficial)'}`
}
