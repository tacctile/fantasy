import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import type { ChartHeight } from './chart-frame'

/** Deterministic bar heights — a chart skeleton must not re-shuffle per render. */
const BAR_HEIGHTS = [
  '55%',
  '80%',
  '40%',
  '95%',
  '65%',
  '75%',
  '50%',
  '85%',
  '60%',
  '70%',
  '45%',
  '90%',
] as const

const PLOT_HEIGHTS: Record<ChartHeight, string> = {
  sparkline: 'h-8',
  sm: 'h-40',
  md: 'h-56',
  lg: 'h-72',
}

interface ChartSkeletonProps {
  /** How many bars to suggest — match the real chart's density, don't overpromise. */
  bars?: number
  height?: ChartHeight
  className?: string
}

/**
 * Loading placeholder for a chart, following the project's established
 * skeleton pattern (shadcn `Skeleton` on `bg-muted`, CSS pulse only — no JS
 * animation, per the 60fps/prefer-CSS-transitions rule).
 *
 * Bar heights are a fixed cycle rather than random, for the same reason the
 * route skeletons mirror their real layouts: a skeleton that reshuffles between
 * renders reads as content loading twice. The `bars` count should match what
 * actually arrives — a skeleton denser than its chart promises more than the
 * data delivers.
 */
export default function ChartSkeleton({
  bars = 8,
  height = 'md',
  className,
}: ChartSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading chart"
      className={cn('flex w-full items-end gap-1', PLOT_HEIGHTS[height], className)}
    >
      {Array.from({ length: bars }, (_, index) => (
        <Skeleton
          key={index}
          className="min-w-0 flex-1 rounded-sm"
          style={{ height: BAR_HEIGHTS[index % BAR_HEIGHTS.length] }}
        />
      ))}
    </div>
  )
}
