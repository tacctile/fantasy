import { Badge } from '@/components/ui/badge'
import type { LeagueContext } from '@/services/league-context'
import type { PlayoffPictureData } from '@/services/playoff-picture'

import { playoffNotes, playoffScopeNote } from './playoff-notes'
import PlayoffScenario from './playoff-scenario'
import PlayoffTable from './playoff-table'

interface PlayoffShellProps {
  context: LeagueContext
  data: PlayoffPictureData
  basePath: string
  selectedRosterId: number | null
}

/**
 * The Playoff Picture section composition (Wave 5 — Playoff picture, item 4).
 *
 * Pure composition in the Wave 4 / Score Trends / Luck / Positional tradition:
 * it never re-derives a seed, a record, a status, or a magic number that
 * `services/playoff-picture.ts` already computed. It mounts INSIDE the
 * persistent admin sidebar shell, so it renders no navigation frame of its own.
 *
 * Disclosures come before the table, as they do on Positional, and for the same
 * reason turned up one notch: this section prints VERDICTS. A reader must meet
 * "the field size isn't known" or "divisions are ignored in this seeding" before
 * reading a badge that those facts qualify — not after they have already
 * believed it.
 */
export default function PlayoffShell({
  context,
  data,
  basePath,
  selectedRosterId,
}: PlayoffShellProps) {
  const notes = playoffNotes(data)

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
        <span className="text-sm text-muted-foreground">Playoff picture</span>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-4">
        <p className="text-xs text-muted-foreground">{playoffScopeNote(data)}</p>

        {notes.length > 0 && (
          <ul className="flex flex-col gap-1.5 rounded-xl bg-card px-3 py-2.5">
            {notes.map((note) => (
              <li key={note} className="text-xs text-muted-foreground">
                {note}
              </li>
            ))}
          </ul>
        )}

        {data.remainingGames.length === 0 ? (
          <>
            <PlayoffTable
              data={data}
              basePath={basePath}
              selectedRosterId={selectedRosterId}
            />
            <p className="text-xs text-muted-foreground">
              There are no unplayed games to try outcomes for. Either the
              regular season is over, or its future weeks have not been synced —
              this section cannot tell those apart. If the season is still
              running, run the full-season matchup sync and the what-if controls
              appear here.
            </p>
          </>
        ) : (
          <PlayoffScenario
            data={data}
            basePath={basePath}
            selectedRosterId={selectedRosterId}
          />
        )}

        <p className="text-xs text-muted-foreground">
          Statuses are deterministic, not predictions: a team is only shown as
          clinched or eliminated when that is true under every remaining result
          and every tiebreaker. Nothing here is forecast, sampled, or weighted by
          how likely an outcome is.
        </p>
      </main>
    </div>
  )
}
