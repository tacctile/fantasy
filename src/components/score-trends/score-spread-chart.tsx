import ChartEmpty from '@/components/charts/chart-empty'
import ChartFrame from '@/components/charts/chart-frame'
import { formatPoints } from '@/components/charts/format'
import {
  extent,
  niceDomain,
  positionOf,
  spanOf,
} from '@/components/charts/scales'
import { seriesVar, tokenColor } from '@/components/charts/series'
import ValueAxis from '@/components/charts/value-axis'
import { cn } from '@/lib/utils'
import type { ScoreTrendsData, TeamScoreTrend } from '@/services/score-trends'

import { teamLabel } from './team-label'

interface ScoreSpreadChartProps {
  data: ScoreTrendsData
  /** Highlighted while drilled into one team; the rest stay for context. */
  selected?: TeamScoreTrend | null
}

/**
 * Score distribution: every team's floor / median / ceiling on one shared axis
 * (Wave 5 — Score charts, item 5; Nick's Clarify chose the band over a
 * histogram).
 *
 * The form follows the consistency wiki's key decision directly
 * (in-season-management/consistency-score-boom-bust-rate): report explicit
 * floor and ceiling alongside the median rather than a single unnormalized
 * dispersion number, because a raw standard deviation penalises a high-scoring
 * team for having a wide absolute range even when its outcomes are uniformly
 * good. A band shows the same variance information while keeping the team's
 * scoring LEVEL visible, which is the part a single dispersion figure throws
 * away.
 *
 * DELIBERATELY min/max rather than 10th/90th percentiles: a regular season
 * gives roughly fourteen observations per team, and interpolating percentiles
 * from fourteen points asserts a precision the sample cannot support. The same
 * wiki page's small-sample warning is why the section carries the
 * `lowConfidence` caveat under six weeks — a variance read is an inference,
 * unlike the raw weekly bars, which are observations and carry no caveat.
 *
 * Not zero-anchored: this is a range band, not a magnitude bar, so the axis
 * spans the league's actual scoring range and the differences between teams
 * stay legible.
 */
export default function ScoreSpreadChart({
  data,
  selected,
}: ScoreSpreadChartProps) {
  const ranked = [...data.teams]
    .filter((team) => team.medianPoints !== null)
    .sort((a, b) => (b.medianPoints ?? 0) - (a.medianPoints ?? 0))

  if (ranked.length === 0) {
    return (
      <ChartFrame title="Score spread">
        <ChartEmpty message="No scored weeks yet — nothing to spread." />
      </ChartFrame>
    )
  }

  const allValues = data.teams.flatMap((team) =>
    team.weeks
      .map((week) => week.points)
      .filter((points): points is number => points !== null)
  )
  const domain = niceDomain(extent(allValues) ?? { min: 0, max: 1 })
  const leagueMedianPct =
    data.leagueMedianWeek === null
      ? null
      : positionOf(data.leagueMedianWeek, domain)

  return (
    <ChartFrame
      title="Score spread"
      subtitle={spreadSubtitle(data)}
      height="lg"
      caption={
        <span>
          Bar spans each team&apos;s lowest to highest week; the notch is its
          median. Dotted line is the league median
          {data.leagueMedianWeek === null
            ? ''
            : ` (${formatPoints(data.leagueMedianWeek)})`}
          .
        </span>
      }
    >
      <div className="absolute inset-0 grid grid-cols-[minmax(0,7rem)_1fr] gap-2">
        <ul className="flex flex-col justify-around pb-5">
          {ranked.map((team) => (
            <li
              key={team.nativeRosterId}
              className={cn(
                'truncate text-xs',
                selected?.nativeRosterId === team.nativeRosterId
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {teamLabel(team)}
            </li>
          ))}
        </ul>
        <div className="relative">
          <div className="absolute inset-x-0 top-0 bottom-5">
            <ValueAxis
              domain={domain}
              orientation="x"
              format={(value) => formatPoints(value, 0)}
            />
          </div>
          {leagueMedianPct !== null && (
            <div
              aria-hidden
              className="absolute top-0 bottom-5 w-px border-l border-dashed border-chart-neutral"
              style={{ left: `${leagueMedianPct}%` }}
            />
          )}
          <ul className="absolute inset-x-0 top-0 bottom-5 flex flex-col justify-around">
            {ranked.map((team) => {
              const isSelected = selected?.nativeRosterId === team.nativeRosterId
              const band = spanOf(
                team.lowPoints ?? 0,
                team.highPoints ?? 0,
                domain
              )
              const medianPct = positionOf(team.medianPoints ?? 0, domain)
              const color = tokenColor(
                isSelected ? (seriesVar(0) ?? '--chart-1') : '--chart-neutral'
              )
              return (
                <li key={team.nativeRosterId} className="relative h-3">
                  <span className="sr-only">
                    {teamLabel(team)}: low {formatPoints(team.lowPoints ?? 0)},
                    median {formatPoints(team.medianPoints ?? 0)}, high{' '}
                    {formatPoints(team.highPoints ?? 0)} points over{' '}
                    {team.scoredWeeks} weeks
                  </span>
                  <div
                    aria-hidden
                    className="absolute inset-y-0 my-1 rounded-full"
                    style={{
                      left: `${band.startPct}%`,
                      width: `${Math.max(band.sizePct, 0.5)}%`,
                      backgroundColor: color,
                      opacity: isSelected ? 1 : 0.45,
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full"
                    style={{ left: `${medianPct}%`, backgroundColor: color }}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </ChartFrame>
  )
}

/**
 * The spread's own caveat line. A variance reading under roughly six counted
 * weeks is sample-noise dominated (wiki: points-for-against-luck-analysis and
 * consistency-score-boom-bust-rate both converge on it), and the platform rule
 * is to flag such a reading rather than present it at full weight.
 */
function spreadSubtitle(data: ScoreTrendsData): string {
  const base = `Low / median / high per team over ${data.weeksCounted} scored ${
    data.weeksCounted === 1 ? 'week' : 'weeks'
  }`
  return data.lowConfidence
    ? `${base} · provisional read — under 6 weeks, spread is mostly sample noise`
    : base
}
