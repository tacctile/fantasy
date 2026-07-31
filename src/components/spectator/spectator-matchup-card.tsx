import { cn } from '@/lib/utils'
import type { MatchupPlayerScore, MatchupSide } from '@/services/dashboard'

import SpectatorAsOfTime from './spectator-as-of-time'
import SpectatorUnofficialChip from './spectator-unofficial-chip'

interface SpectatorMatchupCardProps {
  /** Two sides for a head-to-head pair; one side renders the bye/no-opponent
   *  card (the service's unpaired rows — byes and anomaly fallout alike). */
  sides: [MatchupSide] | [MatchupSide, MatchupSide]
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

function sideLabel(side: MatchupSide): string {
  return (
    side.teamName ?? side.ownerDisplayName ?? `Roster ${side.nativeRosterId}`
  )
}

/**
 * One team's header block, mirrored via `align` so the two big totals sit on
 * the card's outer edges — the score read a phone glance is actually after.
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
      <span className="block truncate text-xs font-semibold">
        {sideLabel(side)}
      </span>
      <span
        className={cn(
          'mt-0.5 flex items-center gap-1.5',
          right && 'flex-row-reverse'
        )}
      >
        <span className="text-xl font-extrabold tabular-nums">
          {formatPoints(side.effectivePoints)}
        </span>
        <SpectatorUnofficialChip isFinal={side.isFinal} />
      </span>
    </div>
  )
}

/**
 * One starter line. Points sit toward the card's center gutter so the two
 * score columns read straight down next to each other — the head-to-head
 * comparison a leaguemate opens the link for — with names on the outer edges
 * where truncation costs the least. The name is a plain anchor to
 * `?player=<id>`: full-page navigation, no client router, no admin UI.
 */
function StarterLine({
  line,
  align,
}: {
  line: MatchupPlayerScore
  align: 'left' | 'right'
}) {
  const right = align === 'right'
  return (
    <span
      className={cn(
        'flex min-w-0 items-baseline gap-2',
        right && 'flex-row-reverse'
      )}
    >
      <span className="min-w-0 flex-1 truncate">
        <a href={`?player=${line.sleeperPlayerId}`} className="text-xs hover:underline">
          {line.fullName ?? line.sleeperPlayerId}
        </a>
      </span>
      <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-right">
        {line.points.toFixed(2)}
      </span>
    </span>
  )
}

/**
 * Mirrored starter rows, index-paired. Slot-by-slot pairing is deliberately
 * absent for the same reason as the admin card: historical `player_scores`
 * carry `was_starter` only — no per-week slot attribution exists in any synced
 * payload — so rows follow the service's ordering rather than a guessed slot.
 */
function MirroredStarters({
  left,
  right,
}: {
  left: MatchupPlayerScore[]
  right: MatchupPlayerScore[]
}) {
  const rowCount = Math.max(left.length, right.length)
  if (rowCount === 0) return null
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: rowCount }, (_, index) => (
        <div key={index} className="grid grid-cols-2 items-baseline gap-x-3">
          {left[index] !== undefined ? (
            <StarterLine line={left[index]} align="left" />
          ) : (
            <span />
          )}
          {right[index] !== undefined ? (
            <StarterLine line={right[index]} align="right" />
          ) : (
            <span />
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Spectator matchup card (mobile-first): mirrored team headers with the
 * totals on the outer edges, starters mirrored beneath, and the as-of caption
 * from the freshest side. Bench lines are omitted entirely (Nick's Clarify) —
 * the spectator surface is glanceable, not the admin card's full-roster view.
 * A single-side card is the honest bye/no-opponent rendering, muted and
 * deliberately uncolored (DESIGN_SYSTEM.md: absence of color = absence of
 * urgency).
 */
export default function SpectatorMatchupCard({
  sides,
}: SpectatorMatchupCardProps) {
  const [left, right] = sides
  const fetchedAt = latestFetchedAt(sides)

  if (right === undefined) {
    return (
      <div className="rounded-xl bg-card p-3">
        <div className="flex items-start justify-between gap-3">
          <SideHeader side={left} align="left" />
          <span className="text-xs text-muted-foreground">No opponent</span>
        </div>
        {fetchedAt !== null && (
          <div className="mt-2">
            <SpectatorAsOfTime fetchedAt={fetchedAt} />
          </div>
        )}
      </div>
    )
  }

  const leftStarters = left.playerScores.filter((line) => line.wasStarter)
  const rightStarters = right.playerScores.filter((line) => line.wasStarter)

  return (
    <div className="rounded-xl bg-card p-3">
      <div className="grid grid-cols-2 items-start gap-x-3">
        <SideHeader side={left} align="left" />
        <SideHeader side={right} align="right" />
      </div>
      <div className="mt-2 border-t border-border/50 pt-2">
        <MirroredStarters left={leftStarters} right={rightStarters} />
      </div>
      {fetchedAt !== null && (
        <div className="mt-2">
          <SpectatorAsOfTime fetchedAt={fetchedAt} />
        </div>
      )}
    </div>
  )
}
