import { describe, expect, it } from 'vitest'

import {
  formatActualVsExpected,
  formatDelta,
  formatPercent,
  formatPoints,
  formatRecord,
} from './format'
import {
  bandCentres,
  divergingBar,
  extent,
  maxMagnitude,
  niceDomain,
  polylinePoints,
  positionOf,
  spanOf,
  ticksFor,
} from './scales'
import { MAX_SERIES, needsSmallMultiples, positionVar, seriesVar } from './series'

describe('extent', () => {
  it('returns min/max over finite values', () => {
    expect(extent([90, 120.5, 104])).toEqual({ min: 90, max: 120.5 })
  })

  it('ignores non-finite values rather than poisoning the domain', () => {
    expect(extent([100, Number.NaN, 130, Number.POSITIVE_INFINITY])).toEqual({
      min: 100,
      max: 130,
    })
  })

  it('returns null for an empty or all-unscored series', () => {
    expect(extent([])).toBeNull()
    expect(extent([Number.NaN, Number.NaN])).toBeNull()
  })
})

describe('niceDomain', () => {
  it('rounds outward to readable boundaries', () => {
    const domain = niceDomain({ min: 87.3, max: 132.8 })
    expect(domain.min).toBeLessThanOrEqual(87.3)
    expect(domain.max).toBeGreaterThanOrEqual(132.8)
  })

  it('anchors at zero when asked — a truncated bar baseline exaggerates gaps', () => {
    expect(niceDomain({ min: 87, max: 132 }, { includeZero: true }).min).toBe(0)
  })

  it('widens a single-value domain instead of collapsing it', () => {
    const domain = niceDomain({ min: 100, max: 100 })
    expect(domain.max).toBeGreaterThan(domain.min)
  })

  it('widens an all-zero domain without dividing by zero', () => {
    const domain = niceDomain({ min: 0, max: 0 })
    expect(domain.max).toBeGreaterThan(domain.min)
    expect(Number.isFinite(domain.min)).toBe(true)
  })
})

describe('ticksFor', () => {
  it('spans the domain inclusively', () => {
    const ticks = ticksFor({ min: 0, max: 100 })
    expect(ticks[0]).toBe(0)
    expect(ticks.at(-1)).toBe(100)
  })

  it('sheds float accumulation noise', () => {
    for (const tick of ticksFor({ min: 0, max: 1 })) {
      expect(String(tick)).not.toMatch(/\d{8,}/)
    }
  })

  it('degrades to a single tick on a zero-width domain', () => {
    expect(ticksFor({ min: 5, max: 5 })).toEqual([5])
  })
})

describe('positionOf', () => {
  it('maps the domain onto 0–100', () => {
    expect(positionOf(0, { min: 0, max: 200 })).toBe(0)
    expect(positionOf(100, { min: 0, max: 200 })).toBe(50)
    expect(positionOf(200, { min: 0, max: 200 })).toBe(100)
  })

  it('clamps out-of-domain values into the plot instead of overflowing it', () => {
    expect(positionOf(-50, { min: 0, max: 200 })).toBe(0)
    expect(positionOf(500, { min: 0, max: 200 })).toBe(100)
  })

  it('returns 0 rather than NaN on a degenerate domain', () => {
    expect(positionOf(5, { min: 5, max: 5 })).toBe(0)
    expect(positionOf(Number.NaN, { min: 0, max: 10 })).toBe(0)
  })
})

describe('spanOf', () => {
  it('measures a baseline-anchored bar', () => {
    expect(spanOf(0, 50, { min: 0, max: 100 })).toEqual({
      startPct: 0,
      sizePct: 50,
    })
  })

  it('is order-insensitive', () => {
    expect(spanOf(75, 25, { min: 0, max: 100 })).toEqual(
      spanOf(25, 75, { min: 0, max: 100 })
    )
  })
})

describe('divergingBar', () => {
  it('sizes both arms against ONE shared scale', () => {
    expect(divergingBar(2, 4).sizePct).toBe(divergingBar(-2, 4).sizePct)
  })

  it('names the side from the sign', () => {
    expect(divergingBar(1.5, 3).side).toBe('positive')
    expect(divergingBar(-1.5, 3).side).toBe('negative')
  })

  it('treats exact zero as its own reading, not a zero-length positive arm', () => {
    expect(divergingBar(0, 4)).toEqual({ side: 'zero', sizePct: 0 })
  })

  it('degrades safely when every team is dead even', () => {
    expect(divergingBar(0, 0)).toEqual({ side: 'zero', sizePct: 0 })
  })

  it('clamps an outlier to a full arm', () => {
    expect(divergingBar(10, 4).sizePct).toBe(100)
  })
})

describe('maxMagnitude', () => {
  it('takes the largest absolute value across both signs', () => {
    expect(maxMagnitude([1.5, -3.2, 2])).toBe(3.2)
  })

  it('is zero for an empty series', () => {
    expect(maxMagnitude([])).toBe(0)
  })
})

describe('bandCentres', () => {
  it('centres each band in its own slice', () => {
    expect(bandCentres(4)).toEqual([12.5, 37.5, 62.5, 87.5])
  })

  it('is empty for a non-positive count', () => {
    expect(bandCentres(0)).toEqual([])
    expect(bandCentres(-3)).toEqual([])
  })
})

describe('polylinePoints', () => {
  it('flips y into SVG space', () => {
    const [segment] = polylinePoints([0, 100], { min: 0, max: 100 })
    expect(segment).toBe('25,100 75,0')
  })

  it('breaks the line at an unscored week instead of interpolating across it', () => {
    const segments = polylinePoints([10, Number.NaN, 30], { min: 0, max: 30 })
    expect(segments).toHaveLength(2)
  })

  it('returns no segments for an empty series', () => {
    expect(polylinePoints([], { min: 0, max: 1 })).toEqual([])
  })
})

describe('series slots', () => {
  it('assigns slots in fixed order', () => {
    expect(seriesVar(0)).toBe('--chart-1')
    expect(seriesVar(4)).toBe('--chart-5')
  })

  it('returns null past the ramp rather than cycling two teams onto one colour', () => {
    expect(seriesVar(5)).toBeNull()
    expect(seriesVar(-1)).toBeNull()
  })

  it('flags a series count that must fan out to small multiples', () => {
    expect(needsSmallMultiples(MAX_SERIES)).toBe(false)
    expect(needsSmallMultiples(MAX_SERIES + 1)).toBe(true)
  })

  it('maps the canonical six positions and neutralises anything else', () => {
    expect(positionVar('QB')).toBe('--pos-qb')
    expect(positionVar('def')).toBe('--pos-def')
    expect(positionVar('LB')).toBe('--chart-neutral')
    expect(positionVar(null)).toBe('--chart-neutral')
  })
})

describe('formatters', () => {
  it('formats points to one decimal', () => {
    expect(formatPoints(112.349)).toBe('112.3')
  })

  it('signs a delta and never renders negative zero', () => {
    expect(formatDelta(2.35)).toBe('+2.4')
    expect(formatDelta(-1.1)).toBe('-1.1')
    expect(formatDelta(0)).toBe('0.0')
    expect(formatDelta(-0)).toBe('0.0')
  })

  it('renders an em dash for an unscored value rather than 0', () => {
    expect(formatPoints(Number.NaN)).toBe('—')
    expect(formatDelta(Number.NaN)).toBe('—')
  })

  it('formats a percentage from a fraction', () => {
    expect(formatPercent(0.625)).toBe('63%')
  })

  it('omits the ties column when there are no ties', () => {
    expect(formatRecord(7, 2)).toBe('7-2')
    expect(formatRecord(7, 2, 1)).toBe('7-2-1')
  })

  it('frames luck in actual-vs-expected record terms, never an abstract index', () => {
    expect(formatActualVsExpected(7, 2, 5.4, 3.6)).toBe(
      '7-2 actual / 5.4-3.6 expected'
    )
  })
})
