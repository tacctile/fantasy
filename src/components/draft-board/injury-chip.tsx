import { cn } from '@/lib/utils'

interface InjuryChipProps {
  /** Sleeper `injury_status` — null renders nothing (healthy is uncolored). */
  injuryStatus: string | null
}

// Abbreviation + severity for the designations DESIGN_SYSTEM.md names
// (Q/D → --warning, O/IR → --destructive). Sleeper's full injury_status
// enumeration is unpublished (wiki: sleeper-api/player-data-quirks), so any
// other value renders its raw tag in the muted tier — a visible flag, never
// an invented severity.
const KNOWN_DESIGNATIONS: Record<string, { label: string; className: string }> =
  {
    Questionable: { label: 'Q', className: 'bg-warning/15 text-warning' },
    Doubtful: { label: 'D', className: 'bg-warning/15 text-warning' },
    Out: { label: 'O', className: 'bg-destructive/15 text-destructive' },
    IR: { label: 'IR', className: 'bg-destructive/15 text-destructive' },
  }

/**
 * Inline injury designation chip for the player-name line (DESIGN_SYSTEM.md
 * player-row pattern: the chip carries the status color, the row never does).
 */
export default function InjuryChip({ injuryStatus }: InjuryChipProps) {
  if (injuryStatus === null || injuryStatus === '') return null
  const known = KNOWN_DESIGNATIONS[injuryStatus]
  return (
    <span
      title={injuryStatus}
      className={cn(
        'inline-flex h-4 shrink-0 items-center rounded-full px-1.5 text-[10px] font-semibold uppercase',
        known?.className ?? 'bg-muted text-muted-foreground'
      )}
    >
      {known?.label ?? injuryStatus.slice(0, 3)}
    </span>
  )
}
