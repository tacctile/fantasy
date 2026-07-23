import type { LeagueRoster } from '@/services/draft-board'
import type { DraftSessionState } from '@/services/draft-sessions'
import type { DraftOrderMeta } from '@/services/sleeper/draft-state'

import { projectOnClock } from './live-picks'
import { rosterLabel } from './player-row'

interface LiveDraftStripProps {
  session: DraftSessionState
  /** Next unclaimed pick — computeNextPickNumber over snapshot ∪ pending, the
   *  same number the next Draft click would claim. */
  nextPickNumber: number
  /** League size from league_config's derived_config; null = round unknown. */
  leagueSize: number | null
  /** Selected draft's order metadata from the poll path; null until the first
   *  successful tick (or honestly absent for manual-only drafts). */
  draftOrder: DraftOrderMeta | null
  rosters: LeagueRoster[]
}

/**
 * Slim live-draft strip between the header and the board (Wave 3b UI
 * extensions item 2, Nick's placement choice 2026-07-22): current pick,
 * round, and the projected team on the clock. Rendered only while a draft
 * session is active. Pick/round derive from the live snapshot + pending
 * overlay (the shipped next-pick semantic); on-clock is a projection from
 * the draft object's slot_to_roster_id + snake/reversal math (Nick-signed:
 * recorded picks stay ground truth, keepers/in-draft trades can shift
 * reality) and is honestly omitted when no order metadata exists. Past the
 * final scheduled pick the strip reads draft complete instead of projecting
 * a team that will never pick.
 */
export default function LiveDraftStrip({
  session,
  nextPickNumber,
  leagueSize,
  draftOrder,
  rosters,
}: LiveDraftStripProps) {
  if (!session.isDraftActive) return null

  const projection = projectOnClock(nextPickNumber, draftOrder)

  if (projection.kind === 'complete') {
    const totalPicks =
      draftOrder !== null &&
      draftOrder.rounds !== null &&
      draftOrder.slotToRosterId !== null
        ? draftOrder.rounds * Object.keys(draftOrder.slotToRosterId).length
        : null
    return (
      <div className="flex items-center gap-x-4 border-b px-4 py-2 text-sm">
        <span className="font-medium">Draft complete</span>
        {totalPicks !== null ? (
          <span className="text-muted-foreground tabular-nums">
            all {totalPicks} picks recorded
          </span>
        ) : null}
      </div>
    )
  }

  const round =
    leagueSize === null ? null : Math.ceil(nextPickNumber / leagueSize)
  const onClockRoster =
    projection.kind === 'team'
      ? (rosters.find(
          (roster) => roster.nativeRosterId === projection.nativeRosterId
        ) ?? null)
      : null
  const onClockLabel =
    projection.kind === 'team'
      ? onClockRoster !== null
        ? rosterLabel(onClockRoster)
        : `Roster ${projection.nativeRosterId}`
      : null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2 text-sm">
      <span className="font-medium tabular-nums">Pick {nextPickNumber}</span>
      {round !== null ? (
        <span className="text-muted-foreground tabular-nums">
          Round {round}
        </span>
      ) : null}
      {onClockLabel !== null ? (
        <span className="text-muted-foreground">
          On the clock:{' '}
          <span className="font-medium text-foreground">{onClockLabel}</span>
        </span>
      ) : null}
    </div>
  )
}
