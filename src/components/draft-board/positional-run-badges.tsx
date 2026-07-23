'use client'

import type { RunBoard } from '@/services/bpa/runs'
import type { PositionTierSummary } from '@/services/bpa/tiers'

import PositionBadge from './position-badge'

/**
 * Positional-run badges (Wave 3b positional-run item 3) — a non-blocking inline
 * signal beside the board's position filter that several managers are taking the
 * same position in quick succession (in-season-management/
 * positional-run-detection-draft-day). NEVER a modal or blocking interrupt: a
 * run is a weighted input to Nick's own plan, not a "draft now" trigger (that
 * page's Core Knowledge — platform visual pressure must not by itself override a
 * pre-built draft plan; the same posture the tier-depth strip follows).
 *
 * COMPOSED FROM TWO INDEPENDENT SIGNALS (Nick's 2026-07-23 Clarify):
 *  - the run flag itself — `runBoard`, computed client-side by the pure
 *    `detectPositionalRuns` on the shell's `livePicks` snapshot (NOT routed
 *    through the recommendations query — run detection is deliberately decoupled
 *    from the value path, positional-run item 4);
 *  - top-tier depth — `tiers[position].topTierSize`, lifted up from the BPA
 *    panel's already-computed `context.tiers` (the SAME summarizeTiers result,
 *    no second tier compute). This is the wiki's refinement that a run matters
 *    materially only when it crosses a tier cliff (draining a group of
 *    comparable players), not whenever the raw count rises — so the tooltip
 *    pairs the count with how much of the best available tier is left.
 *
 * `tiers` is null when the BPA panel is unmounted (the sidebar is hidden below
 * `lg`) — the badge then degrades honestly to the run flag alone, omitting the
 * top-tier clause rather than inventing depth.
 *
 * Appear-only (Nick's Clarify): renders nothing when no position is running; one
 * badge per active run, in the pure layer's count-desc → position-asc order.
 * Uniform muted styling (no alarm/scarcity color); the position's identity color
 * rides only the reused PositionBadge chip, no new token (STATE.yml dark-mode
 * discipline).
 */
export default function PositionalRunBadges({
  runBoard,
  tiers,
}: {
  runBoard: RunBoard
  tiers: Record<string, PositionTierSummary> | null
}) {
  if (runBoard.activeRuns.length === 0) return null

  return (
    <div
      role="group"
      aria-label="Active positional runs"
      className="flex flex-wrap items-center gap-1.5"
    >
      {runBoard.activeRuns.map((position) => {
        const run = runBoard.byPosition[position]
        const topTierSize = tiers?.[position]?.topTierSize ?? null
        const tierClause =
          topTierSize === null
            ? ''
            : ` · ${topTierSize} left in the best available tier`
        return (
          <span
            key={position}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            title={`${run.countInWindow} ${position} in the last ${runBoard.windowPickCount} picks${tierClause}`}
          >
            <PositionBadge position={position} className="h-4 w-8 text-[10px]" />
            run
          </span>
        )
      })}
    </div>
  )
}
