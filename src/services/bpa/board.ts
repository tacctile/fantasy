/**
 * Dynamic BPA recompute (Wave 3b BPA item 4): the ONE composition of the pure
 * layer's chain — scoring (upstream) → replacement → ADP calibration → base
 * value/VORP — run against whatever pool it is handed.
 *
 * This is the item that makes positional scarcity real-time rather than a
 * pre-draft snapshot. There is no cached baseline anywhere: the whole chain is
 * a pure re-call. To recompute "after every pick," the caller (BPA item 6's
 * query, re-invoked per pick by item 9) passes the CURRENT UNDRAFTED pool —
 * drafted players removed — so replacement level is always the last startable
 * player among those STILL AVAILABLE. As a run drains a position, that
 * position's demand-th available player gets deeper/worse and its replacement
 * line drops, which is exactly the dynamic-recalculation behavior
 * value-based-drafting.md documents ("static baselines decay; live drafts
 * require dynamic recalculation" — Key Decision). Do NOT cache a static
 * pre-draft replacement baseline (build-file item 4 mandate).
 *
 * Recompute model (Nick-signed via the pure layer + STATE.yml self-location,
 * disclosed judgment call): the greedy fill re-runs FULL league-wide startable
 * demand against the shrinking pool — it does not subtract already-filled
 * league starter slots (that would require tracking every team's remaining
 * slots). With the ~3.3k-player projection pool this deepens replacement
 * gradually and never exhausts in practice; reducing demand by filled slots is
 * a possible future refinement, not a v1 requirement.
 *
 * Pure and deterministic — no I/O, no caching, no second derivation of scoring,
 * replacement, or VORP (STATE.yml centralization mandate). Same inputs → same
 * output, which is what lets item 6 call it once per pick without state.
 */
import type { RosterSlotLayout } from '@/services/draft-board'

import type { AdpCalibrationPlayer, CalibratedReplacementLevels } from './calibration'
import { calibrateReplacementLevels } from './calibration'
import type { BaseValueResult } from './base-value'
import { computeBaseValues } from './base-value'
import type { ReplacementPoolPlayer } from './replacement'
import { computeReplacementLevels } from './replacement'

export type BpaBoard = {
  /** Ranked base values (baseValue desc) over the pool, plus the unrankable
   *  summary — item 6 slices its top-N from `baseValues.players`. */
  baseValues: BaseValueResult
  /** The operative replacement lines this recompute produced (calibrated or
   *  structural fallback), carried for the panel's separated-signals display
   *  and for surfacing the calibration flag. */
  replacementLevels: CalibratedReplacementLevels
}

/**
 * Recompute the whole BPA board against `pool`.
 *
 * `pool` MUST already be league-scored (scoring.ts upstream) and MUST be the
 * current UNDRAFTED set for a live board — this function neither fetches nor
 * filters drafted players; the shrinking-pool semantics live in the caller.
 * `adp` is the format-resolved, sentinel-filtered ADP carriers (from
 * adp_rankings) or null for a structural-only run (calibration degrades and
 * flags it).
 */
export function computeBpaBoard(
  pool: readonly ReplacementPoolPlayer[],
  layout: RosterSlotLayout,
  leagueSize: number,
  adp: readonly AdpCalibrationPlayer[] | null
): BpaBoard {
  const structural = computeReplacementLevels(pool, layout, leagueSize)
  const replacementLevels = calibrateReplacementLevels(structural, pool, adp)
  const baseValues = computeBaseValues(pool, replacementLevels)
  return { baseValues, replacementLevels }
}
