import Link from 'next/link'

import { formatPoints } from '@/components/charts/format'
import { extent, niceDomain } from '@/components/charts/scales'
import { seriesVar } from '@/components/charts/series'
import { cn } from '@/lib/utils'
import type { ScoreTrendsData } from '@/services/score-trends'

import ScoreSparkline from './score-sparkline'
import { teamLabel, teamSubLabel } from './team-label'

interface TeamTrendListProps {
  data: ScoreTrendsData
  /** Base path for the drill-down links, e.g. /leagues/<id>/score-trends. */
  basePath: string
  selectedRosterId: number | null
}

/**
 * The season table: one row per team, with a sparkline of its weekly scores
 * and a drill-down link (Wave 5 — Score charts, item 6).
 *
 * This is the "table/list row context" the item names, and the click target
 * that expands a sparkline into the full bar and line charts above. Drill-down
 * is URL-driven (`?team=<native_roster_id>`), the same pattern the Wave 4
 * surfaces use for `?week=` and `?player=` — so the whole section stays
 * server-rendered with zero client JavaScript, and a drilled-in view is a
 * shareable link rather than transient component state.
 *
 * Ordering is the service's (total points desc), never re-derived here.
 */
export default function TeamTrendList({
  data,
  basePath,
  selectedRosterId,
}: TeamTrendListProps) {
  if (data.teams.length === 0) return null

  const allValues = data.teams.flatMap((team) =>
    team.weeks
      .map((week) => week.points)
      .filter((points): points is number => points !== null)
  )
  const domain = niceDomain(extent(allValues) ?? { min: 0, max: 1 })

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold">Season totals</h3>
        <p className="text-xs text-muted-foreground">
          Select a team to expand its weekly and cumulative charts.
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-card tabular-nums">
        <li className="grid grid-cols-[2rem_minmax(0,1fr)_5rem] items-center gap-3 px-3 py-2 text-xs text-muted-foreground sm:grid-cols-[2rem_minmax(0,1fr)_6rem_5rem_5rem_5rem]">
          <span>#</span>
          <span>Team</span>
          <span className="hidden sm:block">Trend</span>
          <span className="hidden text-right sm:block">Avg</span>
          <span className="hidden text-right sm:block">High</span>
          <span className="text-right">Total</span>
        </li>
        {data.teams.map((team, index) => {
          const isSelected = team.nativeRosterId === selectedRosterId
          const href = isSelected
            ? basePath
            : `${basePath}?team=${team.nativeRosterId}`
          const sub = teamSubLabel(team)
          return (
            <li key={team.nativeRosterId}>
              <Link
                href={href}
                aria-current={isSelected ? 'true' : undefined}
                className={cn(
                  'grid grid-cols-[2rem_minmax(0,1fr)_5rem] items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted sm:grid-cols-[2rem_minmax(0,1fr)_6rem_5rem_5rem_5rem]',
                  isSelected && 'bg-muted'
                )}
              >
                <span className="text-muted-foreground">{index + 1}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{teamLabel(team)}</span>
                  {sub && (
                    <span className="truncate text-xs text-muted-foreground">
                      {sub}
                    </span>
                  )}
                </span>
                <ScoreSparkline
                  className="hidden sm:block"
                  weeks={team.weeks}
                  domain={domain}
                  colorVar={
                    isSelected
                      ? (seriesVar(0) ?? '--chart-1')
                      : '--chart-neutral'
                  }
                  label={`${teamLabel(team)} weekly score trend`}
                />
                <span className="hidden text-right text-muted-foreground sm:block">
                  {team.averagePoints === null
                    ? '—'
                    : formatPoints(team.averagePoints)}
                </span>
                <span className="hidden text-right text-muted-foreground sm:block">
                  {team.highPoints === null
                    ? '—'
                    : formatPoints(team.highPoints)}
                </span>
                <span className="text-right font-medium">
                  {formatPoints(team.totalPoints)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
