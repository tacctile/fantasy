import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { MatchupPlayerScore, MatchupSide } from '@/services/dashboard'

import AsOfTime from './as-of-time'
import UnofficialChip from './unofficial-chip'

interface MatchupCardProps {
  /** Two sides for a head-to-head pair; one side renders the bye/no-opponent
   *  card (unpaired rows from the service, byes and anomaly fallout alike). */
  sides: [MatchupSide] | [MatchupSide, MatchupSide]
  /** The rendered week — player-name links carry it (`?week=N&player=id`) so
   *  opening a player card never loses the selected week. */
  week: number
}

// Platform-scored values carry two decimals at the wire — displayed exactly.
function formatPoints(points: number | null): string {
  return points === null ? '—' : points.toFixed(2)
}

function latestFetchedAt(sides: MatchupSide[]): string | null {
  let latest: string | null = null
  for (const side of sides) {
    if (side.fetchedAt !== null && (latest === null || side.fetchedAt > latest)) {
      latest = side.fetchedAt
    }
  }
  return latest
}

/**
 * One team's header block: name + owner, big bold effective-points total
 * (the display type of the app), unofficial chip when the side is non-final.
 * Mirrored via `align` — totals sit on the outer edges of the card.
 */
function SideHeader({
  side,
  align,
}: {
  side: MatchupSide
  align: 'left' | 'right'
}) {
  const right = align === 'right'
  return (
    <div className={cn('min-w-0', right && 'text-right')}>
      <span className="block truncate text-sm font-semibold">
        {side.teamName ?? side.ownerDisplayName ?? `Roster ${side.nativeRosterId}`}
      </span>
      {side.teamName !== null && side.ownerDisplayName !== null && (
        <span className="block truncate text-xs text-muted-foreground">
          {side.ownerDisplayName}
        </span>
      )}
      <span
        className={cn(
          'mt-1 flex items-center gap-1.5',
          right && 'flex-row-reverse'
        )}
      >
        <span className="text-2xl font-extrabold tabular-nums">
          {formatPoints(side.effectivePoints)}
        </span>
        <UnofficialChip isFinal={side.isFinal} />
      </span>
    </div>
  )
}

/**
 * One player line, mirrored: name (+ muted position) toward the center,
 * points pinned to the outer edge — the two point columns read straight
 * down the card's outer rails (DESIGN_SYSTEM.md head-to-head pattern).
 */
function PlayerLine({
  line,
  align,
  week,
}: {
  line: MatchupPlayerScore
  align: 'left' | 'right'
  week: number
}) {
  const right = align === 'right'
  return (
    <span
      className={cn(
        'flex min-w-0 items-baseline gap-2',
        right && 'flex-row-reverse'
      )}
    >
      <span className="text-sm font-semibold tabular-nums">
        {line.points.toFixed(2)}
      </span>
      <span className="min-w-0 flex-1 truncate">
        <Link
          href={`?week=${week}&player=${line.sleeperPlayerId}`}
          className={cn(
            'text-sm transition-colors hover:underline',
            !line.wasStarter && 'text-secondary-foreground'
          )}
        >
          {line.fullName ?? line.sleeperPlayerId}
        </Link>
        {line.position !== null && (
          <span className="ml-1.5 text-xs text-muted-foreground">
            {line.position}
          </span>
        )}
      </span>
    </span>
  )
}

/**
 * Two sides' lines rendered as index-paired mirrored rows. Slot-by-slot
 * pairing is deliberately absent: historical player_scores carry
 * `was_starter` only — no per-week slot attribution exists in any synced
 * payload — so rows pair by the service's ordering (starters first, points
 * desc), never by a guessed slot (disclosed at Clarify, 2026-07-22).
 */
function MirroredLines({
  left,
  right,
  week,
}: {
  left: MatchupPlayerScore[]
  right: MatchupPlayerScore[]
  week: number
}) {
  const rowCount = Math.max(left.length, right.length)
  if (rowCount === 0) return null
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: rowCount }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-2 items-baseline gap-x-4"
        >
          {left[index] !== undefined ? (
            <PlayerLine line={left[index]} align="left" week={week} />
          ) : (
            <span />
          )}
          {right[index] !== undefined ? (
            <PlayerLine line={right[index]} align="right" week={week} />
          ) : (
            <span />
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * One matchup card (admin MatchupsGrid unit): mirrored team headers with
 * bold totals on the outer edges, starters mirrored beneath as points-ordered
 * rows, bench lines behind a native collapsible (no client JS), and the
 * as-of caption from the freshest side. A single-side card is the honest
 * bye/no-opponent rendering — muted label, deliberately uncolored
 * (DESIGN_SYSTEM.md: absence of color = absence of urgency).
 */
export default function MatchupCard({ sides, week }: MatchupCardProps) {
  const [left, right] = sides
  const fetchedAt = latestFetchedAt(sides)

  if (right === undefined) {
    return (
      <div className="rounded-xl bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <SideHeader side={left} align="left" />
          <span className="text-xs text-muted-foreground">No opponent</span>
        </div>
        {fetchedAt !== null && (
          <div className="mt-3">
            <AsOfTime fetchedAt={fetchedAt} />
          </div>
        )}
      </div>
    )
  }

  const leftStarters = left.playerScores.filter((line) => line.wasStarter)
  const rightStarters = right.playerScores.filter((line) => line.wasStarter)
  const leftBench = left.playerScores.filter((line) => !line.wasStarter)
  const rightBench = right.playerScores.filter((line) => !line.wasStarter)
  const hasBench = leftBench.length > 0 || rightBench.length > 0

  return (
    <div className="rounded-xl bg-card p-4">
      <div className="grid grid-cols-2 items-start gap-x-4">
        <SideHeader side={left} align="left" />
        <SideHeader side={right} align="right" />
      </div>
      <div className="mt-3 border-t border-border/50 pt-3">
        <MirroredLines left={leftStarters} right={rightStarters} week={week} />
      </div>
      {hasBench && (
        <details className="mt-2">
          <summary className="cursor-pointer list-none text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-secondary-foreground">
            Bench
          </summary>
          <div className="mt-2">
            <MirroredLines left={leftBench} right={rightBench} week={week} />
          </div>
        </details>
      )}
      {fetchedAt !== null && (
        <div className="mt-3">
          <AsOfTime fetchedAt={fetchedAt} />
        </div>
      )}
    </div>
  )
}
