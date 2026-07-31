import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import type { LeagueContext } from '@/services/league-context'
import type { LuckData } from '@/services/luck'
import { teamLabel } from '@/components/score-trends/team-label'

import LuckDrilldown from './luck-drilldown'
import {
  luckConfidenceNote,
  luckRatingGapNote,
  luckStandingsNote,
} from './luck-notes'
import LuckRankedChart from './luck-ranked-chart'

interface LuckShellProps {
  context: LeagueContext
  data: LuckData
  basePath: string
  selectedRosterId: number | null
}

/**
 * The Luck Tracker section composition (Wave 5 — Lucky/unlucky tracker).
 *
 * Pure composition in the Wave 4/Score Trends tradition: it never re-derives a
 * record, an ordering, or a week range that `services/luck.ts` already computed.
 * It mounts INSIDE the persistent admin sidebar shell (a child of
 * `[leagueId]/layout.tsx`), so it renders no navigation frame of its own.
 *
 * The ranked view and the drill-down are alternatives, not neighbours: item 6
 * specifies the per-team view as "separate from the primary ranked view", and
 * showing both at once invites reading a single team's weekly bar as a
 * league-wide one. The ranked list stays visible underneath as the way back.
 *
 * The three disclosures (small sample, bye-week rating gap, standings
 * disagreement) sit at the top, above any chart — they qualify every number
 * below them, so a reader must meet them before the bars, not after.
 */
export default function LuckShell({
  context,
  data,
  basePath,
  selectedRosterId,
}: LuckShellProps) {
  const selected =
    selectedRosterId === null
      ? null
      : (data.teams.find((team) => team.nativeRosterId === selectedRosterId) ??
        null)

  const notes = [
    luckConfidenceNote(data),
    luckRatingGapNote(data),
    luckStandingsNote(data),
  ].filter((note): note is string => note !== null)

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
          {selected ? `Luck tracker — ${teamLabel(selected)}` : 'Luck tracker'}
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
        {notes.length > 0 && (
          <ul className="flex flex-col gap-1.5 rounded-xl bg-card px-3 py-2.5">
            {notes.map((note) => (
              <li key={note} className="text-xs text-muted-foreground">
                {note}
              </li>
            ))}
          </ul>
        )}

        {selected && <LuckDrilldown data={data} team={selected} />}

        <LuckRankedChart
          data={data}
          basePath={basePath}
          selectedRosterId={selectedRosterId}
        />
      </main>
    </div>
  )
}
