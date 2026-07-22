'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { FILTER_POSITIONS } from './use-player-list'

interface BoardToolbarProps {
  query: string
  onQueryChange: (query: string) => void
  positions: string[]
  onPositionsChange: (positions: string[]) => void
  availableOnly: boolean
  onAvailableOnlyChange: (availableOnly: boolean) => void
  /** Post-filter count, shown against the full pool size for honesty. */
  matchCount: number
  totalCount: number
}

function FilterChip({
  label,
  pressed,
  onClick,
  className,
}: {
  label: string
  pressed: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold transition-colors',
        pressed
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground',
        className
      )}
    >
      {label}
    </button>
  )
}

/**
 * Player-list filter toolbar: debounced text search (the debounce lives in
 * `usePlayerList`, not here — this input is intentionally uncontrolled-fast),
 * position multi-select chips, and the available/all toggle. All chips are
 * pills per DESIGN_SYSTEM.md; teal marks the active (interactive) state only.
 */
export default function BoardToolbar({
  query,
  onQueryChange,
  positions,
  onPositionsChange,
  availableOnly,
  onAvailableOnlyChange,
  matchCount,
  totalCount,
}: BoardToolbarProps) {
  const togglePosition = (position: string) => {
    onPositionsChange(
      positions.includes(position)
        ? positions.filter((p) => p !== position)
        : [...positions, position]
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-3">
      <Input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search player or team"
        aria-label="Search players by name or team"
        className="h-8 w-56"
      />
      <div
        role="group"
        aria-label="Filter by position"
        className="flex items-center gap-1.5"
      >
        {FILTER_POSITIONS.map((position) => (
          <FilterChip
            key={position}
            label={position}
            pressed={positions.includes(position)}
            onClick={() => togglePosition(position)}
          />
        ))}
      </div>
      <FilterChip
        label={availableOnly ? 'Available' : 'All players'}
        pressed={availableOnly}
        onClick={() => onAvailableOnlyChange(!availableOnly)}
      />
      <p className="ml-auto text-xs text-muted-foreground tabular-nums">
        {matchCount} of {totalCount} players
      </p>
    </div>
  )
}
