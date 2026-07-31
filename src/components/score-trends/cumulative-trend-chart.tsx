import CategoryAxis from '@/components/charts/category-axis'
import ChartEmpty from '@/components/charts/chart-empty'
import ChartFrame from '@/components/charts/chart-frame'
import ChartLegend from '@/components/charts/chart-legend'
import { formatPoints, formatWeek } from '@/components/charts/format'
import {
  extent,
  niceDomain,
  polylinePoints,
  type Domain,
} from '@/components/charts/scales'
import {
  needsSmallMultiples,
  seriesVar,
  tokenColor,
} from '@/components/charts/series'
import SmallMultiples, { type Facet } from '@/components/charts/small-multiples'
import ValueAxis from '@/components/charts/value-axis'
import type { ScoreTrendsData, TeamScoreTrend } from '@/services/score-trends'

import { teamLabel } from './team-label'
import { axisInterval, weekRangeNote } from './weekly-points-section'

interface CumulativeTrendChartProps {
  data: ScoreTrendsData
  selected?: TeamScoreTrend | null
}

/**
 * Cumulative points through each week, as a line (Wave 5 — Score charts,
 * item 3).
 *
 * This is the ONE score view where a line is the right mark: a running total
 * genuinely is continuous between weeks, so the segment connecting week 3 to
 * week 4 represents something real, unlike a line drawn between two independent
 * weekly scores.
 *
 * Every version of the chart carries the LEAGUE-AVERAGE reference line — a
 * dashed neutral series — because a cumulative total on its own is unreadable:
 * 1,240 points is only meaningful against what the rest of the league did over
 * the same weeks. It is drawn recessively so it reads as context, never as a
 * thirteenth team.
 *
 * Item 4's series cap applies here too. Past four teams the chart fans out to
 * small multiples, each facet carrying its own team line PLUS the same league
 * reference on the same shared domain — so a facet answers "ahead or behind"
 * on its own without the reader holding twelve lines in their head.
 */
export default function CumulativeTrendChart({
  data,
  selected,
}: CumulativeTrendChartProps) {
  if (data.weeks.length === 0) {
    return (
      <ChartFrame title="Cumulative points">
        <ChartEmpty message="Nothing to trend until a week has been scored." />
      </ChartFrame>
    )
  }

  const weekLabels = data.weeks.map(formatWeek)
  const allValues = [
    ...data.teams.flatMap((team) =>
      team.cumulative.filter((value): value is number => value !== null)
    ),
    ...data.leagueAverageCumulative,
  ]
  // A trend line is NOT zero-anchored: forcing zero on a cumulative series
  // compresses every team into the top of the plot and flattens the divergence
  // the chart exists to show (the distinction `niceDomain` documents).
  const domain = niceDomain(extent(allValues) ?? { min: 0, max: 1 })
  const teams = selected ? [selected] : data.teams

  const leagueLine = (
    <TrendLine
      values={data.leagueAverageCumulative}
      domain={domain}
      colorVar="--chart-neutral"
      dashed
      label="League average"
    />
  )

  if (!selected && needsSmallMultiples(data.teams.length)) {
    const facets: Facet[] = data.teams.map((team) => ({
      key: String(team.nativeRosterId),
      title: teamLabel(team),
      value: formatPoints(team.totalPoints, 0),
      render: (shared: Domain) => (
        <>
          <TrendLine
            values={data.leagueAverageCumulative}
            domain={shared}
            colorVar="--chart-neutral"
            dashed
            label="League average"
          />
          <TrendLine
            values={team.cumulative}
            domain={shared}
            colorVar="--chart-1"
            label={teamLabel(team)}
          />
        </>
      ),
    }))
    return (
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold">Cumulative points</h3>
          <p className="text-xs text-muted-foreground">
            {weekRangeNote(data)} · dashed line is the league average
          </p>
        </div>
        <SmallMultiples
          facets={facets}
          allValues={allValues}
          includeZero={false}
          scaleCaption={`${formatPoints(domain.min, 0)}–${formatPoints(
            domain.max,
            0
          )} cumulative points · same scale on every team`}
        />
      </section>
    )
  }

  return (
    <ChartFrame
      title={
        selected
          ? `Cumulative points — ${teamLabel(selected)}`
          : 'Cumulative points'
      }
      subtitle={weekRangeNote(data)}
      height="lg"
      legend={
        <ChartLegend
          entries={[
            ...teams.map((team) => ({
              label: teamLabel(team),
              colorVar: seriesVar(selected ? 0 : team.seriesIndex) ?? '--chart-1',
              value: formatPoints(team.totalPoints, 0),
            })),
            { label: 'League average', colorVar: '--chart-neutral' },
          ]}
        />
      }
      caption={
        <CategoryAxis labels={weekLabels} interval={axisInterval(weekLabels.length)} />
      }
    >
      <ValueAxis domain={domain} format={(value) => formatPoints(value, 0)} />
      {leagueLine}
      {teams.map((team) => (
        <TrendLine
          key={team.nativeRosterId}
          values={team.cumulative}
          domain={domain}
          colorVar={seriesVar(selected ? 0 : team.seriesIndex) ?? '--chart-1'}
          label={teamLabel(team)}
        />
      ))}
    </ChartFrame>
  )
}

interface TrendLineProps {
  values: readonly (number | null)[]
  domain: Domain
  colorVar: string
  label: string
  dashed?: boolean
}

/**
 * One polyline in the plot's percentage space.
 *
 * `preserveAspectRatio="none"` plus `vector-effect="non-scaling-stroke"` is
 * what lets a single 0–100 × 0–100 path stretch to any container width without
 * the stroke thickening with it — the same zero-measurement approach the rest
 * of the chart layer uses. A missing week becomes a genuine BREAK in the line
 * (`polylinePoints` returns separate segments) rather than a straight
 * interpolation across a week that was never played.
 */
function TrendLine({ values, domain, colorVar, label, dashed }: TrendLineProps) {
  const segments = polylinePoints(
    values.map((value) => (value === null ? Number.NaN : value)),
    domain
  )
  if (segments.length === 0) return null
  return (
    <svg
      aria-label={label}
      role="img"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full"
    >
      {segments.map((points) => (
        <polyline
          key={points}
          points={points}
          fill="none"
          stroke={tokenColor(colorVar)}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={dashed ? '4 3' : undefined}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}
