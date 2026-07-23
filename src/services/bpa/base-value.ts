/**
 * Base value / VORP (Wave 3b BPA item 3): `player_projection −
 * replacement_projection` for each player in the supplied (undrafted) pool —
 * the cross-positional currency the recommendation ranking sorts by
 * (player-evaluation/value-over-replacement, the formal definition;
 * league-mechanics/value-based-drafting).
 *
 * The league's scoring weights are applied upstream by scoring.ts (THE one
 * projection-scoring home — no hardcoded weights anywhere), and the
 * replacement line is item 2's calibrated level (ADP-window depth with
 * structural fallback, Nick-signed) — this module is only the subtraction
 * plus honest handling of the edges:
 *
 * - Players at positions the league cannot start (no replacement level —
 *   e.g. K in a K-less layout, or P/FB rows in the projections pool) are
 *   excluded from the ranked output and surfaced by count + position list.
 *   They are unrankable, not zero-baseline (replacement.ts design).
 * - Negative base values are kept: a below-replacement player is meaningful
 *   data (the zero-VORP trap cuts the other way — see the wiki page), and
 *   item 6's top-N query simply never reaches them.
 *
 * Pure and deterministic (baseValue desc → projectedPoints desc →
 * sleeper_player_id asc): item 4 recomputes this against the shrinking pool
 * after every pick, so same-input stability is load-bearing.
 */
import type { CalibratedReplacementLevels } from './calibration'
import type { ReplacementPoolPlayer } from './replacement'

export type BaseValuePlayer = {
  sleeperPlayerId: string
  position: string
  /** League-scored projection (scoring.ts output, carried through). */
  projectedPoints: number
  /** The operative replacement line applied (calibrated or fallback). */
  replacementPoints: number
  /** projectedPoints − replacementPoints. Negative = below replacement. */
  baseValue: number
  /** Which line priced this player ('adp' calibrated / 'structural'). */
  replacementSource: 'adp' | 'structural'
}

export type BaseValueResult = {
  /** Rankable players, baseValue desc (deterministic tie-breaks). */
  players: BaseValuePlayer[]
  /** Pool members excluded because their position has no replacement level
   *  (the league cannot start them) — surfaced, never silently dropped. */
  unrankableCount: number
  /** Distinct excluded positions, sorted, for honest display. */
  unrankablePositions: string[]
}

/** Compute base values for a pool against the league's replacement levels. */
export function computeBaseValues(
  pool: readonly ReplacementPoolPlayer[],
  levels: CalibratedReplacementLevels
): BaseValueResult {
  const players: BaseValuePlayer[] = []
  let unrankableCount = 0
  const unrankablePositions = new Set<string>()

  for (const player of pool) {
    if (!Number.isFinite(player.projectedPoints)) continue
    const level = levels.byPosition[player.position]
    if (level === undefined) {
      unrankableCount += 1
      unrankablePositions.add(player.position)
      continue
    }
    players.push({
      sleeperPlayerId: player.sleeperPlayerId,
      position: player.position,
      projectedPoints: player.projectedPoints,
      replacementPoints: level.replacementPoints,
      baseValue: player.projectedPoints - level.replacementPoints,
      replacementSource: level.source,
    })
  }

  players.sort(
    (a, b) =>
      b.baseValue - a.baseValue ||
      b.projectedPoints - a.projectedPoints ||
      (a.sleeperPlayerId < b.sleeperPlayerId ? -1 : a.sleeperPlayerId > b.sleeperPlayerId ? 1 : 0)
  )

  return {
    players,
    unrankableCount,
    unrankablePositions: [...unrankablePositions].sort(),
  }
}
