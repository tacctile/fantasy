import ChartMark from '@/components/charts/chart-mark'
import { formatPoints, formatWeek } from '@/components/charts/format'
import { tokenColor } from '@/components/charts/series'
import { spanOf, type Domain } from '@/components/charts/scales'
import { cn } from '@/lib/utils'
import type { TeamScoreWeek } from '@/services/score-trends'

interface WeeklyPointsBarsProps {
  weeks: readonly TeamScoreWeek[]
  /** Shared across every team on the page — never a per-team rescale. */
  domain: Domain
  /** A token NAME from `series.ts` (never a colour literal). */
  colorVar: string
  /** Names the series in the tooltip and the screen-reader label. */
  teamLabel: string
  /**
   * Hover/focus tooltips. Off inside small-multiples facets: 12 facets × 14
   * weeks would put 168 focusable stops between the reader and the next
   * control, and each facet already states its own total.
   */
  interactive?: boolean
  className?: string
}

/**
 * One team's weekly points as bars (Wave 5 — Score charts, item 2).
 *
 * BARS, NOT A LINE, and that is the item's whole point: a weekly fantasy score
 * is a discrete, self-contained event, and a line between week 3 and week 4
 * would draw values that never existed. The cumulative chart is where a line is
 * genuinely correct, because a running total really is continuous.
 *
 * Bars are measured from the ZERO line rather than from the plot floor, so a
 * negative week (rare, but legal — a defense can score below zero) renders
 * below the baseline instead of upside-down. A week with no row renders no bar
 * at all: a bye is missing data, and drawing it as a zero-height bar sitting on
 * the axis would read as "they scored nothing", which is a different claim.
 *
 * Geometry comes from `scales.ts` as percentages, so this renders on the server
 * with no measurement and no client JavaScript.
 */
export default function WeeklyPointsBars({
  weeks,
  domain,
  colorVar,
  teamLabel,
  interactive = false,
  className,
}: WeeklyPointsBarsProps) {
  return (
    <div className={cn('absolute inset-0 flex items-stretch gap-px', className)}>
      {weeks.map((week) => {
        if (week.points === null) {
          return <div key={week.week} className="min-w-0 flex-1" aria-hidden />
        }
        const span = spanOf(0, week.points, domain)
        const bar = (
          <div
            className={cn(
              'absolute inset-x-0 rounded-sm',
              // A provisional week is the same magnitude, drawn less
              // emphatically — the same honesty the UnofficialChip carries on
              // the Wave 4 surfaces, expressed in the chart's own language.
              !week.isFinal && 'opacity-60'
            )}
            style={{
              bottom: `${span.startPct}%`,
              height: `${Math.max(span.sizePct, 0.5)}%`,
              backgroundColor: tokenColor(colorVar),
            }}
          />
        )
        const label = `${teamLabel}, ${formatWeek(week.week)}: ${formatPoints(
          week.points
        )} points${week.isFinal ? '' : ' (unofficial)'}`

        return interactive ? (
          <ChartMark
            key={week.week}
            className="min-w-0 flex-1"
            label={label}
            tooltip={
              <span>
                {formatWeek(week.week)} · {formatPoints(week.points)}
                {!week.isFinal && ' · unofficial'}
              </span>
            }
          >
            {bar}
          </ChartMark>
        ) : (
          <div key={week.week} className="relative min-w-0 flex-1">
            <span className="sr-only">{label}</span>
            {bar}
          </div>
        )
      })}
    </div>
  )
}
