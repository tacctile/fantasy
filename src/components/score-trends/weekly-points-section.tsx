import CategoryAxis from '@/components/charts/category-axis'
import ChartEmpty from '@/components/charts/chart-empty'
import ChartFrame from '@/components/charts/chart-frame'
import ChartLegend from '@/components/charts/chart-legend'
import ChartMark from '@/components/charts/chart-mark'
import { formatPoints, formatWeek } from '@/components/charts/format'
import {
  extent,
  niceDomain,
  spanOf,
  type Domain,
} from '@/components/charts/scales'
import {
  needsSmallMultiples,
  seriesVar,
  tokenColor,
} from '@/components/charts/series'
import SmallMultiples, { type Facet } from '@/components/charts/small-multiples'
import ValueAxis from '@/components/charts/value-axis'
import { cn } from '@/lib/utils'
import type { ScoreTrendsData, TeamScoreTrend } from '@/services/score-trends'

import { teamLabel } from './team-label'
import WeeklyPointsBars from './weekly-points-bars'

interface WeeklyPointsSectionProps {
  data: ScoreTrendsData
  /** When set, the section shows this team alone at full size. */
  selected?: TeamScoreTrend | null
}

/**
 * Weekly points, as bars (Wave 5 — Score charts, items 2 and 4).
 *
 * Item 4's cap is enforced here rather than left to the caller: at or under
 * `MAX_SERIES` teams the weeks render as one grouped bar chart; past it the
 * section fans out to the shared small-multiples primitive, one facet per team
 * on ONE shared domain. There is no overplotted middle ground — a 10-team
 * league is the normal case for this project, and 10 series on one chart is the
 * spaghetti pattern the wave's standing anti-pattern note rejects outright.
 *
 * A drill-down selection collapses to that team alone, at full height and with
 * tooltips on — the "expand on click" half of item 6.
 */
export default function WeeklyPointsSection({
  data,
  selected,
}: WeeklyPointsSectionProps) {
  if (data.weeks.length === 0) {
    return (
      <ChartFrame title="Weekly points">
        <ChartEmpty message="No weeks have been scored in this league yet." />
      </ChartFrame>
    )
  }

  const weekLabels = data.weeks.map(formatWeek)
  const allValues = data.teams.flatMap((team) =>
    team.weeks
      .map((week) => week.points)
      .filter((points): points is number => points !== null)
  )
  // Bars anchor at zero — a truncated baseline exaggerates the differences a
  // score chart exists to show honestly (the rule `niceDomain` documents).
  const domain = niceDomain(extent(allValues) ?? { min: 0, max: 1 }, {
    includeZero: true,
  })
  const scaleNote = `${formatPoints(domain.min, 0)}–${formatPoints(
    domain.max,
    0
  )} points · same scale on every team`

  if (selected) {
    return (
      <ChartFrame
        title={`Weekly points — ${teamLabel(selected)}`}
        subtitle={weekRangeNote(data)}
        height="lg"
        caption={<CategoryAxis labels={weekLabels} interval={axisInterval(weekLabels.length)} />}
      >
        <ValueAxis domain={domain} format={pointsTick} />
        <WeeklyPointsBars
          weeks={selected.weeks}
          domain={domain}
          colorVar={seriesVar(0) ?? '--chart-neutral'}
          teamLabel={teamLabel(selected)}
          interactive
        />
      </ChartFrame>
    )
  }

  if (needsSmallMultiples(data.teams.length)) {
    const facets: Facet[] = data.teams.map((team) => ({
      key: String(team.nativeRosterId),
      title: teamLabel(team),
      value: formatPoints(team.totalPoints, 0),
      render: (shared: Domain) => (
        <WeeklyPointsBars
          weeks={team.weeks}
          domain={shared}
          colorVar="--chart-neutral"
          teamLabel={teamLabel(team)}
        />
      ),
    }))
    return (
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold">Weekly points</h3>
          <p className="text-xs text-muted-foreground">{weekRangeNote(data)}</p>
        </div>
        <SmallMultiples
          facets={facets}
          allValues={allValues}
          includeZero
          scaleCaption={`${scaleNote} · season total beside each team`}
        />
      </section>
    )
  }

  // Four teams or fewer: one grouped chart, a bar per team within each week.
  return (
    <ChartFrame
      title="Weekly points"
      subtitle={weekRangeNote(data)}
      height="lg"
      legend={
        <ChartLegend
          entries={data.teams.map((team) => ({
            label: teamLabel(team),
            colorVar: seriesVar(team.seriesIndex) ?? '--chart-neutral',
            value: formatPoints(team.totalPoints, 0),
          }))}
        />
      }
      caption={<CategoryAxis labels={weekLabels} interval={axisInterval(weekLabels.length)} />}
    >
      <ValueAxis domain={domain} format={pointsTick} />
      <div className="absolute inset-0 flex items-stretch gap-1">
        {data.weeks.map((week, weekIndex) => (
          <div key={week} className="flex min-w-0 flex-1 items-stretch gap-px">
            {data.teams.map((team) => {
              const points = team.weeks[weekIndex].points
              if (points === null) {
                return (
                  <div
                    key={team.nativeRosterId}
                    className="min-w-0 flex-1"
                    aria-hidden
                  />
                )
              }
              const span = spanOf(0, points, domain)
              const isFinal = team.weeks[weekIndex].isFinal
              return (
                <ChartMark
                  key={team.nativeRosterId}
                  className="min-w-0 flex-1"
                  label={`${teamLabel(team)}, ${formatWeek(week)}: ${formatPoints(
                    points
                  )} points${isFinal ? '' : ' (unofficial)'}`}
                  tooltip={
                    <span>
                      {teamLabel(team)} · {formatWeek(week)} ·{' '}
                      {formatPoints(points)}
                    </span>
                  }
                >
                  <div
                    className={cn(
                      'absolute inset-x-0 rounded-sm',
                      !isFinal && 'opacity-60'
                    )}
                    style={{
                      bottom: `${span.startPct}%`,
                      height: `${Math.max(span.sizePct, 0.5)}%`,
                      backgroundColor: tokenColor(
                        seriesVar(team.seriesIndex) ?? '--chart-neutral'
                      ),
                    }}
                  />
                </ChartMark>
              )
            })}
          </div>
        ))}
      </div>
    </ChartFrame>
  )
}

/**
 * The week range this section actually plots, stated plainly — with the
 * regular-season exclusion named whenever it applied, so a reader looking for
 * week 15 of a finished season finds out why it isn't there instead of
 * assuming the data is missing.
 */
export function weekRangeNote(data: ScoreTrendsData): string {
  if (data.weeks.length === 0) return 'No weeks scored yet'
  const range =
    data.weeks.length === 1
      ? `Week ${data.weeks[0]}`
      : `Weeks ${data.weeks[0]}–${data.weeks[data.weeks.length - 1]}`
  const scope =
    data.playoffWeekStart === null
      ? 'all scored weeks'
      : `regular season (playoffs start week ${data.playoffWeekStart})`
  const provisional =
    data.nonFinalWeeksCounted > 0
      ? ` · ${data.nonFinalWeeksCounted} unofficial`
      : ''
  return `${range} · ${scope}${provisional}`
}

/** Points axes read as whole numbers — a tick of "150.0" spends a decimal on nothing. */
function pointsTick(value: number): string {
  return formatPoints(value, 0)
}

/** Thin a crowded week axis rather than rotating or clipping its labels. */
export function axisInterval(labelCount: number): number {
  return labelCount > 12 ? 2 : 1
}
