'use client'

import { ChevronDown, ChevronUp, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { DraftBoardPlayer } from '@/services/draft-board'

import PositionBadge from './position-badge'

interface DraftQueuePanelProps {
  /** Ordered sleeper_player_ids — the drafter's priority list (item 1). */
  queue: string[]
  /** Catalog lookup for name/position of each queued id (the board pool). */
  playerIndex: Map<string, DraftBoardPlayer>
  /** Whether auto-pick is armed (item 3) — shell state. */
  autoPickArmed: boolean
  onToggleArm: () => void
  /** A "my team" roster is chosen (the BPA panel's shared picker) — auto-pick
   *  needs it to know whose roster the caps apply to. */
  selfRosterChosen: boolean
  /** Session live + submittable — the same gate the Draft action uses. Arming
   *  is only meaningful while a draft is live. */
  draftEnabled: boolean
  onRemove: (playerId: string) => void
  onMove: (playerId: string, direction: 'up' | 'down') => void
}

/**
 * The draft-queue sidebar panel (Wave 3b "Draft queue and auto-pick") — the
 * home for the user-ordered priority list and the auto-pick arm control. Sits
 * below the BPA recommendations panel (they share the one "my team" choice) and
 * above the roster/recent-picks sections.
 *
 * The queue is the drafter's OWN order (item 1): reordered only here, by the
 * up/down controls, never silently by the recommendation engine. Drafted
 * entries are pruned by the shell as picks land (item 2), so the list shows
 * only still-available targets. Auto-pick (item 3) drafts the top eligible
 * queued player when Nick is on the clock and away — routed through the same
 * manual write path (first-write-wins keeps it safe against the Sleeper poller),
 * and only after a "my team" is set so the roster-aware caps have a roster.
 */
export default function DraftQueuePanel({
  queue,
  playerIndex,
  autoPickArmed,
  onToggleArm,
  selfRosterChosen,
  draftEnabled,
  onRemove,
  onMove,
}: DraftQueuePanelProps) {
  const armable = draftEnabled && selfRosterChosen
  return (
    <section
      aria-label="Draft queue"
      className="flex max-h-[20rem] shrink-0 flex-col border-b p-4"
    >
      <div className="flex items-baseline justify-between gap-2 pb-1">
        <h2 className="text-sm font-semibold">Queue</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {queue.length}
        </span>
      </div>

      {draftEnabled && (
        <div className="pb-2">
          <button
            type="button"
            aria-pressed={autoPickArmed}
            disabled={!armable}
            onClick={onToggleArm}
            className={cn(
              'inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold transition-colors',
              !armable
                ? 'cursor-not-allowed bg-muted text-muted-foreground/60'
                : autoPickArmed
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {autoPickArmed ? 'Auto-pick armed' : 'Auto-pick off'}
          </button>
          <p className="pt-1 text-[11px] text-muted-foreground">
            {selfRosterChosen
              ? 'Drafts the top eligible queued player when you are on the clock and away.'
              : 'Set your team above to enable auto-pick.'}
          </p>
        </div>
      )}

      {queue.length === 0 ? (
        <p className="py-2 text-xs text-muted-foreground">
          Queue is empty — star players on the board to build your priority list.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {queue.map((playerId, index) => {
            const player = playerIndex.get(playerId)
            const name = player?.fullName ?? playerId
            return (
              <li
                key={playerId}
                className="flex items-center gap-2 rounded-xl bg-card px-2 py-1.5"
              >
                <span className="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <PositionBadge position={player?.position ?? null} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {name}
                </span>
                <span className="flex shrink-0 items-center">
                  <button
                    type="button"
                    aria-label={`Move ${name} up`}
                    disabled={index === 0}
                    onClick={() => onMove(playerId, 'up')}
                    className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronUp aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${name} down`}
                    disabled={index === queue.length - 1}
                    onClick={() => onMove(playerId, 'down')}
                    className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronDown aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${name} from queue`}
                    onClick={() => onRemove(playerId)}
                    className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-secondary-foreground"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
