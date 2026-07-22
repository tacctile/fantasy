import { cn } from '@/lib/utils'

interface PositionBadgeProps {
  /** Sleeper catalog `position` — null renders a neutral badge, never hidden. */
  position: string | null
  className?: string
}

// Position → token class pairs (fill at low opacity + full-strength text, the
// chip-carries-color pattern). Positions outside the canonical six (the ADP
// ingestion's Nick-signed position set) fall back to the neutral secondary
// treatment rather than inventing a color.
const POSITION_CLASSES: Record<string, string> = {
  QB: 'bg-pos-qb/15 text-pos-qb',
  RB: 'bg-pos-rb/15 text-pos-rb',
  WR: 'bg-pos-wr/15 text-pos-wr',
  TE: 'bg-pos-te/15 text-pos-te',
  K: 'bg-pos-k/15 text-pos-k',
  DEF: 'bg-pos-def/15 text-pos-def',
}

/**
 * Pill badge carrying a player's position identity color (DESIGN_SYSTEM.md
 * position tokens — badges only, never row tints). Fixed width keeps the
 * position column scannable straight down the board.
 */
export default function PositionBadge({
  position,
  className,
}: PositionBadgeProps) {
  const positionClasses =
    position !== null ? POSITION_CLASSES[position] : undefined
  return (
    <span
      className={cn(
        'inline-flex h-5 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        positionClasses ?? 'bg-secondary text-secondary-foreground',
        className
      )}
    >
      {position ?? '—'}
    </span>
  )
}
