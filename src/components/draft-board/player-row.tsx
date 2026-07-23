import { cn } from '@/lib/utils'
import type { DraftBoardPlayer } from '@/services/draft-board'

import InjuryChip from './injury-chip'
import PositionBadge from './position-badge'

interface PlayerRowProps {
  player: DraftBoardPlayer
}

// Source ADP carries one decimal of precision (wiki: sleeper-api/
// projections-endpoint sample, e.g. 1.4) — display matches it exactly.
function formatAdp(adpOverall: number | null): string {
  return adpOverall === null ? '—' : adpOverall.toFixed(1)
}

// Positional rank reads as the genre-standard composite ("RB12"); either half
// missing renders the honest dash, never a guessed value.
function formatPositionalRank(player: DraftBoardPlayer): string {
  if (player.position === null || player.positionalRank === null) return '—'
  return `${player.position}${player.positionalRank}`
}

/**
 * One draft-board table row: name + inline injury chip, position badge, NFL
 * team, overall ADP, positional rank, availability. Bye week is deliberately
 * absent (Nick-signed 2026-07-22): no schedule-derived bye source exists yet —
 * byes must never come from the player object (wiki: sleeper-api/
 * player-data-quirks). Rostered AND live-drafted rows dim as a whole
 * (opacity, not a color tint) — drafted players are no longer actionable on a
 * draft board. Live-drafted rows (the client merge's 'drafted' overlay) show
 * "Drafted · Pick N" (Nick-signed 2026-07-22) — team attribution arrives when
 * the roster sync graduates the row to 'rostered', or via the recent-picks
 * feed (later 03b item).
 */
export default function PlayerRow({ player }: PlayerRowProps) {
  const rostered = player.availability === 'rostered'
  const drafted = player.availability === 'drafted'
  const rosteredBy =
    player.rosteredByTeamName ?? player.rosteredByOwnerDisplayName ?? 'Rostered'
  const draftedLabel =
    player.draftedPickNumber === null
      ? 'Drafted'
      : `Drafted · Pick ${player.draftedPickNumber}`
  return (
    <tr
      className={cn(
        'border-b border-border/50 transition-colors hover:bg-muted',
        (rostered || drafted) && 'opacity-60'
      )}
    >
      <td className="px-3 py-2">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">
            {player.fullName ?? player.sleeperPlayerId}
          </span>
          <InjuryChip injuryStatus={player.injuryStatus} />
        </span>
      </td>
      <td className="px-3 py-2">
        <PositionBadge position={player.position} />
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground">
        {player.team ?? '—'}
      </td>
      <td className="px-3 py-2 text-right text-sm tabular-nums">
        {formatAdp(player.adpOverall)}
      </td>
      <td className="px-3 py-2 text-right text-sm tabular-nums">
        {formatPositionalRank(player)}
      </td>
      <td className="px-3 py-2 text-sm">
        {rostered ? (
          <span className="truncate text-secondary-foreground">
            {rosteredBy}
          </span>
        ) : drafted ? (
          <span className="truncate tabular-nums text-secondary-foreground">
            {draftedLabel}
          </span>
        ) : (
          <span className="text-muted-foreground">Available</span>
        )}
      </td>
    </tr>
  )
}
