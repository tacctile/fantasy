import { polylinePoints, type Domain } from '@/components/charts/scales'
import { tokenColor } from '@/components/charts/series'
import { cn } from '@/lib/utils'
import type { TeamScoreWeek } from '@/services/score-trends'

interface ScoreSparklineProps {
  weeks: readonly TeamScoreWeek[]
  /** Shared with every other row — rows must be comparable at a glance. */
  domain: Domain
  colorVar?: string
  /** Screen-reader text; the full numbers live in the row beside it. */
  label: string
  className?: string
}

/**
 * A row-sized score trend (Wave 5 — Score charts, item 6).
 *
 * Sparklines, not charts, in list context: the item's rule is that a table row
 * gets the shape of the trend and the full bar/line chart is reached by
 * drilling in. So this deliberately has no axis, no ticks, no title and no
 * tooltip — it is a word in a sentence, not a figure, which is also why it does
 * NOT mount inside `ChartFrame` (a figure/figcaption wrapper inside a list row
 * would be structurally wrong even before it looked wrong).
 *
 * All rows share one domain, passed in by the list: a per-row rescale would
 * make every team's trend look identical, which is the same failure mode the
 * small-multiples primitive exists to prevent at full size.
 */
export default function ScoreSparkline({
  weeks,
  domain,
  colorVar = '--chart-neutral',
  label,
  className,
}: ScoreSparklineProps) {
  const segments = polylinePoints(
    weeks.map((week) => (week.points === null ? Number.NaN : week.points)),
    domain
  )
  if (segments.length === 0) {
    return (
      <span className={cn('block h-8 w-full', className)}>
        <span className="sr-only">{label}: no scored weeks</span>
      </span>
    )
  }
  return (
    <span className={cn('block h-8 w-full', className)}>
      <span className="sr-only">{label}</span>
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="size-full"
      >
        {segments.map((points) => (
          <polyline
            key={points}
            points={points}
            fill="none"
            stroke={tokenColor(colorVar)}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </span>
  )
}
