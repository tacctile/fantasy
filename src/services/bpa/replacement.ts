/**
 * Replacement-level calculation (Wave 3b BPA item 1): the projected points of
 * the last startable player at each position, derived purely from the
 * league's actual roster shape — no hardcoded roster assumptions, no fixed
 * replacement ranks (wiki/topics/league-mechanics/roster-construction-
 * starting-lineups.md explicitly rejects fixed-rank formulas).
 *
 * Mechanism (Nick-signed 2026-07-22, resolving value-based-drafting.md's
 * open flex-pooling question): a greedy league-wide fill simulation —
 * dedicated starter slots consume each position's top projected players
 * (demand = slots × league size), then flex slots consume the best remaining
 * projected players across each slot's eligible positions. Replacement level
 * per position = the last (lowest-projected) player consumed there. Flex
 * pooling is therefore structural, never an independent per-position
 * baseline (the corroborated VBD mispricing source per value-based-drafting
 * and flex-spot-configuration Key Decisions); superflex falls out naturally
 * as QB competing for the QB-eligible slot (flex-spot-configuration: a de
 * facto second QB slot).
 *
 * Scope (Nick-signed): startable-only demand — starters + flex, no bench
 * term. Market-observed depth (which is where bench demand empirically
 * shows up) enters via the separate ADP calibration (BPA item 2), not an
 * invented bench-hoarding formula.
 *
 * Pure and deterministic: same inputs → same output (points desc,
 * sleeper_player_id asc tie-break throughout). The caller supplies the pool
 * (already league-scored via scoring.ts) and the layout (parsed by THE one
 * layout parser, parseRosterSlotLayout in services/draft-board.ts) — this
 * module reads nothing itself, which is what lets BPA item 4 recompute it
 * against the shrinking undrafted pool after every pick.
 */
import type { RosterSlotLayout } from '@/services/draft-board'

/** One pool member: catalog primary position (players.position — the
 *  canonical identity source; multi-position eligibility deliberately not
 *  modeled in v1, a disclosed judgment call on value-over-replacement.md's
 *  open question) plus league-scored projected points. */
export type ReplacementPoolPlayer = {
  sleeperPlayerId: string
  position: string
  projectedPoints: number
}

export type PositionReplacementLevel = {
  position: string
  /** Projected points of the last startable player consumed at this
   *  position. 0 when the pool exhausted before demand was met (replacement
   *  is freely available nothing — an honest floor, never a guess). */
  replacementPoints: number
  /** League-wide startable players actually consumed here (dedicated fills
   *  + flex wins). */
  startableCount: number
  /** Dedicated-slot demand for this position (slots × league size). */
  dedicatedSlotDemand: number
  /** Flex slots this position won in the greedy fill. */
  flexWinCount: number
  /** True when dedicated demand exceeded the position's pool. */
  poolExhausted: boolean
}

export type ReplacementLevels = {
  /** Keyed by position. A position appears only if the layout demands it
   *  (dedicated slots) or it won at least one flex slot — positions the
   *  league cannot start carry no replacement level by design (consumers
   *  treat them as unrankable, not zero-baseline). */
  byPosition: Record<string, PositionReplacementLevel>
  /** Flex-family labels with no known eligibility mapping — excluded from
   *  demand and surfaced honestly (declared wiki silence on non-standard
   *  Sleeper flex labels; never a guessed eligibility). */
  unknownFlexLabels: string[]
  /** Total startable demand modeled (dedicated + known-flex slots). */
  totalStartableSlots: number
  /** Known-flex slots left unfilled because every eligible pool emptied. */
  unfilledFlexSlots: number
}

/**
 * Flex-label eligibility. FLEX (RB/WR/TE) and SUPER_FLEX (+QB) are grounded
 * in flex-spot-configuration.md's standard-flex and QB-eligible-flex
 * semantics; REC_FLEX/WRRB_FLEX/IDP_FLEX are general-knowledge Sleeper
 * conventions under declared wiki silence (2026-07-22 session log). Any
 * flex-family label absent here is excluded from demand and reported via
 * `unknownFlexLabels` — honest degradation over invented eligibility.
 */
const FLEX_ELIGIBILITY: Record<string, readonly string[]> = {
  FLEX: ['RB', 'WR', 'TE'],
  SUPER_FLEX: ['QB', 'RB', 'WR', 'TE'],
  REC_FLEX: ['WR', 'TE'],
  WRRB_FLEX: ['RB', 'WR'],
  IDP_FLEX: ['DL', 'LB', 'DB'],
}

type PositionTally = {
  consumedCount: number
  dedicatedDemand: number
  flexWins: number
  lastConsumedPoints: number | null
  dedicatedExhausted: boolean
}

/**
 * Run the greedy fill and return per-position replacement levels.
 *
 * The pool is typically the undrafted player set (item 4 recomputes on every
 * pick), but the function is agnostic — it models whatever pool it is given.
 * Members with a non-finite projection are ignored defensively.
 */
export function computeReplacementLevels(
  pool: readonly ReplacementPoolPlayer[],
  layout: RosterSlotLayout,
  leagueSize: number
): ReplacementLevels {
  if (!Number.isInteger(leagueSize) || leagueSize < 1) {
    throw new Error(`computeReplacementLevels: leagueSize must be a positive integer, got ${String(leagueSize)}`)
  }

  // Per-position lists, points desc, sleeper_player_id asc tie-break; a head
  // index per list makes consumption O(1).
  const listsByPosition = new Map<string, ReplacementPoolPlayer[]>()
  for (const player of pool) {
    if (!Number.isFinite(player.projectedPoints)) continue
    const list = listsByPosition.get(player.position)
    if (list === undefined) listsByPosition.set(player.position, [player])
    else list.push(player)
  }
  for (const list of listsByPosition.values()) {
    list.sort(
      (a, b) =>
        b.projectedPoints - a.projectedPoints ||
        (a.sleeperPlayerId < b.sleeperPlayerId ? -1 : a.sleeperPlayerId > b.sleeperPlayerId ? 1 : 0)
    )
  }
  const heads = new Map<string, number>()

  const tallies = new Map<string, PositionTally>()
  const tally = (position: string): PositionTally => {
    let entry = tallies.get(position)
    if (entry === undefined) {
      entry = {
        consumedCount: 0,
        dedicatedDemand: 0,
        flexWins: 0,
        lastConsumedPoints: null,
        dedicatedExhausted: false,
      }
      tallies.set(position, entry)
    }
    return entry
  }

  const peek = (position: string): ReplacementPoolPlayer | null => {
    const list = listsByPosition.get(position)
    if (list === undefined) return null
    const head = heads.get(position) ?? 0
    return head < list.length ? list[head] : null
  }
  const consume = (position: string): ReplacementPoolPlayer | null => {
    const player = peek(position)
    if (player === null) return null
    heads.set(position, (heads.get(position) ?? 0) + 1)
    const entry = tally(position)
    entry.consumedCount += 1
    entry.lastConsumedPoints = player.projectedPoints
    return player
  }

  let totalStartableSlots = 0

  // Dedicated starter slots first: demand = slots × league size per label.
  // Labels sort for deterministic iteration (layout key order is
  // parse-dependent); ordering cannot change the outcome here since
  // dedicated fills never compete across positions.
  for (const label of Object.keys(layout.dedicated).sort()) {
    const demand = layout.dedicated[label] * leagueSize
    if (demand <= 0) continue
    totalStartableSlots += demand
    const entry = tally(label)
    entry.dedicatedDemand += demand
    for (let i = 0; i < demand; i += 1) {
      if (consume(label) === null) {
        entry.dedicatedExhausted = true
        break
      }
    }
  }

  // Flex slots second, narrowest eligibility first (tie: label asc) — a
  // disclosed judgment call: filling REC_FLEX before FLEX before SUPER_FLEX
  // stops broad slots from starving narrow ones in the simulation.
  const knownFlex: Array<{ label: string; eligible: readonly string[]; slots: number }> = []
  const unknownFlexLabels: string[] = []
  for (const label of Object.keys(layout.flex).sort()) {
    const eligible = FLEX_ELIGIBILITY[label]
    if (eligible === undefined) {
      unknownFlexLabels.push(label)
      continue
    }
    knownFlex.push({ label, eligible, slots: layout.flex[label] * leagueSize })
  }
  knownFlex.sort(
    (a, b) => a.eligible.length - b.eligible.length || (a.label < b.label ? -1 : 1)
  )

  let unfilledFlexSlots = 0
  for (const { eligible, slots } of knownFlex) {
    totalStartableSlots += slots
    for (let i = 0; i < slots; i += 1) {
      let best: ReplacementPoolPlayer | null = null
      let bestPosition: string | null = null
      for (const position of eligible) {
        const candidate = peek(position)
        if (candidate === null) continue
        if (
          best === null ||
          candidate.projectedPoints > best.projectedPoints ||
          (candidate.projectedPoints === best.projectedPoints &&
            candidate.sleeperPlayerId < best.sleeperPlayerId)
        ) {
          best = candidate
          bestPosition = position
        }
      }
      if (best === null || bestPosition === null) {
        unfilledFlexSlots += slots - i
        break
      }
      consume(bestPosition)
      tally(bestPosition).flexWins += 1
    }
  }

  const byPosition: Record<string, PositionReplacementLevel> = {}
  for (const [position, entry] of tallies) {
    if (entry.consumedCount === 0 && entry.dedicatedDemand === 0) continue
    byPosition[position] = {
      position,
      replacementPoints: entry.dedicatedExhausted ? 0 : (entry.lastConsumedPoints ?? 0),
      startableCount: entry.consumedCount,
      dedicatedSlotDemand: entry.dedicatedDemand,
      flexWinCount: entry.flexWins,
      poolExhausted: entry.dedicatedExhausted,
    }
  }

  return { byPosition, unknownFlexLabels, totalStartableSlots, unfilledFlexSlots }
}
