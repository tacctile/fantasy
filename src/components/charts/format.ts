/**
 * Axis / tooltip / legend value formatters (Wave 5 shared foundations).
 *
 * Centralised so the same number never renders two ways across the wave's six
 * sections — an axis tick reading "112" while its tooltip reads "112.35" is the
 * kind of drift that makes a reader distrust the whole chart. Pure functions,
 * no locale dependence beyond `toFixed` (the app is single-locale), and every
 * consumer renders them inside a `tabular-nums` scope so digits align in a
 * column (DESIGN_SYSTEM Data Display Convention — non-negotiable everywhere a
 * number renders).
 */

const clean = (value: number): number => (Object.is(value, -0) ? 0 : value)

/** A points total: one decimal, matching the standings/matchup surfaces. */
export function formatPoints(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return clean(value).toFixed(digits)
}

/**
 * A signed delta for a diverging chart's label ("+2.4", "-1.1", "0.0").
 * ASCII hyphen rather than a typographic minus on purpose: `tabular-nums`
 * fixes the advance width of DIGITS only, so a U+2212 would break the very
 * column alignment the sign is meant to sit in.
 */
export function formatDelta(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  const normalized = clean(value)
  const sign = normalized > 0 ? '+' : ''
  return `${sign}${normalized.toFixed(digits)}`
}

/** A fraction (0–1) as a percentage. Pass an already-scaled value at your peril. */
export function formatPercent(fraction: number, digits = 0): string {
  if (!Number.isFinite(fraction)) return '—'
  return `${(fraction * 100).toFixed(digits)}%`
}

/**
 * A win total that may be fractional — an all-play or expected-wins figure
 * ("5.4"), which is exactly the shape the luck tracker compares against an
 * integer actual record.
 */
export function formatWins(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return clean(value).toFixed(digits)
}

/**
 * A W-L(-T) record, ties omitted when there are none — the same rule the
 * standings table already follows (a ties column only appears when a tie
 * exists), so the two surfaces read consistently.
 */
export function formatRecord(wins: number, losses: number, ties = 0): string {
  const base = `${wins}-${losses}`
  return ties > 0 ? `${base}-${ties}` : base
}

/**
 * An actual-vs-expected record pair — the luck tracker's required framing
 * ("7-2 actual / 5.4-3.6 expected"), so a luck bar reads without a legend and
 * never renders as an abstract index.
 */
export function formatActualVsExpected(
  actualWins: number,
  actualLosses: number,
  expectedWins: number,
  expectedLosses: number,
  ties = 0
): string {
  const actual = formatRecord(actualWins, actualLosses, ties)
  const expected = `${formatWins(expectedWins)}-${formatWins(expectedLosses)}`
  return `${actual} actual / ${expected} expected`
}

/** A week label for a category axis. Short by necessity — axes get crowded. */
export function formatWeek(week: number): string {
  return `W${week}`
}
