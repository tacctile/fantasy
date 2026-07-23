import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LeagueRoster } from '@/services/draft-board'
import type { RecordedPick } from '@/services/draft-picks'
import type { DraftSessionState } from '@/services/draft-sessions'

import { latestManualPickNumber } from './live-picks'
import { rosterLabel } from './player-row'

interface RecentPicksFeedProps {
  /** Confirmed draft_state snapshot, pick_number ascending (shell custody). */
  picks: RecordedPick[]
  rosters: LeagueRoster[]
  session: DraftSessionState
  /** True while an undo request is in flight — disables the Undo button. */
  undoInFlight: boolean
  /** Undo the league's latest manual pick (shell-owned; the one write path). */
  onUndo: () => void
}

/** Source badge text — draft_state.source values are a closed app enum
 *  (espn_poll exists at schema level since Wave 1; rows appear only when
 *  03c's ESPN poller lands — the label alone lives here for enum totality). */
const SOURCE_BADGES: Record<RecordedPick['source'], string> = {
  manual: 'manual',
  sleeper_poll: 'sleeper',
  espn_poll: 'espn',
}

/**
 * Compact recent-picks feed (Wave 3b UI extensions item 4, all placements
 * Nick-signed 2026-07-22): newest first in the sidebar below the rosters,
 * rendered whenever the league has recorded picks (overlay-always precedent —
 * honest history, session or not). Every pick appears regardless of board-pool
 * membership; identity comes from the snapshot's catalog join, never pick
 * metadata. The Undo affordance renders on exactly the row the server would
 * delete (highest manual pick number), only while the draft session is live.
 */
export default function RecentPicksFeed({
  picks,
  rosters,
  session,
  undoInFlight,
  onUndo,
}: RecentPicksFeedProps) {
  if (picks.length === 0) return null

  const newestFirst = [...picks].sort((a, b) => b.pickNumber - a.pickNumber)
  const undoPickNumber = session.isDraftActive
    ? latestManualPickNumber(picks)
    : null
  const labelByRosterId = new Map(
    rosters.map((roster) => [roster.nativeRosterId, rosterLabel(roster)])
  )

  return (
    <section
      aria-label="Recent picks"
      className="flex max-h-80 min-h-0 shrink-0 flex-col border-t p-4"
    >
      <div className="flex items-baseline justify-between pb-2">
        <h2 className="text-sm font-semibold">Recent picks</h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {picks.length} recorded
        </p>
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {newestFirst.map((pick) => (
          <li
            key={pick.pickNumber}
            className="flex items-center gap-2 rounded-xl bg-card px-2 py-1.5 text-xs"
          >
            <span className="w-8 shrink-0 text-muted-foreground tabular-nums">
              {pick.pickNumber}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {pick.playerFullName ?? `Player ${pick.sleeperPlayerId}`}
                {pick.playerPosition !== null && (
                  <span className="text-muted-foreground">
                    {' '}
                    · {pick.playerPosition}
                  </span>
                )}
              </span>
              <span className="block truncate text-muted-foreground">
                R{pick.round} ·{' '}
                {labelByRosterId.get(pick.nativeRosterId) ??
                  `Roster ${pick.nativeRosterId}`}
              </span>
            </span>
            <span
              className={cn(
                'inline-flex h-4 shrink-0 items-center rounded-full px-1.5',
                'bg-muted text-[10px] font-semibold uppercase text-muted-foreground'
              )}
            >
              {SOURCE_BADGES[pick.source]}
            </span>
            {pick.pickNumber === undoPickNumber && (
              <Button
                variant="outline"
                size="xs"
                disabled={undoInFlight}
                onClick={onUndo}
              >
                Undo
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
