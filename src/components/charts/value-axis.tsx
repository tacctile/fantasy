import { cn } from '@/lib/utils'

import { formatPoints } from './format'
import { positionOf, ticksFor, type Domain } from './scales'

interface ValueAxisProps {
  domain: Domain
  /** Explicit ticks; derived from the domain when omitted. */
  tickValues?: number[]
  format?: (value: number) => string
  /**
   * 'y' — horizontal gridlines with labels down the left edge (vertical bars,
   * trend lines). 'x' — vertical gridlines with labels along the bottom
   * (horizontal / diverging bars).
   */
  orientation?: 'y' | 'x'
  /** Render tick labels. Off gives bare gridlines for a compact/inline chart. */
  showLabels?: boolean
  className?: string
}

/**
 * The value axis: recessive gridlines plus their tick labels, absolutely
 * positioned inside a `ChartFrame` plot area by percentage.
 *
 * Deliberately understated per DESIGN_SYSTEM's chart direction (minimal
 * gridlines, annotation-light): lines use `--chart-grid`, which sits BELOW
 * `--border`'s opacity precisely so chart furniture can never compete with a
 * data mark. Labels wear `--muted-foreground` — text never wears a series
 * colour, so identity always comes from the mark beside it.
 *
 * The percentage offsets below are data-derived geometry, not spacing: the
 * Tailwind-default-scale-only rule governs padding/margin/gap, and a gridline
 * at 37.5% of a plot has no scale-value equivalent.
 */
export default function ValueAxis({
  domain,
  tickValues,
  format = formatPoints,
  orientation = 'y',
  showLabels = true,
  className,
}: ValueAxisProps) {
  const ticks = tickValues ?? ticksFor(domain)

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
    >
      {ticks.map((tick) => {
        const pct = positionOf(tick, domain)
        return orientation === 'y' ? (
          <div
            key={tick}
            className="absolute inset-x-0 flex items-center"
            style={{ bottom: `${pct}%` }}
          >
            <div className="h-px w-full bg-chart-grid" />
            {showLabels && (
              <span className="absolute -top-4 left-0 text-xs leading-none text-muted-foreground">
                {format(tick)}
              </span>
            )}
          </div>
        ) : (
          <div
            key={tick}
            className="absolute inset-y-0 flex justify-center"
            style={{ left: `${pct}%` }}
          >
            <div className="h-full w-px bg-chart-grid" />
            {showLabels && (
              <span className="absolute -bottom-4 text-xs leading-none text-muted-foreground">
                {format(tick)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
