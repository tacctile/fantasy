'use client'

import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The row-level add/remove-from-queue control (Wave 3b draft queue, item 1) —
 * a small star toggle shared by the main player rows and the BPA recommendation
 * rows so both surfaces build the ONE per-league queue (never a parallel queue).
 *
 * Neutral styling on purpose (STATE.yml dark-mode discipline): a filled
 * foreground star when queued, a muted outline when not — teal stays reserved
 * for live/interactive and amber for roster-need, so the queue marker overloads
 * neither. No new token.
 */
export default function QueueToggle({
  queued,
  onToggle,
}: {
  queued: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={queued}
      aria-label={queued ? 'Remove from queue' : 'Add to queue'}
      title={queued ? 'Remove from queue' : 'Add to queue'}
      onClick={onToggle}
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors',
        queued
          ? 'text-foreground hover:bg-muted'
          : 'text-muted-foreground/60 hover:bg-muted hover:text-secondary-foreground'
      )}
    >
      <Star aria-hidden className={cn('size-4', queued && 'fill-current')} />
    </button>
  )
}
