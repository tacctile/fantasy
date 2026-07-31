import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ChartMarkProps {
  /** Tooltip contents — the mark's exact values, shown on hover/focus. */
  tooltip: ReactNode
  /** Screen-reader text for the mark, since the tooltip is presentational. */
  label: string
  children: ReactNode
  className?: string
}

/**
 * The hover layer, as a wrapper around any mark (bar, cell, dot).
 *
 * Implemented in pure CSS — a `group-hover` / `group-focus-within` opacity
 * transition — with NO client JavaScript, so an admin chart section keeps its
 * server-rendered `use client`-free status while still shipping the tooltip the
 * dataviz standard expects by default (Nick's Clarify, 2026-07-31).
 *
 * `tabIndex={0}` is what makes this reachable without a pointer: the tooltip
 * appears on keyboard focus as well as hover, so the exact values aren't
 * mouse-only. The `sr-only` label carries the same information to a screen
 * reader, because the tooltip itself is `aria-hidden` presentation.
 *
 * The spectator surface does NOT use this — it has no hover to offer on a
 * phone and a hard zero-client-JS guarantee to keep, so its charts carry
 * visible direct labels instead. That is the sanctioned relief channel for the
 * same information, not a downgrade.
 */
export default function ChartMark({
  tooltip,
  label,
  children,
  className,
}: ChartMarkProps) {
  return (
    <div
      tabIndex={0}
      className={cn(
        'group/mark relative outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className
      )}
    >
      <span className="sr-only">{label}</span>
      {children}
      <div
        aria-hidden
        role="presentation"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 transition-opacity group-hover/mark:opacity-100 group-focus-within/mark:opacity-100 md:block"
      >
        {tooltip}
      </div>
    </div>
  )
}
