import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Plot heights from Tailwind's default scale — never an arbitrary pixel value. */
const PLOT_HEIGHTS = {
  sparkline: 'h-8',
  sm: 'h-40',
  md: 'h-56',
  lg: 'h-72',
} as const

export type ChartHeight = keyof typeof PLOT_HEIGHTS

interface ChartFrameProps {
  /** The chart's own heading. Also names a single series, so one-series charts need no legend. */
  title?: string
  /** Short context under the title — league average, week range, sample-size caveat. */
  subtitle?: string
  /** Legend node, rendered under the plot. Required by convention for 2+ series. */
  legend?: ReactNode
  /** Freshness / provenance caption, e.g. an AsOfTime element. */
  caption?: ReactNode
  height?: ChartHeight
  /** The plot area's contents — percentage-positioned marks, axes, gridlines. */
  children: ReactNode
  className?: string
}

/**
 * The shared responsive container every Wave 5 chart mounts inside.
 *
 * "Responsive" here means fluid width with a fixed height class — NOT a
 * measurement-based container. Nothing here reads the DOM, so a chart renders
 * on the server with zero client JavaScript: the admin sections stay RSC like
 * every other Wave 4 surface, and the spectator surface's zero-client-JS
 * guarantee survives having charts on it (Nick's Clarify, 2026-07-31).
 *
 * The plot area is `relative`, which is the contract every mark and axis in
 * this directory positions against: children place themselves with percentage
 * offsets from `scales.ts`, so they are correct at any width without a resize
 * observer.
 *
 * `tabular-nums` is applied once here rather than per label, so every axis
 * tick, tooltip, and legend value inside any chart inherits it — the build
 * file's explicit requirement, enforced structurally instead of by reminder.
 */
export default function ChartFrame({
  title,
  subtitle,
  legend,
  caption,
  height = 'md',
  children,
  className,
}: ChartFrameProps) {
  return (
    <figure className={cn('flex w-full flex-col gap-3 tabular-nums', className)}>
      {(title || subtitle) && (
        <figcaption className="flex flex-col gap-0.5">
          {title && <span className="text-sm font-semibold">{title}</span>}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </figcaption>
      )}
      <div className={cn('relative w-full', PLOT_HEIGHTS[height])}>{children}</div>
      {legend}
      {caption && <div className="text-xs text-muted-foreground">{caption}</div>}
    </figure>
  )
}
