'use client'

import type {
  ConnectedLeague,
  DraftBoardLeagueContext,
  DraftBoardPlayer,
} from '@/services/draft-board'

import DraftBoardHeader from './draft-board-header'

interface DraftBoardShellProps {
  context: DraftBoardLeagueContext
  players: DraftBoardPlayer[]
  leagues: ConnectedLeague[]
}

/**
 * Client shell for the admin draft board — tablet/PC-first per MASTER_CONTEXT
 * UX Architecture (mobile may be rough here; the spectator surface is the
 * mobile-first build, and it is a separate rendering path). Three regions:
 * header/toolbar, player table, and the detail/roster sidebar. This fold
 * ships the shell and header; player rows and the roster panel belong to the
 * next sub-sections, so their regions render honest placeholders over the
 * already-live dataset rather than premature row markup.
 */
export default function DraftBoardShell({
  context,
  players,
  leagues,
}: DraftBoardShellProps) {
  const adpCount = players.filter((p) => p.adpOverall !== null).length
  const rosteredCount = players.filter(
    (p) => p.availability === 'rostered'
  ).length

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <DraftBoardHeader context={context} leagues={leagues} />
      <div className="flex min-h-0 flex-1">
        <section aria-label="Player board" className="min-w-0 flex-1 p-4">
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Player list lands with the next build section.
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {players.length} players in pool · {adpCount} with ADP ·{' '}
              {rosteredCount} rostered
            </p>
          </div>
        </section>
        <aside
          aria-label="Roster panel"
          className="hidden w-80 shrink-0 border-l p-4 lg:block"
        >
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Roster / positional-need panel lands with the player-list
              section.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
