import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { extent, niceDomain, type Domain } from './scales'

export type Facet = {
  /** Stable identity — a native_roster_id, not a rank. */
  key: string
  /** The facet's own heading; identity comes from here, never from colour. */
  title: string
  /** Optional trailing figure on the title row (season total, all-play record). */
  value?: string
  /** Rendered inside the facet's plot area, positioned against the SHARED domain. */
  render: (domain: Domain) => ReactNode
}

interface SmallMultiplesProps {
  facets: readonly Facet[]
  /** Every value across every facet — the shared domain is derived from all of them. */
  allValues: readonly number[]
  /** Anchor the shared scale at zero. True for bars, false for trend lines. */
  includeZero?: boolean
  /** States the scale ONCE for the whole grid, e.g. "0-160 points". */
  scaleCaption?: string
  className?: string
}

/**
 * The shared small-multiples layout: one mini-chart per entity, used wherever a
 * comparison exceeds the 4-series cap that a single overplotted chart can carry
 * (`MAX_SERIES` in `series.ts`). A 12-team league is the normal case for this
 * wave — score trends, positional comparisons, weekly luck.
 *
 * TWO decisions are load-bearing here, both Nick-signed 2026-07-31:
 *
 * 1. ONE SHARED DOMAIN across every facet, computed from `allValues` and passed
 *    down to each `render`. This is the entire reason small multiples beat a
 *    spaghetti chart: a tall bar in one facet must genuinely mean more than a
 *    short bar in another. Per-facet scaling would render a 70-point team's
 *    chart identically to a 140-point team's — the comparison the grid exists
 *    to make would be silently invalid. There is deliberately no per-facet
 *    opt-out; a low-scoring team's facet looking flat IS the honest reading.
 *
 * 2. The value scale is stated ONCE (`scaleCaption`) rather than repeated as 12
 *    axes. Per DESIGN_SYSTEM's annotation-light chart direction and its named
 *    anti-reference — twelve copies of one axis is precisely the legacy
 *    fantasy-platform clutter the admin surface is built against. Dense does
 *    not mean cluttered.
 *
 * Facets are rendered in the order given; this primitive never sorts, so the
 * caller's ordering (standings rank, roster id) stays authoritative. Facet
 * marks are monochrome by design — identity is carried by the title, so
 * spending a categorical colour slot per facet would encode nothing the reader
 * can't already read, and would silently reintroduce the >5-series problem the
 * grid was reached for in the first place.
 */
export default function SmallMultiples({
  facets,
  allValues,
  includeZero = true,
  scaleCaption,
  className,
}: SmallMultiplesProps) {
  const raw = extent(allValues)
  const domain = niceDomain(raw ?? { min: 0, max: 1 }, { includeZero })

  return (
    <div className={cn('flex w-full flex-col gap-2 tabular-nums', className)}>
      {scaleCaption && (
        <p className="text-xs text-muted-foreground">{scaleCaption}</p>
      )}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {facets.map((facet) => (
          <li
            key={facet.key}
            className="flex flex-col gap-1.5 rounded-xl bg-card p-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-xs font-semibold">
                {facet.title}
              </span>
              {facet.value && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {facet.value}
                </span>
              )}
            </div>
            <div className="relative h-20 w-full">{facet.render(domain)}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
