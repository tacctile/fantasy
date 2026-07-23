/**
 * Tier-cliff detection (Wave 3b tier-cliff items 1–2): per-position tier
 * boundaries from gap detection over projected points, the draft-day signal
 * that turns replacement-level scarcity into "reach now or wait for the next
 * tier" (league-mechanics/league-size-scarcity-effects — tier breaks are how
 * scarcity becomes actionable; within a tier players are interchangeable,
 * crossing a break is a real step down in value).
 *
 * METHOD (Nick's Clarify 2026-07-22, wiki-grounded): fixed-threshold gap
 * detection — a break sits wherever the point gap between consecutive players
 * exceeds a per-position MULTIPLE of that position's own typical gap. This is
 * one of the two approaches league-size-scarcity-effects.md documents
 * ("...exceeds some multiple of the average gap or the position's standard
 * deviation"); the relative (multiple-of-typical-gap) form is used, not a flat
 * absolute gap, because adp-ecr-differential.md warns a uniform absolute
 * threshold across the board misfires. Within a single position, projected-
 * points gaps and base-VORP gaps are IDENTICAL (base value subtracts one
 * constant replacement line per position), so gaps are read off projected
 * points directly — no separate z-score/normalization step.
 *
 * The typical gap is the MEDIAN consecutive gap (mean fallback when the median
 * is 0 — dense K/DEF tails). Median over mean is a deliberate robustness choice
 * verified on live data: a single dominant elite-separation gap (e.g. the
 * top QB or TE breaking off by 30–40 pts) inflates the mean enough to swallow a
 * position's secondary cliffs, collapsing QB/TE to a single blob; the median is
 * unmoved by that one outlier, so secondary cliffs survive and the shallow
 * positions reach their target tier count.
 *
 * DEPTH SCOPE (Nick's Clarify): only players at/above each position's operative
 * replacement line are tiered ("down to the replacement line"). Tiering the
 * full 200+-deep positional tail manufactures false-precision breaks from noisy
 * projections (league-size-scarcity-effects.md Key Decision — automated tiers
 * are only as good as their inputs). The line per player is the same operative
 * replacementPoints base-value.ts already applied (calibrated ADP window, or the
 * structural fallback) — never re-derived here.
 *
 * TARGET COUNTS (item 2 — a STARTING CALIBRATION, never a hard rule): the
 * per-position multiples below are tuned so typical output lands near ~3–5
 * tiers for shallow QB/TE and ~6–9 for deep RB/WR (the build-file bands). They
 * are NOT adaptive-to-a-target-count: the wiki explicitly rejects rigid numeric
 * tier enforcement and forcing a count would split/merge real cliffs to hit a
 * number (Nick's Clarify — fixed multiple, counts as a sanity check only). The
 * wiki equally declines to endorse any specific numeric threshold
 * (league-size-scarcity-effects.md Key Decision — "will not adopt any single
 * model's specific numeric thresholds"), so these multiples are a declared-
 * silence, live-tuned platform choice, not a wiki-sourced constant.
 *
 * Edge: a position with fewer than three tiered players collapses to a single
 * tier — a relative-gap method has no other gaps to judge a lone gap against,
 * so it cannot flag a break from one gap alone. Harmless in practice: the
 * down-to-replacement scope gives real positions 10–40+ tiered players, and a
 * position drained to 1–2 remaining startables reading as "one tier, N left"
 * is the honest signal anyway.
 *
 * Pure and deterministic (projected points desc, sleeper_player_id asc), same
 * posture as the rest of bpa/: the caller hands over the already-ranked pool
 * and this recomputes from scratch — no cache — which is what lets board.ts
 * recompute tiers against the shrinking undrafted pool after every pick
 * (tier-cliff item 3). Tier structure is dynamic, not a pre-draft snapshot
 * (league-size-scarcity-effects.md — static tier sheets are a documented
 * failure pattern).
 */
import type { BaseValuePlayer } from './base-value'

export type PositionTier = {
  /** 1-based tier rank within the position; tier 1 is the highest-value tier
   *  (and, since the pool is the undrafted set, the best still-available tier). */
  tier: number
  /** Player ids in this tier, projected points desc (id asc tie-break). */
  playerIds: string[]
  size: number
  /** Projected points of the best player in the tier. */
  topProjection: number
  /** Projected points of the last player in the tier. */
  bottomProjection: number
}

export type PositionTierStructure = {
  position: string
  /** Tiers in value order (tier 1 first). */
  tiers: PositionTier[]
  /** sleeper_player_id → its tier number, for tiered (at/above-replacement)
   *  players only. Players below the replacement line are absent (untiered). */
  tierByPlayerId: Record<string, number>
  /** Players included in tiering (those at/above the replacement line). */
  tieredCount: number
  /** The typical consecutive projected-points gap over the tiered range — the
   *  break baseline (median, or mean when the median is 0). 0 when fewer than
   *  two players are tiered. */
  baselineGap: number
  /** The operative break threshold applied (thresholdMultiple × baselineGap). */
  gapThreshold: number
  /** Per-position multiple applied (item 2 calibration). */
  thresholdMultiple: number
}

export type TierBoard = {
  /** Keyed by position — present only for positions with at least one
   *  at/above-replacement (tierable) player. */
  byPosition: Record<string, PositionTierStructure>
}

/**
 * Per-position break multiples (tier-cliff item 2 calibration; declared-silence
 * platform choice, live-tuned to the build-file target bands on the real 2026
 * projection pool). A break is flagged where a gap exceeds
 * `multiple × medianGap`.
 *
 * Deep positions (RB/WR) carry the HIGHER multiple and shallow positions
 * (QB/TE) the LOWER one. This looks inverted next to the build-file's "tighter
 * for RB/WR" wording but is the same intent expressed against a median
 * baseline: RB/WR have a dense near-replacement tail (a tiny median gap), so a
 * higher multiple is required to stop that tail fragmenting into dozens of
 * noise tiers, while the resulting ABSOLUTE point threshold (multiple × tiny
 * median) stays SMALLER than QB/TE's — i.e. RB/WR still break on smaller point
 * gaps, which is the "tighter" positional sensitivity the build file intends.
 * These land ~8 tiers for RB/WR and ~3–4 for QB/TE on live data; the target
 * counts are a sanity check, never enforced (Nick's Clarify; the wiki rejects
 * rigid tier-count enforcement). K/DEF are not in the build-file target bands
 * and carry a moderate multiple; any position absent here uses the default.
 */
export const TIER_GAP_MULTIPLE: Record<string, number> = {
  RB: 3.0,
  WR: 3.2,
  QB: 2.0,
  TE: 1.5,
  K: 2.0,
  DEF: 2.0,
}

/** Fallback multiple for any position not in TIER_GAP_MULTIPLE. */
export const DEFAULT_TIER_GAP_MULTIPLE = 2.5

/**
 * Compute per-position tier structure from a base-value ranked pool.
 *
 * `players` is base-value.ts output (rankable players only — unstartable
 * positions already excluded). Each player carries the operative
 * `replacementPoints` for its position, so the down-to-replacement depth scope
 * is applied per player without re-deriving levels. Same pool board.ts passes
 * everywhere else — pass the UNDRAFTED set for a live board and tiers recompute
 * against the shrinking pool by construction.
 */
export function computePositionTiers(
  players: readonly BaseValuePlayer[]
): TierBoard {
  // Group at/above-replacement players by position (the tierable depth scope).
  const byPositionPlayers = new Map<string, BaseValuePlayer[]>()
  for (const player of players) {
    if (!Number.isFinite(player.projectedPoints)) continue
    // Down to the replacement line only — the startable range where a tier
    // break is decision-relevant.
    if (player.projectedPoints < player.replacementPoints) continue
    const list = byPositionPlayers.get(player.position)
    if (list === undefined) byPositionPlayers.set(player.position, [player])
    else list.push(player)
  }

  const byPosition: Record<string, PositionTierStructure> = {}
  for (const [position, list] of byPositionPlayers) {
    list.sort(
      (a, b) =>
        b.projectedPoints - a.projectedPoints ||
        (a.sleeperPlayerId < b.sleeperPlayerId ? -1 : a.sleeperPlayerId > b.sleeperPlayerId ? 1 : 0)
    )

    const multiple = TIER_GAP_MULTIPLE[position] ?? DEFAULT_TIER_GAP_MULTIPLE

    // Consecutive projected-points gaps; baseline = median (robust to a single
    // dominant elite-separation gap), falling back to the mean only when the
    // median is 0 (a tail dense with zero-gaps, e.g. K/DEF).
    const gaps: number[] = []
    for (let i = 0; i < list.length - 1; i += 1) {
      gaps.push(list[i].projectedPoints - list[i + 1].projectedPoints)
    }
    const baselineGap = medianOrMean(gaps)
    const gapThreshold = multiple * baselineGap

    // Walk the sorted list, opening a new tier whenever the gap into the next
    // player exceeds the threshold (and is a real positive gap).
    const tiers: PositionTier[] = []
    const tierByPlayerId: Record<string, number> = {}
    let currentTier: BaseValuePlayer[] = []
    const flush = (): void => {
      if (currentTier.length === 0) return
      const tierNumber = tiers.length + 1
      const playerIds = currentTier.map((p) => p.sleeperPlayerId)
      for (const id of playerIds) tierByPlayerId[id] = tierNumber
      tiers.push({
        tier: tierNumber,
        playerIds,
        size: currentTier.length,
        topProjection: currentTier[0].projectedPoints,
        bottomProjection: currentTier[currentTier.length - 1].projectedPoints,
      })
      currentTier = []
    }

    for (let i = 0; i < list.length; i += 1) {
      currentTier.push(list[i])
      const gapToNext = i < list.length - 1 ? list[i].projectedPoints - list[i + 1].projectedPoints : 0
      if (gapToNext > gapThreshold && gapToNext > 0) flush()
    }
    flush()

    byPosition[position] = {
      position,
      tiers,
      tierByPlayerId,
      tieredCount: list.length,
      baselineGap,
      gapThreshold,
      thresholdMultiple: multiple,
    }
  }

  return { byPosition }
}

/** Median of the gaps; mean when the median is 0 (dense zero-gap tails); 0 for
 *  an empty list. Keeps the break threshold from collapsing to 0 (which would
 *  make every positive gap a break) when at least half the gaps are equal. */
function medianOrMean(gaps: number[]): number {
  if (gaps.length === 0) return 0
  const sorted = [...gaps].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  if (median > 0) return median
  return gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
}

/** Compact per-position summary for the board UI (tier-cliff item 4 consumes
 *  this; surfaced by the recommendations query in item 3). `topTierSize` is the
 *  headline "N remaining in this tier" — the size of the best still-available
 *  tier, since the pool is the undrafted set. */
export type PositionTierSummary = {
  position: string
  tierCount: number
  /** Players remaining in the best available tier (tier 1). */
  topTierSize: number
  /** Projected points of the top player in the best available tier. */
  topTierTopProjection: number
}

/** Derive the per-position summaries the board counter renders. */
export function summarizeTiers(board: TierBoard): Record<string, PositionTierSummary> {
  const summaries: Record<string, PositionTierSummary> = {}
  for (const [position, structure] of Object.entries(board.byPosition)) {
    const topTier = structure.tiers[0]
    summaries[position] = {
      position,
      tierCount: structure.tiers.length,
      topTierSize: topTier?.size ?? 0,
      topTierTopProjection: topTier?.topProjection ?? 0,
    }
  }
  return summaries
}
