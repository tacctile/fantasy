import type { DraftBoardPlayer } from '@/services/draft-board'
import type { RecordedPick } from '@/services/draft-picks'
import type { DraftOrderMeta } from '@/services/sleeper/draft-state'

/**
 * Client-side live-sync merge layer (Wave 3b, client-side live sync item 2):
 * pure functions overlaying a league's draft_state snapshot onto the Wave 3a
 * board pool. No state, no side effects — the shell owns the memo; tests can
 * call these directly.
 *
 * Precedence (disclosed judgment call, 2026-07-22): 'rostered' wins over the
 * drafted overlay. roster_players attribution is richer (team/owner names)
 * and post-draft authoritative — during a live draft rosters aren't synced
 * yet, so the overlay IS the live signal; once the roster sync catches up,
 * rows graduate from 'drafted' back to 'rostered' with full attribution.
 *
 * A pick referencing a player outside the board pool is skipped (Nick-signed
 * 2026-07-22): pool membership stays the data layer's Wave 3a rule (ADP ∪
 * rostered); the recent-picks feed (later 03b item) surfaces every pick
 * regardless of pool membership.
 */

/**
 * Canonical order-insensitive identity of a snapshot — the dedup key that
 * keeps repeated identical snapshots from causing state updates (and thus
 * re-renders). Includes source so a first-write-wins outcome swap at the same
 * pick number (can't happen today — rows are immutable — but cheap honesty)
 * still reads as a change.
 */
export function picksFingerprint(picks: RecordedPick[]): string {
  return picks
    .map(
      (pick) =>
        `${pick.pickNumber}:${pick.sleeperPlayerId}:${pick.nativeRosterId}:${pick.source}`
    )
    .sort()
    .join('|')
}

/**
 * Overlay the snapshot onto the board pool by pick identity: an
 * otherwise-available player with a draft_state row becomes 'drafted'
 * carrying its winning pick_number. A player in `pendingPlayerIds` (an
 * optimistic manual pick awaiting its server response — Wave 3b client-side
 * live sync item 3) also reads 'drafted', with `draftPending` true and no
 * pick number until a confirmed row exists; a snapshot row for the same
 * player always wins over the pending marker. Returns the input array
 * UNCHANGED (same reference) when no row differs, so downstream memos stay
 * stable; changed rows are new objects, untouched rows keep their identity.
 */
export function mergePicksIntoPlayers(
  players: DraftBoardPlayer[],
  picks: RecordedPick[],
  pendingPlayerIds?: ReadonlySet<string>
): DraftBoardPlayer[] {
  const pickByPlayerId = new Map<string, RecordedPick>()
  for (const pick of picks) {
    // Duplicate players across pick numbers can't be written by our paths
    // (server-side duplicate rejection); if one ever appears, the earliest
    // pick number wins deterministically.
    const existing = pickByPlayerId.get(pick.sleeperPlayerId)
    if (existing === undefined || pick.pickNumber < existing.pickNumber) {
      pickByPlayerId.set(pick.sleeperPlayerId, pick)
    }
  }

  let changed = false
  const merged = players.map((player) => {
    const rostered = player.availability === 'rostered'
    const pick = rostered ? undefined : pickByPlayerId.get(player.sleeperPlayerId)
    const pending =
      !rostered &&
      pick === undefined &&
      (pendingPlayerIds?.has(player.sleeperPlayerId) ?? false)
    const shouldBeDrafted = pick !== undefined || pending
    const isDrafted = player.availability === 'drafted'
    if (
      shouldBeDrafted === isDrafted &&
      (pick?.pickNumber ?? null) === player.draftedPickNumber &&
      pending === player.draftPending
    ) {
      return player
    }
    changed = true
    return shouldBeDrafted
      ? {
          ...player,
          availability: 'drafted' as const,
          draftedPickNumber: pick?.pickNumber ?? null,
          draftPending: pending,
        }
      : // Row healed (e.g. the pick was undone, or an optimistic pick rolled
        // back) — back to the server-derived availability, which is
        // 'available' here ('rostered' never enters).
        {
          ...player,
          availability: 'available' as const,
          draftedPickNumber: null,
          draftPending: false,
        }
  })
  return changed ? merged : players
}

/**
 * The next manual pick number: one past the highest pick anywhere in the
 * recorded snapshot or the optimistic pending overlay (Nick-signed default:
 * "the UI defaults to the next pick"). max+1 rather than count+1 — earlier
 * gaps stay backfillable by hand and a fresh optimistic pick can never
 * collide below the current high-water mark. The server's first-write-wins
 * constraint remains the real arbiter if a poll lands between compute and
 * insert.
 */
export function computeNextPickNumber(
  picks: RecordedPick[],
  pendingPickNumbers: Iterable<number>
): number {
  let highest = 0
  for (const pick of picks) {
    if (pick.pickNumber > highest) highest = pick.pickNumber
  }
  for (const pickNumber of pendingPickNumbers) {
    if (pickNumber > highest) highest = pickNumber
  }
  return highest + 1
}

/** Who the next pick belongs to — or an honest reason we can't say. */
export type OnClockProjection =
  | { kind: 'team'; nativeRosterId: number }
  /** Every scheduled pick is recorded (`rounds × slots` known and exceeded). */
  | { kind: 'complete' }
  /** No order metadata, unusable map, or a non-slot-ordered type (auction's
   *  pick order is nomination order — never slot math). */
  | { kind: 'unknown' }

/**
 * Project the team on the clock for `pickNumber` from the draft's order
 * metadata (Wave 3b UI item 2 — Nick-signed correctness amendment: order
 * comes from the selected draft object via the poll path, not league_config).
 *
 * This is a PROJECTION (Nick-signed 2026-07-22): recorded picks stay ground
 * truth per the draft-endpoint page; keepers and in-draft pick trades can
 * shift reality away from slot math and Sleeper exposes no on-clock field.
 * `reversal_round` handling is a declared interpretation of the wiki's
 * "flips snake order again partway through": rounds ≥ reversal_round invert
 * the plain-snake direction (reproduces standard third-round reversal).
 * `linear` repeats slot order every round (declared: the complement of
 * snake's alternating order — wiki gives no explicit linear definition).
 */
export function projectOnClock(
  pickNumber: number,
  order: DraftOrderMeta | null
): OnClockProjection {
  if (order === null || order.slotToRosterId === null) {
    return { kind: 'unknown' }
  }
  const slotCount = Object.keys(order.slotToRosterId).length
  if (slotCount === 0) return { kind: 'unknown' }
  // The map must cover slots 1..N exactly — a partial map would silently
  // misproject (wrong slotCount shifts every round boundary), so it reads
  // unknown instead.
  for (let slot = 1; slot <= slotCount; slot++) {
    if (!(String(slot) in order.slotToRosterId)) return { kind: 'unknown' }
  }
  if (order.rounds !== null && pickNumber > order.rounds * slotCount) {
    return { kind: 'complete' }
  }
  if (order.type !== 'snake' && order.type !== 'linear') {
    return { kind: 'unknown' }
  }
  const round = Math.ceil(pickNumber / slotCount)
  const indexInRound = pickNumber - (round - 1) * slotCount
  let ascending = order.type === 'linear' || round % 2 === 1
  if (
    order.type === 'snake' &&
    order.reversalRound !== null &&
    round >= order.reversalRound
  ) {
    ascending = !ascending
  }
  const slot = ascending ? indexInRound : slotCount - indexInRound + 1
  const nativeRosterId = order.slotToRosterId[String(slot)]
  return typeof nativeRosterId === 'number'
    ? { kind: 'team', nativeRosterId }
    : { kind: 'unknown' }
}
