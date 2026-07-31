import { cn } from '@/lib/utils'

import type { ChartHeight } from './chart-frame'

const PLOT_HEIGHTS: Record<ChartHeight, string> = {
  sparkline: 'h-8',
  sm: 'h-40',
  md: 'h-56',
  lg: 'h-72',
}

interface ChartEmptyProps {
  /** Why there is nothing to plot, in the reader's terms — never an error. */
  message: string
  height?: ChartHeight
  className?: string
}

/**
 * The "nothing to plot yet" state for a chart — no weeks scored, no completed
 * matchups, a position no roster carries.
 *
 * Occupies the same footprint as the real chart so a section doesn't reflow
 * when data arrives. Copy is deliberately kept distinct from FAILURE copy (the
 * `SectionUnavailable` / `SpectatorSectionNotice` pair): a preseason league
 * with no scores yet is an honest empty state, and letting it borrow
 * failure wording would have Nick chasing a bug that isn't there. That
 * distinction is a project-wide rule, established with the Wave 4 resilience
 * work — not a per-component nicety.
 */
export default function ChartEmpty({
  message,
  height = 'md',
  className,
}: ChartEmptyProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center rounded-xl bg-card px-3 text-center text-sm text-muted-foreground',
        PLOT_HEIGHTS[height],
        className
      )}
    >
      {message}
    </div>
  )
}
