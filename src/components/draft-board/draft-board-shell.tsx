'use client'

import type {
  ConnectedLeague,
  DraftBoardLeagueContext,
  DraftBoardPlayer,
} from '@/services/draft-board'
import type { DraftSessionState } from '@/services/draft-sessions'

import DraftBoardHeader from './draft-board-header'
import DraftPollTicker from './draft-poll-ticker'
import PlayerBoard from './player-board'
import RosterPanel from './roster-panel'

interface DraftBoardShellProps {
  context: DraftBoardLeagueContext
  players: DraftBoardPlayer[]
  leagues: ConnectedLeague[]
  session: DraftSessionState
}

/**
 * Client shell for the admin draft board — tablet/PC-first per MASTER_CONTEXT
 * UX Architecture (mobile may be rough here; the spectator surface is the
 * mobile-first build, and it is a separate rendering path). Three regions:
 * header/toolbar, the player-list board (toolbar + sortable table), and the
 * detail/roster sidebar (its panel is the player-list sub-section's final
 * item).
 */
export default function DraftBoardShell({
  context,
  players,
  leagues,
  session,
}: DraftBoardShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <DraftPollTicker session={session} />
      <DraftBoardHeader context={context} leagues={leagues} session={session} />
      <div className="flex min-h-0 flex-1">
        <section aria-label="Player board" className="min-w-0 flex-1 p-4">
          <PlayerBoard players={players} context={context} />
        </section>
        <aside
          aria-label="Roster panel"
          className="hidden w-80 shrink-0 border-l p-4 lg:block"
        >
          <RosterPanel players={players} context={context} />
        </aside>
      </div>
    </div>
  )
}
