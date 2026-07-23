'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { fetchBpaRecommendations } from '@/app/(admin)/leagues/[leagueId]/draft/actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { NeedKind } from '@/services/bpa/need'
import type {
  BpaRecommendation,
  BpaRecommendationsContext,
} from '@/services/bpa/recommendations'
import type { PositionTierSummary } from '@/services/bpa/tiers'
import type { DraftablePlayer, LeagueRoster } from '@/services/draft-board'
import type { RecordedPick } from '@/services/draft-picks'

import { rosterLabel } from './player-row'
import PositionBadge from './position-badge'

/** How many candidates the sidebar panel shows (Nick's 2026-07-22 Clarify:
 *  8 — the "top few" glance without dominating the w-80 sidebar). */
const PANEL_TOP_N = 8

/** Need-kind → badge copy (verbatim from build-file item 7). The badge is shown
 *  ALONGSIDE the value ranking — never merged into it (item 5's hard
 *  constraint; the row is ordered purely by base VORP). */
const NEED_LABELS: Record<NeedKind, string> = {
  starter: 'Fills starter need',
  bench: 'Bench depth',
  full: 'Position full',
}

/** The tier-depth counter's positions, in standard display order (Nick's
 *  2026-07-22 Clarify — QB/RB/WR/TE only, the four decision-relevant tiered
 *  positions / build-file target bands; K/DEF tier tails are noise-prone dense
 *  ranges and late-draft afterthoughts, omitted). */
const TIER_COUNTER_POSITIONS = ['QB', 'RB', 'WR', 'TE'] as const

interface BpaRecommendationsPanelProps {
  /** platform_league_uuid — the same id the board reads. */
  leagueId: string
  /** Confirmed draft_state snapshot (shell custody). A reference change — a
   *  real pick from ANY source (manual, Sleeper poll, undo) — re-runs the query
   *  off this SAME snapshot (BPA item 9: recompute on any pick, never a second
   *  pick-event feed). The shell's fingerprint bail-out means identical
   *  snapshots keep the same reference, so a steady 5s poll does NOT refetch. */
  livePicks: RecordedPick[]
  /** The my-team picker's source (Nick-signed: no persisted "my team" marker;
   *  re-pick each session). */
  rosters: LeagueRoster[]
  /** True while the one-click Draft action is live (session active + a known
   *  league size + rosters) — the same gate the main table uses. */
  draftEnabled: boolean
  /** Players with an optimistic pick in flight — render "Drafting…" like the
   *  main row, so the panel and table agree during the reconcile window. */
  pendingPlayerIds: Set<string>
  /** THE shared draft handler (BPA item 8 — reused, never a parallel submit
   *  path). Accepts the minimal DraftablePlayer shape a recommendation
   *  satisfies. */
  onDraft: (player: DraftablePlayer, nativeRosterId: number) => void
  /** Reports this fetch's per-position tier summaries up to the shell so the
   *  positional-run badge (item 3, near the position filter) can pair the run
   *  flag with top-tier depth — the SAME context.tiers this panel already
   *  computes (no second tier compute). null while loading/errored, so the
   *  badge degrades to the run flag alone rather than showing stale depth. */
  onTiers?: (tiers: Record<string, PositionTierSummary> | null) => void
}

type PanelState =
  | { status: 'loading' }
  | {
      status: 'ready'
      recommendations: BpaRecommendation[]
      context: BpaRecommendationsContext
    }
  | { status: 'error'; reason: string }

const ERROR_MESSAGES: Record<string, string> = {
  league_not_found: 'League not found.',
  config_unusable: 'League scoring or roster settings unavailable.',
  projections_unavailable: 'No projections ingested yet.',
  unauthorized: 'Not authorized — sign in again.',
  network: 'Could not load recommendations — check the connection.',
}

function formatAdp(adpOverall: number | null): string {
  return adpOverall === null ? '—' : adpOverall.toFixed(1)
}

/** Signed VORP (one decimal, tabular): +12.4 reads clearly above replacement,
 *  −3.1 clearly below (negatives are data late in a draft, per base-value.ts). */
function formatVorp(baseValue: number): string {
  return `${baseValue >= 0 ? '+' : ''}${baseValue.toFixed(1)}`
}

/**
 * Need badge (BPA item 7) — a muted-tier chip alongside the value ranking,
 * never a value input. Teal stays reserved for live/positive (STATE.yml
 * dark-mode warning); the actionable 'starter' case borrows the warning-amber
 * tier that RosterPanel already uses for under-filled positions, keeping one
 * "this addresses a roster need" color across the surface.
 */
function NeedBadge({ kind }: { kind: NeedKind }) {
  return (
    <span
      className={cn(
        'inline-flex h-4 shrink-0 items-center rounded-full px-1.5 text-[10px] font-medium',
        kind === 'starter'
          ? 'bg-warning/10 text-warning'
          : kind === 'bench'
            ? 'bg-muted text-muted-foreground'
            : 'bg-muted text-muted-foreground/70'
      )}
    >
      {NEED_LABELS[kind]}
    </span>
  )
}

/**
 * Tier-depth counter (Wave 3b tier-cliff item 4) — the highest-leverage piece
 * of the tier system: per position, how many players remain in the best still-
 * available tier, the "reach now or wait for the next tier" signal. Consumes
 * the per-position summaries the SAME fetchBpaRecommendations call already
 * surfaced (`context.tiers` via `summarizeTiers`) — no second query and no
 * second tier compute; it recomputes for free on the panel's per-pick refetch,
 * against the shrinking undrafted pool. `topTierSize` is "N remaining in the
 * best available tier" because the pool is the undrafted set (tiers.ts).
 *
 * Strictly informational and non-blocking (league-size-scarcity-effects.md Key
 * Decisions — tier breaks are a weighted input alongside opportunity cost, NEVER
 * a rigid "draft now" trigger, and algorithmic tiers are not authoritative
 * without a qualitative review layer). Every position renders identically muted
 * (Nick's Clarify — no nearly-exhausted emphasis); tabular-nums; teal stays
 * reserved for live/interactive and amber for roster-need (STATE.yml dark-mode
 * discipline), so no new token is introduced.
 */
function TierDepthStrip({
  tiers,
}: {
  tiers: Record<string, PositionTierSummary>
}) {
  const entries = TIER_COUNTER_POSITIONS.map(
    (position) => tiers[position]
  ).filter((summary): summary is PositionTierSummary => summary !== undefined)
  if (entries.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-2">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
        Best-tier depth
      </span>
      {entries.map((summary) => (
        <span
          key={summary.position}
          className="inline-flex items-center gap-1"
          title={`${summary.topTierSize} in the best available tier · ${summary.tierCount} tier${summary.tierCount === 1 ? '' : 's'} remaining`}
        >
          <PositionBadge position={summary.position} />
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {summary.topTierSize}
          </span>
        </span>
      ))}
    </div>
  )
}

/**
 * BPA recommendations panel (Wave 3b BPA item 7) — the top of the draft-board
 * sidebar (Nick's 2026-07-22 placement), the "who should I draft now" tool.
 * Renders `getBpaRecommendations`' top-N candidates ranked PURELY by base VORP,
 * each with market ADP beside the value and its independent roster-need badge
 * shown alongside (never merged into the ranking).
 *
 * Live recompute (item 9): the fetch effect keys on `livePicks`, so any pick
 * from any source re-runs the query against the shrunk pool — realized in
 * getBpaRecommendations (pool = projections minus draft_state), not cached
 * here. Stale-while-revalidate: the prior list stays visible across refetches
 * (only the very first load shows a loading line), so picks landing every few
 * seconds don't flicker the panel empty; a request-id guard drops out-of-order
 * responses.
 *
 * My-team need signal: there is no persisted "my team" marker (Nick's Clarify —
 * re-pick each session). A picker over `rosters` sets `selfRosterId`; until one
 * is chosen the panel shows the honest pure-VORP ranking with no need badges.
 *
 * One-click draft (item 8): rows wire into the shell's shared `handleDraft`
 * through the minimal DraftablePlayer shape — the same optimistic write path
 * the main table uses, never a parallel submit. The Draft control renders on
 * the same `draftEnabled` gate; a player already pending reads "Drafting…".
 */
export default function BpaRecommendationsPanel({
  leagueId,
  livePicks,
  rosters,
  draftEnabled,
  pendingPlayerIds,
  onDraft,
  onTiers,
}: BpaRecommendationsPanelProps) {
  const [state, setState] = useState<PanelState>({ status: 'loading' })
  const [selfRosterId, setSelfRosterId] = useState<number | null>(null)
  // Monotonic request id: only the newest fetch is allowed to land, so an
  // older in-flight response (a slower earlier pick) can't clobber a newer one.
  const requestSeq = useRef(0)

  useEffect(() => {
    const seq = (requestSeq.current += 1)
    let cancelled = false
    fetchBpaRecommendations(leagueId, {
      topN: PANEL_TOP_N,
      ...(selfRosterId !== null ? { selfRosterId } : {}),
    })
      .then((result) => {
        if (cancelled || seq !== requestSeq.current) return
        if (result.ok) {
          setState({
            status: 'ready',
            recommendations: result.data.recommendations,
            context: result.data.context,
          })
        } else {
          setState({ status: 'error', reason: result.reason })
        }
      })
      .catch(() => {
        if (cancelled || seq !== requestSeq.current) return
        setState({ status: 'error', reason: 'network' })
      })
    return () => {
      cancelled = true
    }
  }, [leagueId, livePicks, selfRosterId])

  // Report tier summaries up to the shell for the positional-run badge (item 3)
  // — the same context.tiers this fetch already carries, so the badge pairs the
  // run flag with top-tier depth without a second tier compute. null unless the
  // fetch is ready, so the badge never shows stale depth.
  useEffect(() => {
    onTiers?.(state.status === 'ready' ? state.context.tiers : null)
  }, [state, onTiers])

  const selfRoster =
    selfRosterId === null
      ? null
      : (rosters.find((roster) => roster.nativeRosterId === selfRosterId) ??
        null)
  const selfLabel =
    selfRosterId === null
      ? 'Set my team'
      : selfRoster !== null
        ? rosterLabel(selfRoster)
        : `Roster ${selfRosterId}`

  return (
    <section
      aria-label="Recommendations"
      className="flex max-h-[24rem] shrink-0 flex-col border-b p-4"
    >
      <div className="flex items-baseline justify-between gap-2 pb-1">
        <h2 className="text-sm font-semibold">Recommendations</h2>
        {rosters.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="ghost" size="xs">
                  {selfLabel}
                  <ChevronDown aria-hidden />
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuLabel>My team (roster need)</DropdownMenuLabel>
              {rosters.map((roster) => (
                <DropdownMenuItem
                  key={roster.nativeRosterId}
                  onClick={() => setSelfRosterId(roster.nativeRosterId)}
                >
                  {rosterLabel(roster)}
                </DropdownMenuItem>
              ))}
              {selfRosterId !== null && (
                <DropdownMenuItem onClick={() => setSelfRosterId(null)}>
                  Clear
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <PanelBody
        state={state}
        selfRosterId={selfRosterId}
        rostersAvailable={rosters.length > 0}
        rosters={rosters}
        draftEnabled={draftEnabled}
        pendingPlayerIds={pendingPlayerIds}
        onDraft={onDraft}
      />
    </section>
  )
}

function PanelBody({
  state,
  selfRosterId,
  rostersAvailable,
  rosters,
  draftEnabled,
  pendingPlayerIds,
  onDraft,
}: {
  state: PanelState
  selfRosterId: number | null
  rostersAvailable: boolean
  rosters: LeagueRoster[]
  draftEnabled: boolean
  pendingPlayerIds: Set<string>
  onDraft: (player: DraftablePlayer, nativeRosterId: number) => void
}) {
  if (state.status === 'loading') {
    return (
      <p className="py-2 text-xs text-muted-foreground">
        Loading recommendations…
      </p>
    )
  }
  if (state.status === 'error') {
    return (
      <p className="py-2 text-xs text-muted-foreground">
        {ERROR_MESSAGES[state.reason] ?? 'Recommendations unavailable.'}
      </p>
    )
  }
  if (state.recommendations.length === 0) {
    return (
      <p className="py-2 text-xs text-muted-foreground">
        No candidates — every projected player is drafted.
      </p>
    )
  }

  const calibrationNote =
    state.context.calibration === 'structural_only'
      ? 'Ranked by value over replacement · market ADP unavailable'
      : 'Ranked by value over replacement'

  return (
    <>
      <p className="pb-2 text-[11px] text-muted-foreground">
        {calibrationNote}
        {selfRosterId === null && rostersAvailable && (
          <> · set your team for roster fit</>
        )}
      </p>
      <TierDepthStrip tiers={state.context.tiers} />
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {state.recommendations.map((rec) => (
          <RecommendationRow
            key={rec.sleeperPlayerId}
            rec={rec}
            rosters={rosters}
            draftEnabled={draftEnabled}
            pending={pendingPlayerIds.has(rec.sleeperPlayerId)}
            onDraft={onDraft}
          />
        ))}
      </ul>
    </>
  )
}

function RecommendationRow({
  rec,
  rosters,
  draftEnabled,
  pending,
  onDraft,
}: {
  rec: BpaRecommendation
  rosters: LeagueRoster[]
  draftEnabled: boolean
  pending: boolean
  onDraft: (player: DraftablePlayer, nativeRosterId: number) => void
}) {
  return (
    <li className="flex items-center gap-2 rounded-xl bg-card px-2 py-1.5">
      <PositionBadge position={rec.position} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">
            {rec.fullName ?? rec.sleeperPlayerId}
          </span>
          {rec.need !== null && <NeedBadge kind={rec.need} />}
        </span>
        <span className="block truncate text-xs text-muted-foreground tabular-nums">
          {rec.team ?? '—'} · ADP {formatAdp(rec.adpOverall)}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-semibold tabular-nums">
          {formatVorp(rec.baseValue)}
        </span>
        <span className="block text-[10px] text-muted-foreground">VORP</span>
      </span>
      {pending ? (
        <span className="w-14 shrink-0 animate-pulse text-right text-xs text-secondary-foreground">
          Drafting…
        </span>
      ) : draftEnabled ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="outline" size="xs">
                Draft
                <ChevronDown aria-hidden />
              </Button>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuLabel>Draft to roster</DropdownMenuLabel>
            {rosters.map((roster) => (
              <DropdownMenuItem
                key={roster.nativeRosterId}
                onClick={() => onDraft(rec, roster.nativeRosterId)}
              >
                {rosterLabel(roster)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </li>
  )
}
