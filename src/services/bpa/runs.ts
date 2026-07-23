/**
 * Positional run detection (Wave 3b positional-run items 1, 2, 4): a pure,
 * count-based sliding-window flag over the recent pick sequence — the draft-day
 * signal that several managers are taking the same position in quick succession
 * (in-season-management/positional-run-detection-draft-day).
 *
 * METHOD (Nick's Clarify 2026-07-23, build-file items 1–2): count same-position
 * selections within a fixed window of the LAST N picks; a position flags as an
 * active run once its count in that window meets a per-position threshold. The
 * window is the N most-recent picks regardless of position — a K or DEF pick
 * still occupies a window slot, it just can't itself trigger a run (K/DEF are
 * outside the run-detectable set; see RUN_COUNT_THRESHOLD).
 *
 * WHY COUNT-ONLY, AND WHERE THE TIER SIGNAL LIVES (Nick's Clarify): the wiki's
 * strongest point is that a raw same-position count over-fires — parallel,
 * independent roster construction looks identical to a coordinated run, and a
 * run only *matters* when it crosses a genuine tier cliff (draining a group of
 * comparable players), not whenever the count rises
 * (positional-run-detection-draft-day.md Core Knowledge + Key Decisions). This
 * layer deliberately stays a pure count flag: the "does this run actually
 * matter" tier-crossing refinement is composed at the UI (positional-run item 3,
 * a later fold) by pairing this flag with the already-shipped per-position
 * top-tier counter (summarizeTiers → topTierSize). Keeping the count and the
 * tier context as two separate inputs the badge combines — rather than folding
 * tiers into this function — keeps this a standalone, headlessly testable
 * signal and preserves item 4's separation invariant (below).
 *
 * THRESHOLDS (item 2; DECLARED WIKI SILENCE on the exact numbers): shallow
 * positions (QB/TE) flag at a LOWER count than deep ones (RB/WR), because a
 * two-deep run at a thin position is already actionable while deep RB/WR need
 * more before the tier that matters is gone (positional-run-detection-draft-day
 * — position sensitivity; TE-premium raises a TE run's real cost). The precise
 * window size and counts are the page's Open Question #1 — "the precise
 * quantitative threshold... should be treated as a tunable design parameter
 * pending platform-specific backtesting" — so, exactly like tiers.ts's gap
 * multiples, these are live-tuned platform constants under declared silence, not
 * wiki-sourced values. Nick's Clarify picked window 6, QB/TE 2, RB/WR 3, K/DEF
 * excluded.
 *
 * FORMAT SENSITIVITY — DEFERRED (Nick's Clarify, flagged): the wiki Key Decision
 * calls for materially different run-sensitivity in superflex/2QB leagues (QB
 * scarcity is structural there — proactive early QB is correct, not a run to
 * react to) and best-ball. No superflex/best-ball league is connected (the live
 * league is 1QB redraft), so this layer applies its thresholds uniformly across
 * formats today rather than write speculative format branches. Format-aware QB
 * sensitivity (via resolveAdpScoringFormat) is a future refinement — see the
 * completion report's WIKI NOTE and STATE.yml.
 *
 * ITEM 4 — INFORMATIONAL ONLY, NEVER COUPLED TO VALUE: this module imports
 * nothing from the value pipeline (scoring / replacement / calibration /
 * base-value / board) and the value pipeline imports nothing from it. Run
 * detection NEVER auto-adjusts BPA ranking or base VORP — only the dynamic
 * replacement-level recompute (already triggered per pick in board.ts) moves
 * rankings. Run detection and value recalculation are separate, independently
 * inspectable mechanisms, even though a run naturally shifts replacement level
 * too (the shrinking-pool recompute captures that; this flag does not feed it).
 * This is a parallel display signal, exactly like need.ts and tiers.ts.
 *
 * Pure and deterministic (picks read by pick_number ascending; activeRuns
 * ordered count desc then position asc). No I/O, no cache, no server-only
 * dependency — the item-3 client badge can call it directly on the livePicks
 * snapshot the board shell already owns, the same posture as the pure
 * live-picks merge layer. Recompute = re-call on the new snapshot after any
 * pick lands (manual / sleeper_poll / undo); an undo simply removes the row
 * from the window on the next call.
 */

/** Minimal pick shape this layer consumes — decoupled from the pick-write
 *  path's RecordedPick (callers map RecordedPick → RunPick), same minimal-shape
 *  discipline as DraftablePlayer. `position` is the catalog position
 *  (uppercase, e.g. 'QB'/'RB'/'WR'/'TE'/'K'/'DEF'); null when the catalog row
 *  lacks it — null picks occupy a window slot but never contribute a count. */
export type RunPick = {
  pickNumber: number
  position: string | null
}

/**
 * Per-position same-position count threshold within the detection window
 * (positional-run item 2; declared-silence platform choice, Nick's Clarify).
 * Presence in this map IS the run-detectable set: QB/RB/WR/TE only. K, DEF, and
 * any other position (IDP, etc.) are intentionally absent — they still occupy
 * window slots but are never flagged as a run (K/DEF runs are late-draft noise,
 * the same position scope the tier counter omits).
 *
 * Shallow QB/TE flag at 2; deep RB/WR at 3.
 */
export const RUN_COUNT_THRESHOLD: Record<string, number> = {
  QB: 2,
  TE: 2,
  RB: 3,
  WR: 3,
}

/** Detection window: the last N picks examined (positional-run item 1; Nick's
 *  Clarify = 6). Overridable per-call for tests. */
export const DEFAULT_RUN_WINDOW_SIZE = 6

export type PositionRun = {
  position: string
  /** Same-position picks within the detection window. */
  countInWindow: number
  /** The flag threshold applied for this position (from RUN_COUNT_THRESHOLD). */
  threshold: number
  /** True when countInWindow >= threshold — an active run. */
  isRun: boolean
}

export type RunBoard = {
  /** The window size requested (after clamping to a positive integer). */
  windowSize: number
  /** Picks actually in the window (== windowSize unless fewer picks exist). */
  windowPickCount: number
  /** Lowest / highest pick_number spanned by the window; null when no picks. */
  windowStartPick: number | null
  windowEndPick: number | null
  /** Keyed by position — ONLY run-detectable positions (QB/RB/WR/TE) that have
   *  at least one pick in the window appear. A run-detectable position with
   *  zero picks in the window is omitted (nothing to report). */
  byPosition: Record<string, PositionRun>
  /** Positions currently flagged (isRun true), count desc then position asc. */
  activeRuns: string[]
}

/**
 * Detect active positional runs from the current pick sequence.
 *
 * `picks` is the league's recorded picks (any order — sorted here by
 * pick_number ascending defensively); the window is the last `windowSize` of
 * them by pick_number, i.e. the most-recent selections still on the board
 * (after an undo, the removed row is simply gone from the snapshot and the
 * window shifts back to the next-highest picks).
 */
export function detectPositionalRuns(
  picks: readonly RunPick[],
  options: { windowSize?: number } = {}
): RunBoard {
  const requested = options.windowSize ?? DEFAULT_RUN_WINDOW_SIZE
  // Clamp to a positive integer — never a zero/negative/fractional window.
  const windowSize = Number.isFinite(requested)
    ? Math.max(1, Math.floor(requested))
    : DEFAULT_RUN_WINDOW_SIZE

  // Ascending by pick_number; the window is the tail (the most-recent picks).
  const sorted = [...picks].sort((a, b) => a.pickNumber - b.pickNumber)
  const window = sorted.slice(-windowSize)

  const windowPickCount = window.length
  const windowStartPick = windowPickCount > 0 ? window[0].pickNumber : null
  const windowEndPick =
    windowPickCount > 0 ? window[windowPickCount - 1].pickNumber : null

  // Count only run-detectable positions; non-detectable (K/DEF/other) and null
  // positions still occupy their window slot but contribute no count.
  const counts = new Map<string, number>()
  for (const pick of window) {
    const position = pick.position
    if (position === null) continue
    if (!(position in RUN_COUNT_THRESHOLD)) continue
    counts.set(position, (counts.get(position) ?? 0) + 1)
  }

  const byPosition: Record<string, PositionRun> = {}
  for (const [position, countInWindow] of counts) {
    const threshold = RUN_COUNT_THRESHOLD[position]
    byPosition[position] = {
      position,
      countInWindow,
      threshold,
      isRun: countInWindow >= threshold,
    }
  }

  const activeRuns = Object.values(byPosition)
    .filter((run) => run.isRun)
    .sort(
      (a, b) =>
        b.countInWindow - a.countInWindow ||
        (a.position < b.position ? -1 : a.position > b.position ? 1 : 0)
    )
    .map((run) => run.position)

  return {
    windowSize,
    windowPickCount,
    windowStartPick,
    windowEndPick,
    byPosition,
    activeRuns,
  }
}
