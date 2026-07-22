import Link from 'next/link'

import { cn } from '@/lib/utils'

interface WeekSelectorProps {
  /** Weeks to offer — the page decides the range (e.g. league-scored weeks). */
  weeks: number[]
  selectedWeek: number
}

/**
 * URL-driven week selector (Nick-signed 2026-07-22): each week is a
 * query-only link (`?week=N`), so the server page re-fetches on navigation —
 * no client state, deep-linkable weeks, same server-component posture as the
 * draft board. The selected pill carries the teal active treatment
 * (teal = active/selected state, DESIGN_SYSTEM.md).
 */
export default function WeekSelector({
  weeks,
  selectedWeek,
}: WeekSelectorProps) {
  if (weeks.length === 0) return null
  return (
    <nav aria-label="Week" className="flex flex-wrap items-center gap-1.5">
      {weeks.map((week) => {
        const active = week === selectedWeek
        return (
          <Link
            key={week}
            href={`?week=${week}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex h-7 min-w-9 items-center justify-center rounded-full px-2 text-xs font-semibold tabular-nums transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-secondary-foreground'
            )}
          >
            {week}
          </Link>
        )
      })}
    </nav>
  )
}
