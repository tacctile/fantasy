import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { teamLabel } from '@/components/score-trends/team-label'
import type { LeagueContext } from '@/services/league-context'
import type { PositionalBreakdownData } from '@/services/positional'

import PositionalHeatmap from './positional-heatmap'
import { positionalNotes } from './positional-notes'
import PositionalTable from './positional-table'
import PositionalTeamBars from './positional-team-bars'

interface PositionalShellProps {
  context: LeagueContext
  data: PositionalBreakdownData
  basePath: string
  selectedRosterId: number | null
  sortKey: string | null
}

/**
 * The Positional Breakdowns section composition (Wave 5 — Positional
 * breakdowns).
 *
 * Pure composition in the Wave 4 / Score Trends / Luck tradition: it never
 * re-derives a total, a rank, a share, or a week range that
 * `services/positional.ts` already computed. It mounts INSIDE the persistent
 * admin sidebar shell (a child of `[leagueId]/layout.tsx`), so it renders no
 * navigation frame of its own.
 *
 * Reading order is deliberate. The disclosures come first — this section's
 * central figure is INFERRED (slot attribution) rather than observed, so a
 * reader must meet that before the charts, not after. Then the league grid,
 * which is the landing view and needs no selection. The single-team bars appear
 * only once a team is chosen, above the grid, mirroring how the Luck Tracker
 * puts a drill-down above the list it came from. The detail table sits last: it
 * is the reference the charts point at, not the thing read first.
 */
export default function PositionalShell({
  context,
  data,
  basePath,
  selectedRosterId,
  sortKey,
}: PositionalShellProps) {
  const selected =
    selectedRosterId === null
      ? null
      : (data.teams.find((team) => team.nativeRosterId === selectedRosterId) ??
        null)

  const notes = positionalNotes(data)

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
          {selected
            ? `Positional breakdown — ${teamLabel(selected)}`
            : 'Positional breakdown'}
        </span>
        {selected && (
          <Link
            href={sortKey === null ? basePath : `${basePath}?sort=${sortKey}`}
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

        {selected && <PositionalTeamBars data={data} team={selected} />}

        <PositionalHeatmap
          data={data}
          basePath={basePath}
          sortKey={sortKey}
          selectedRosterId={selectedRosterId}
        />

        <PositionalTable data={data} selectedRosterId={selectedRosterId} />
      </main>
    </div>
  )
}
