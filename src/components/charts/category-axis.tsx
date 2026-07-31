import { cn } from '@/lib/utils'

interface CategoryAxisProps {
  /** One label per band, in the same order as the marks they sit under. */
  labels: readonly string[]
  /**
   * Render every Nth label only. Weeks 1–18 across a phone-width chart collide
   * otherwise, and a thinned axis reads better than a rotated or clipped one.
   */
  interval?: number
  className?: string
}

/**
 * The category axis: evenly spaced band labels (weeks, teams, positions)
 * beneath a plot, sharing the band geometry `bandCentres` gives the marks —
 * flexed equal-width cells rather than percentage offsets, so a label is
 * centred under its mark by construction and can never drift out of alignment
 * with it.
 *
 * Labels are `--muted-foreground` and inherit the frame's `tabular-nums`, so a
 * "W1…W18" axis stays in an even column.
 */
export default function CategoryAxis({
  labels,
  interval = 1,
  className,
}: CategoryAxisProps) {
  return (
    <div className={cn('flex w-full', className)}>
      {labels.map((label, index) => (
        <span
          key={`${label}-${index}`}
          className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground"
        >
          {index % interval === 0 ? label : ' '}
        </span>
      ))}
    </div>
  )
}
