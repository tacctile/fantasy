/**
 * Pure chart geometry (Wave 5 shared foundations). No React, no I/O, no DOM —
 * every function here is a total function over numbers, which is what makes the
 * charts testable in the project's `node`-environment vitest suite while the
 * components themselves stay untested-by-rendering.
 *
 * The output unit is always a PERCENTAGE (0–100), never a pixel. That is the
 * whole reason this wave needs no charting library and no measurement-based
 * responsive container: a percentage-positioned mark is correct at every
 * viewport width with zero client JavaScript, so admin chart sections stay
 * server-rendered and the spectator surface's zero-client-JS guarantee holds
 * (Nick's Clarify, 2026-07-31).
 */

/** An inclusive numeric range a chart's value axis spans. */
export type Domain = {
  min: number
  max: number
}

const isFiniteNumber = (value: number): boolean => Number.isFinite(value)

/**
 * The min/max of a value set, or null when there is nothing finite to plot —
 * an empty or all-null series is an honest empty state, never a zero-width
 * domain that would render every mark at the same position.
 */
export function extent(values: readonly number[]): Domain | null {
  const finite = values.filter(isFiniteNumber)
  if (finite.length === 0) return null
  return { min: Math.min(...finite), max: Math.max(...finite) }
}

/**
 * The 1/2/5×10^k step at or just above the raw span/count — the standard
 * "nice number" ladder, so ticks land on values a reader can do arithmetic
 * with (0, 25, 50) rather than the raw data's (0, 23.7, 47.4).
 */
function niceStep(rawStep: number): number {
  if (!isFiniteNumber(rawStep) || rawStep <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const stepped = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return stepped * magnitude
}

/**
 * Round a domain outward to nice tick boundaries. A degenerate domain (one
 * distinct value, or an empty series' collapsed range) is widened rather than
 * left zero-width, so a single-week chart still renders a readable axis.
 *
 * `includeZero` anchors the baseline at zero — correct for a bar chart, where
 * a truncated axis exaggerates differences (a documented anti-pattern), and
 * deliberately NOT the default for a trend line, where a zero baseline can
 * flatten the very trend the chart exists to show.
 */
export function niceDomain(
  domain: Domain,
  options: { targetTicks?: number; includeZero?: boolean } = {}
): Domain {
  const { targetTicks = 5, includeZero = false } = options
  let { min, max } = domain
  if (includeZero) {
    min = Math.min(min, 0)
    max = Math.max(max, 0)
  }
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.1
    min -= pad
    max += pad
  }
  const step = niceStep((max - min) / Math.max(1, targetTicks))
  return {
    min: Math.floor(min / step) * step,
    max: Math.ceil(max / step) * step,
  }
}

/**
 * Tick values across a (already nice-rounded) domain. Returns the domain's own
 * bounds when a sane step can't be derived, so an axis never renders empty.
 * Values are rounded to 10 decimal places to shed float-accumulation noise
 * that would otherwise surface as a "24.000000000000004" axis label.
 */
export function ticksFor(domain: Domain, targetTicks = 5): number[] {
  const span = domain.max - domain.min
  if (!isFiniteNumber(span) || span <= 0) return [domain.min]
  const step = niceStep(span / Math.max(1, targetTicks))
  const ticks: number[] = []
  for (let value = domain.min; value <= domain.max + step / 2; value += step) {
    ticks.push(Math.round(value * 1e10) / 1e10)
  }
  return ticks
}

/**
 * A value's position along the domain as a 0–100 percentage, clamped. Clamping
 * is deliberate: an out-of-domain value is pinned to the axis end rather than
 * escaping the plot area, which keeps a stale or anomalous score from
 * overlapping neighbouring UI.
 */
export function positionOf(value: number, domain: Domain): number {
  const span = domain.max - domain.min
  if (!isFiniteNumber(value) || !isFiniteNumber(span) || span <= 0) return 0
  const ratio = (value - domain.min) / span
  return Math.min(100, Math.max(0, ratio * 100))
}

/** A bar's offset and length along the axis, both as percentages. */
export type Span = {
  startPct: number
  sizePct: number
}

/**
 * The span between two values, order-insensitive — the geometry behind a bar
 * anchored to a baseline (`spanOf(0, value, domain)`) and behind a min/median/
 * max range band alike.
 */
export function spanOf(from: number, to: number, domain: Domain): Span {
  const a = positionOf(from, domain)
  const b = positionOf(to, domain)
  return { startPct: Math.min(a, b), sizePct: Math.abs(b - a) }
}

/** One arm of a diverging bar, measured out from a shared zero centre line. */
export type DivergingBar = {
  side: 'positive' | 'negative' | 'zero'
  /** Length as a percentage of ONE arm — never of the full track width. */
  sizePct: number
}

/**
 * A value's arm on a zero-centred diverging scale (luck differential, rank
 * delta, position vs. league average). `maxMagnitude` is the largest absolute
 * value across the whole series, so both arms share one scale — sizing each
 * arm independently would make a +2 and a −2 render at different lengths and
 * silently misrepresent the comparison the chart exists to make.
 *
 * A value of exactly zero returns `'zero'` rather than a zero-length positive
 * arm, so the caller can render a centre tick instead of an invisible bar —
 * "dead even" is a real reading, not a missing one.
 */
export function divergingBar(value: number, maxMagnitude: number): DivergingBar {
  if (!isFiniteNumber(value) || value === 0) return { side: 'zero', sizePct: 0 }
  const scale = Math.abs(maxMagnitude)
  if (!isFiniteNumber(scale) || scale === 0) return { side: 'zero', sizePct: 0 }
  const sizePct = Math.min(100, (Math.abs(value) / scale) * 100)
  return { side: value > 0 ? 'positive' : 'negative', sizePct }
}

/**
 * The largest absolute value in a series — the shared scale a diverging chart
 * measures both arms against. Zero when nothing finite is present.
 */
export function maxMagnitude(values: readonly number[]): number {
  const finite = values.filter(isFiniteNumber)
  if (finite.length === 0) return 0
  return Math.max(...finite.map(Math.abs))
}

/**
 * Evenly spaced band centres as percentages — the x positions of N categories
 * (weeks, teams) across a plot. Each centre sits at the middle of its band, so
 * a marker on a band aligns with the label beneath it.
 */
export function bandCentres(count: number): number[] {
  if (!Number.isInteger(count) || count <= 0) return []
  const width = 100 / count
  return Array.from({ length: count }, (_, index) => width * index + width / 2)
}

/**
 * An SVG polyline `points` string for a trend line, in a 0–100 × 0–100 user
 * space with y ALREADY FLIPPED (SVG's y grows downward, a value axis grows
 * upward). Consumed with `viewBox="0 0 100 100"` +
 * `preserveAspectRatio="none"` + `vector-effect="non-scaling-stroke"`, which
 * is what lets one path stretch to any width without thickening its stroke.
 * Non-finite values break the series into gaps rather than interpolating
 * across a week that was never scored.
 */
export function polylinePoints(values: readonly number[], domain: Domain): string[] {
  const centres = bandCentres(values.length)
  const segments: string[] = []
  let current: string[] = []
  values.forEach((value, index) => {
    if (!isFiniteNumber(value)) {
      if (current.length > 0) segments.push(current.join(' '))
      current = []
      return
    }
    const x = centres[index]
    const y = 100 - positionOf(value, domain)
    current.push(`${round2(x)},${round2(y)}`)
  })
  if (current.length > 0) segments.push(current.join(' '))
  return segments
}

const round2 = (value: number): number => Math.round(value * 100) / 100
