/**
 * Chart colour-slot policy (Wave 5 shared foundations). The token VALUES live
 * in `globals.css`; this module is the only place that decides which slot a
 * mark gets, so the fixed-order rule is enforced by construction rather than
 * by every chart remembering it.
 *
 * Colour scales and their jobs (Nick-signed 2026-07-31, see DESIGN_SYSTEM.md
 * "Chart Color Scales"):
 *   - categorical  → series identity (which team)
 *   - diverging    → polarity about a zero/average baseline
 *   - positional   → the existing --pos-* position identity language
 *   - grid/axis    → recessive chart furniture
 */

/**
 * The categorical ramp in FIXED slot order. Deliberately clear of the teal hue
 * band so "teal = interactive/live only" survives contact with charts.
 * Validated dark-mode on both --card and --background: worst adjacent CVD
 * ΔE 18.6 (deuteranopia), normal-vision 28.9, contrast ≥ 3:1 on all five.
 */
export const SERIES_VARS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
] as const

export type SeriesVar = (typeof SERIES_VARS)[number]

/** The most series one chart may carry before it must become small multiples. */
export const MAX_SERIES = 4

/**
 * The colour for series `index`, or null past the ramp. Null is the point: a
 * sixth series is NEVER a generated hue and never a wrap back to slot 1 —
 * cycling would give two teams the same colour, which is worse than no colour
 * at all. A caller receiving null folds the remainder into "Other" or switches
 * to the small-multiples layout, which is why `MAX_SERIES` sits beside this.
 *
 * Slots are assigned by a STABLE entity key (native_roster_id order), never by
 * rank — so filtering or re-sorting a chart must never repaint the survivors.
 */
export function seriesVar(index: number): SeriesVar | null {
  if (!Number.isInteger(index) || index < 0 || index >= SERIES_VARS.length) {
    return null
  }
  return SERIES_VARS[index]
}

/** Whether a series count fits one chart, or has to fan out to small multiples. */
export function needsSmallMultiples(seriesCount: number): boolean {
  return seriesCount > MAX_SERIES
}

/** The zero-centred diverging scale: two poles and a neutral grey midpoint. */
export const DIVERGING_VARS = {
  positive: '--chart-positive',
  negative: '--chart-negative',
  zero: '--chart-neutral',
} as const

/** The diverging token for one arm of a `divergingBar` result. */
export function divergingVar(side: 'positive' | 'negative' | 'zero'): string {
  return DIVERGING_VARS[side]
}

/**
 * The six position identity tokens, reused from the badge language rather than
 * duplicated as a chart-only scale (Nick's Clarify 2026-07-31) — a QB bar is
 * the same hue as its QB badge. Positions outside the canonical six fall back
 * to the neutral treatment instead of inventing a colour, mirroring
 * `position-badge.tsx`.
 */
const POSITION_VARS: Record<string, string> = {
  QB: '--pos-qb',
  RB: '--pos-rb',
  WR: '--pos-wr',
  TE: '--pos-te',
  K: '--pos-k',
  DEF: '--pos-def',
}

export function positionVar(position: string | null | undefined): string {
  if (!position) return '--chart-neutral'
  return POSITION_VARS[position.toUpperCase()] ?? '--chart-neutral'
}

/**
 * A CSS `var(...)` reference for a token name — the one sanctioned way a chart
 * mark gets its colour into an inline style. Data-driven colour can't go
 * through a Tailwind class (the class set isn't known at build time), so it
 * goes through a token reference instead. Never a hex literal (Rule: zero
 * inline hex), and never a raw value.
 */
export function tokenColor(varName: string): string {
  return `var(${varName})`
}
