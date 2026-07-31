import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { LeagueContext } from '@/services/league-context'
import type { ScoreTrendsData } from '@/services/score-trends'

import CumulativeTrendChart from './cumulative-trend-chart'
import ScoreSpreadChart from './score-spread-chart'
import { teamLabel } from './team-label'
import TeamTrendList from './team-trend-list'
import WeeklyPointsSection from './weekly-points-section'

interface ScoreTrendsShellProps {
  context: LeagueContext
  data: ScoreTrendsData
  basePath: string
  selectedRosterId: number | null
}

/**
 * The Score Trends section composition (Wave 5 — Score charts, item 7).
 *
 * Pure composition, in the Wave 4 shell tradition: it never re-derives a total,
 * an ordering, or a week range that `services/score-trends.ts` already
 * computed. It also mounts INTO the persistent admin sidebar shell (this is a
 * child of `[leagueId]/layout.tsx`), so it renders no navigation frame of its
 * own — the sidebar owns the league selector and sign-out, as it has since the
 * Wave 4 nav shell.
 *
 * A drill-down selection (`?team=`) narrows the two full-size charts to that
 * team; the spread chart deliberately keeps the whole league visible with the
 * team highlighted, because a single team's spread with nothing to compare it
 * against is precisely the reading the item asks the chart to contextualise.
 */
export default function ScoreTrendsShell({
  context,
  data,
  basePath,
  selectedRosterId,
}: ScoreTrendsShellProps) {
  const selected =
    selectedRosterId === null
      ? null
      : (data.teams.find((team) => team.nativeRosterId === selectedRosterId) ??
        null)

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">
            {context.name ?? 'League'}
          </h1>
          <Badge variant="secondary" className="uppercase">
            {context.platform}
          </Badge>
          <span className="text-sm text-muted-foreground tabular-nums">
            {context.seasonYear}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {selected ? `Score trends — ${teamLabel(selected)}` : 'Score trends'}
        </span>
        {selected && (
          <Link
            href={basePath}
            className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to all teams
          </Link>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-8 p-4">
        <WeeklyPointsSection data={data} selected={selected} />
        <CumulativeTrendChart data={data} selected={selected} />
        <ScoreSpreadChart data={data} selected={selected} />
        <TeamTrendList
          data={data}
          basePath={basePath}
          selectedRosterId={selectedRosterId}
        />
      </main>
    </div>
  )
}
