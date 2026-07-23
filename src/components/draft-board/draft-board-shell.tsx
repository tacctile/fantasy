'use client'

import { useCallback, useMemo, useState } from 'react'

import type {
  ConnectedLeague,
  DraftBoardLeagueContext,
  DraftBoardPlayer,
} from '@/services/draft-board'
import type { RecordedPick } from '@/services/draft-picks'
import type { DraftSessionState } from '@/services/draft-sessions'

import DraftBoardHeader from './draft-board-header'
import DraftPollTicker from './draft-poll-ticker'
import { mergePicksIntoPlayers, picksFingerprint } from './live-picks'
import PlayerBoard from './player-board'
import RosterPanel from './roster-panel'

interface DraftBoardShellProps {
  context: DraftBoardLeagueContext
  players: DraftBoardPlayer[]
  leagues: ConnectedLeague[]
  session: DraftSessionState
  /** Server-rendered draft_state snapshot — live state until the first tick. */
  initialPicks: RecordedPick[]
}

/**
 * Client shell for the admin draft board — tablet/PC-first per MASTER_CONTEXT
 * UX Architecture (mobile may be rough here; the spectator surface is the
 * mobile-first build, and it is a separate rendering path). Three regions:
 * header/toolbar, the player-list board (toolbar + sortable table), and the
 * detail/roster sidebar (its panel is the player-list sub-section's final
 * item).
 *
 * Live-pick custody (Wave 3b client-side live sync items 1–2): the shell owns
 * the league's current draft_state snapshot — seeded by the server render,
 * replaced by each executed poll tick the DraftPollTicker delivers. A
 * fingerprint bail-out keeps identical snapshots from updating state at all
 * (React skips the re-render on same-reference state), and the merge overlay
 * (live-picks.ts) recomputes only when the snapshot or pool genuinely
 * changed. Both board regions read the merged pool — one source of truth;
 * the roster panel's own live extension is a later 03b item, and 'drafted'
 * rows are invisible to it by design (it derives from 'rostered' only).
 */
export default function DraftBoardShell({
  context,
  players,
  leagues,
  session,
  initialPicks,
}: DraftBoardShellProps) {
  const [livePicks, setLivePicks] = useState<RecordedPick[]>(initialPicks)

  const handlePicks = useCallback((picks: RecordedPick[]) => {
    setLivePicks((previous) =>
      picksFingerprint(previous) === picksFingerprint(picks) ? previous : picks
    )
  }, [])

  const mergedPlayers = useMemo(
    () => mergePicksIntoPlayers(players, livePicks),
    [players, livePicks]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <DraftPollTicker session={session} onPicks={handlePicks} />
      <DraftBoardHeader context={context} leagues={leagues} session={session} />
      <div className="flex min-h-0 flex-1">
        <section aria-label="Player board" className="min-w-0 flex-1 p-4">
          <PlayerBoard players={mergedPlayers} context={context} />
        </section>
        <aside
          aria-label="Roster panel"
          className="hidden w-80 shrink-0 border-l p-4 lg:block"
        >
          <RosterPanel players={mergedPlayers} context={context} />
        </aside>
      </div>
    </div>
  )
}
