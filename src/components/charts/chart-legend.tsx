import { cn } from '@/lib/utils'

import { tokenColor } from './series'

export type ChartLegendEntry = {
  label: string
  /** A CSS custom-property NAME from `series.ts` — never a colour literal. */
  colorVar: string
  /** Optional trailing value (season total, all-play record). */
  value?: string
}

interface ChartLegendProps {
  entries: readonly ChartLegendEntry[]
  className?: string
}

/**
 * The shared legend: a colour swatch plus a text label per series.
 *
 * Present whenever a chart carries two or more series — identity must never be
 * colour-alone, so the label beside the swatch is the actual identifier and the
 * swatch merely ties it to a mark. A single-series chart deliberately renders
 * NO legend: its title already names the series, and a one-row legend is pure
 * noise.
 *
 * Label and value text wear the ordinary text tiers, never the series colour —
 * coloured text on a dark surface loses contrast exactly where a reader needs
 * it, and the swatch is already carrying identity. Values inherit the frame's
 * `tabular-nums`.
 */
export default function ChartLegend({ entries, className }: ChartLegendProps) {
  if (entries.length === 0) return null

  return (
    <ul
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}
    >
      {entries.map((entry) => (
        <li key={entry.label} className="flex items-center gap-1.5 text-xs">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: tokenColor(entry.colorVar) }}
          />
          <span className="text-secondary-foreground">{entry.label}</span>
          {entry.value && (
            <span className="text-muted-foreground">{entry.value}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
