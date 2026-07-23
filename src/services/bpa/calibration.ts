/**
 * ADP calibration of replacement depth (Wave 3b BPA item 2): market ADP —
 * not a fixed structural round-count — decides how DEEP each position's
 * replacement line sits, avoiding classic VBD's overvaluation of QB/TE
 * (whose structural last-starter baselines sit shallower than the market
 * actually drafts the position).
 *
 * Mechanism (Nick-signed 2026-07-22): for each startable position p,
 * calibrated depth = the number of position-p players the market drafts
 * inside the league's startable window (adp_overall ≤ the structural
 * totalStartableSlots from item 1's fill). The replacement player is that
 * depth-th player by PROJECTION order — ADP chooses how deep the line sits
 * (market's revealed positional preference); projections choose its value.
 * ADP is a market price and availability signal only, never a valuation
 * (league-mechanics/average-draft-position Key Decisions).
 *
 * The calibrated level REPLACES the structural one when computable (item
 * text: "rather than a fixed round-count baseline" — Nick-signed); the
 * structural level is the honest fallback, and both are always carried in
 * the result so the recommendations surface can show its work (separated,
 * inspectable signals — the sub-section's hard design constraint).
 *
 * Fallbacks (Nick-signed, all flagged, never silent):
 * - League-level: an unresolved scoring format or empty format snapshot →
 *   structural levels throughout (`calibration: 'structural_only'`). Never a
 *   cross-format fallback — a format with no rows is an explicit absence,
 *   not another format's numbers (the classic format-leakage ADP error).
 * - Position-level: zero in-window ADP carriers (thin K/DEF markets) → that
 *   position keeps its structural depth — never a zero-depth line that would
 *   price every player at a league-startable position as worthless (thin
 *   late-market ADP is increasingly unreliable, per the ADP page).
 *
 * Pure and deterministic, same posture as replacement.ts: the caller
 * supplies the scored pool, the structural result, and the format-resolved
 * sentinel-filtered ADP carriers (from adp_rankings — NEVER from
 * player_projections.stats, whose raw adp_* fields retain 999.0 sentinels).
 */
import type { ReplacementLevels, ReplacementPoolPlayer } from './replacement'

/** One format-matched ADP carrier: catalog primary position (the same
 *  grouping key as the pool) plus the sentinel-filtered overall ADP. */
export type AdpCalibrationPlayer = {
  sleeperPlayerId: string
  position: string
  adpOverall: number
}

export type CalibratedPositionLevel = {
  position: string
  /** The operative replacement line for this position. */
  replacementPoints: number
  /** Startable depth the line sits at (players consumed above it). */
  depth: number
  /** 'adp' when the market window calibrated this position; 'structural'
   *  when it fell back to item 1's greedy-fill level. */
  source: 'adp' | 'structural'
  /** Position-p players the market drafts inside the startable window.
   *  Null only in a structural_only run (no usable ADP at all). */
  adpCarriersInWindow: number | null
  /** Item 1's structural level, always carried for visible reasoning. */
  structuralReplacementPoints: number
  structuralDepth: number
  /** True when calibrated depth exceeded the projection pool at this
   *  position — replacementPoints floors at 0 (replacement.ts convention). */
  poolExhausted: boolean
}

export type CalibratedReplacementLevels = {
  /** Keyed by position — exactly the structural result's position set (the
   *  league's startable positions; ADP carriers at unstartable positions
   *  are ignored, the league cannot start them). */
  byPosition: Record<string, CalibratedPositionLevel>
  /** 'adp' when at least the league-level calibration ran; 'structural_only'
   *  when no usable ADP existed (unresolved format / empty snapshot). */
  calibration: 'adp' | 'structural_only'
  /** The market window used: item 1's total startable demand. */
  startableWindow: number
}

/**
 * Calibrate item 1's structural levels against market ADP.
 *
 * Pass `adp: null` when the league has no usable format-matched snapshot
 * (unresolved format or zero rows) — the result degrades to structural
 * levels with the league-level flag set. An empty array means the same.
 */
export function calibrateReplacementLevels(
  structural: ReplacementLevels,
  pool: readonly ReplacementPoolPlayer[],
  adp: readonly AdpCalibrationPlayer[] | null
): CalibratedReplacementLevels {
  const window = structural.totalStartableSlots
  const usableAdp = adp !== null && adp.length > 0

  // In-window carrier counts per position (sentinel filtering already
  // happened at the adp_rankings read path — values here are real ADPs).
  const carriersByPosition = new Map<string, number>()
  if (usableAdp) {
    for (const carrier of adp) {
      if (!Number.isFinite(carrier.adpOverall) || carrier.adpOverall > window) continue
      carriersByPosition.set(
        carrier.position,
        (carriersByPosition.get(carrier.position) ?? 0) + 1
      )
    }
  }

  // Projection-ordered lists per startable position (points desc,
  // sleeper_player_id asc — the module-wide deterministic ordering).
  const listsByPosition = new Map<string, ReplacementPoolPlayer[]>()
  for (const player of pool) {
    if (!Number.isFinite(player.projectedPoints)) continue
    if (!(player.position in structural.byPosition)) continue
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

  const byPosition: Record<string, CalibratedPositionLevel> = {}
  for (const structuralLevel of Object.values(structural.byPosition)) {
    const position = structuralLevel.position
    const carriers = usableAdp ? (carriersByPosition.get(position) ?? 0) : null
    const calibrated = carriers !== null && carriers > 0

    if (!calibrated) {
      byPosition[position] = {
        position,
        replacementPoints: structuralLevel.replacementPoints,
        depth: structuralLevel.startableCount,
        source: 'structural',
        adpCarriersInWindow: carriers,
        structuralReplacementPoints: structuralLevel.replacementPoints,
        structuralDepth: structuralLevel.startableCount,
        poolExhausted: structuralLevel.poolExhausted,
      }
      continue
    }

    const list = listsByPosition.get(position) ?? []
    const exhausted = carriers > list.length
    byPosition[position] = {
      position,
      replacementPoints: exhausted ? 0 : list[carriers - 1].projectedPoints,
      depth: carriers,
      source: 'adp',
      adpCarriersInWindow: carriers,
      structuralReplacementPoints: structuralLevel.replacementPoints,
      structuralDepth: structuralLevel.startableCount,
      poolExhausted: exhausted,
    }
  }

  return {
    byPosition,
    calibration: usableAdp ? 'adp' : 'structural_only',
    startableWindow: window,
  }
}
