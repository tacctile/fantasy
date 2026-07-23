/**
 * Draft queue + auto-pick pure layer (Wave 3b "Draft queue and auto-pick"
 * sub-section) — a pure, client-side layer with a thin localStorage wrapper,
 * mirroring live-picks.ts / live-status.ts (the shell owns the state and the
 * effects; these functions have no React and are directly testable).
 *
 * Storage (item 1, Nick's Clarify 2026-07-23): the queue is CLIENT-SIDE, keyed
 * per league in localStorage — "per league/session" without a table on the
 * shared prolabel DB (same posture as the BPA panel's re-pick-each-session "my
 * team"; the whole queue/auto-pick sub-section stays read-only to the DB except
 * the EXISTING manual-pick write that auto-pick reuses). It is a simple ordered
 * list of `sleeper_player_id`s — the drafter's priority order, stored
 * independently of and NEVER silently reordered by the BPA/recommendation
 * engine (build-file item 1's hard rule: the recommendation ranking is a
 * parallel signal, it never rewrites the user's queue).
 *
 * Roster-construction-aware auto-pick (item 3, roster-construction-starting-
 * lineups.md): auto-pick walks the queue top-to-bottom and SKIPS a candidate
 * whose position is already stocked to a hard cap — UNLESS every draftable
 * entry is over its cap, in which case it takes the top draftable one anyway
 * (Nick's Clarify: never fail to make a pick). The cap is derived per league
 * from the actual lineup shape (dedicated starters + flex eligibility + a
 * per-position bench margin) — the wiki mandates configuration-derived roster
 * modelling and explicitly REJECTS fixed numeric rank/roster formulas, so the
 * specific margin numbers are DECLARED WIKI SILENCE (roster-construction-
 * starting-lineups.md Key Decisions + Open Question), live-tuned platform
 * constants exactly like tiers.ts's gap multiples and runs.ts's run thresholds.
 *
 * The build-file example — "a 3rd QB before the bench is otherwise full" — is
 * this cap: in a 1-QB league QB's cap is 1 dedicated + 0 flex + 1 margin = 2,
 * so a 3rd QB is skipped while any other queued entry is still under its own
 * cap; once nothing else qualifies (the bench is otherwise spoken for), the
 * fall-through takes it rather than passing the turn.
 */
import { FLEX_ELIGIBILITY } from '@/services/bpa/replacement'
import type { RosterSlotLayout } from '@/services/draft-board'

const QUEUE_KEY_PREFIX = 'fantasy:draft-queue:'

/**
 * Per-position bench margin ABOVE startable demand for the auto-pick hard cap
 * (declared wiki silence — see the module header). K/DEF get zero margin (a 2nd
 * kicker or defense is never a good auto-pick — cap = their single starter
 * slot); QB gets 1 (a backup, never a 3rd in a 1-QB league — the build-file
 * example); TE 2; RB/WR 4 (deep positions carry real bench value). Any position
 * not listed (IDP, unstartable) falls back to DEFAULT_BENCH_MARGIN. These are
 * upper bounds for a WALK-AND-SKIP heuristic, not roster-legality rules — the
 * fall-through guarantees a pick even when every cap is hit.
 */
export const AUTO_PICK_BENCH_MARGIN: Record<string, number> = {
  QB: 1,
  RB: 4,
  WR: 4,
  TE: 2,
  K: 0,
  DEF: 0,
}
const DEFAULT_BENCH_MARGIN = 3

/**
 * The hard cap on how many of one position auto-pick will stock before it
 * starts skipping that position: dedicated starter slots + every flex slot the
 * position is eligible for (upper bound — flex is shared, so counting it fully
 * per position is intentionally generous) + the position's bench margin. Reads
 * FLEX_ELIGIBILITY from THE single flex-eligibility home (replacement.ts), never
 * a re-derived map (STATE.yml centralization discipline). Format-aware for free:
 * a superflex layout makes QB flex-eligible, lifting its cap.
 */
export function positionCap(position: string, layout: RosterSlotLayout): number {
  const dedicated = layout.dedicated[position] ?? 0
  let flexEligible = 0
  for (const [label, slots] of Object.entries(layout.flex)) {
    const eligible = FLEX_ELIGIBILITY[label]
    if (eligible !== undefined && eligible.includes(position)) flexEligible += slots
  }
  const margin = AUTO_PICK_BENCH_MARGIN[position] ?? DEFAULT_BENCH_MARGIN
  return dedicated + flexEligible + margin
}

/** Add a player to the end of the queue (no-op if already present — a queue is
 *  a set with order). Pure: returns a new array. */
export function addToQueue(queue: readonly string[], playerId: string): string[] {
  return queue.includes(playerId) ? [...queue] : [...queue, playerId]
}

/** Remove a player from the queue. Pure. */
export function removeFromQueue(
  queue: readonly string[],
  playerId: string
): string[] {
  return queue.filter((id) => id !== playerId)
}

/** Toggle a player's queue membership (the row-level star action). Pure. */
export function toggleQueue(
  queue: readonly string[],
  playerId: string
): string[] {
  return queue.includes(playerId)
    ? removeFromQueue(queue, playerId)
    : addToQueue(queue, playerId)
}

/**
 * Move a queued player one slot up or down (the panel's reorder control) — the
 * ONLY way the order changes besides add/remove, and always user-driven (item
 * 1: never silently reordered by the engine). Out-of-range moves and unknown
 * ids are no-ops. Pure.
 */
export function moveInQueue(
  queue: readonly string[],
  playerId: string,
  direction: 'up' | 'down'
): string[] {
  const index = queue.indexOf(playerId)
  if (index < 0) return [...queue]
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= queue.length) return [...queue]
  const next = [...queue]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

/**
 * Drop every queued player that has been drafted (item 2 — "when a queued
 * player is drafted by anyone else, remove from queue, promote the next"). The
 * promotion is implicit: removing an entry slides the rest up, so the next
 * queued player becomes the new top. Returns both the pruned queue and the
 * removed ids so the caller can surface the non-blocking notification. Pure.
 */
export function pruneDraftedFromQueue(
  queue: readonly string[],
  isDrafted: (playerId: string) => boolean
): { queue: string[]; removed: string[] } {
  const kept: string[] = []
  const removed: string[] = []
  for (const id of queue) (isDrafted(id) ? removed : kept).push(id)
  return { queue: kept, removed }
}

/** The chosen auto-pick candidate plus why (item 3). */
export type AutoPickSelection = {
  candidateId: string
  /**
   * True when EVERY draftable queue entry was over its positional cap and the
   * top draftable entry was taken anyway (the "…before the bench is otherwise
   * full" relaxation — Nick's Clarify: never fail to make a pick).
   */
  overCapFallThrough: boolean
}

/**
 * Pick the next auto-draft candidate from the queue (item 3): walk top-to-
 * bottom, skip any draftable player whose position is already at its hard cap
 * for the roster, and return the first one under its cap. If none is under its
 * cap, fall through to the top draftable entry (never fail to pick). A null
 * position (uncatalogued) can't be capped, so it is taken rather than skipped.
 * When the layout is unknown (an unparsed roster_settings_raw), no cap can be
 * evaluated, so the top draftable entry is taken — honest degradation, never a
 * guessed cap.
 *
 * Pure and deterministic: the caller supplies availability (`isDraftable`, the
 * client merge's available set minus in-flight pending picks), the position
 * lookup, the roster's already-drafted positions, and the parsed layout. Reads
 * nothing itself.
 */
export function selectAutoPickCandidate(params: {
  queue: readonly string[]
  isDraftable: (playerId: string) => boolean
  positionOf: (playerId: string) => string | null
  rosterPositions: readonly string[]
  layout: RosterSlotLayout | null
}): AutoPickSelection | null {
  const { queue, isDraftable, positionOf, rosterPositions, layout } = params
  const draftable = queue.filter((id) => isDraftable(id))
  if (draftable.length === 0) return null
  if (layout === null) {
    return { candidateId: draftable[0], overCapFallThrough: false }
  }

  const have = new Map<string, number>()
  for (const position of rosterPositions) {
    have.set(position, (have.get(position) ?? 0) + 1)
  }

  for (const id of draftable) {
    const position = positionOf(id)
    // An uncatalogued position can't be capped — take it rather than skip.
    if (position === null) {
      return { candidateId: id, overCapFallThrough: false }
    }
    if ((have.get(position) ?? 0) < positionCap(position, layout)) {
      return { candidateId: id, overCapFallThrough: false }
    }
  }
  // Every draftable entry is over its cap — take the top one anyway.
  return { candidateId: draftable[0], overCapFallThrough: true }
}

/**
 * Load a league's queue from localStorage (client only; SSR and any storage
 * error resolve to an empty queue, never a throw). Non-string / malformed
 * entries are filtered out defensively.
 */
export function loadQueue(leagueId: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY_PREFIX + leagueId)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (id): id is string => typeof id === 'string' && id.length > 0
    )
  } catch {
    return []
  }
}

/** Persist a league's queue to localStorage (client only; storage errors are
 *  swallowed — a full/blocked store degrades to an in-memory-only queue). */
export function saveQueue(leagueId: string, queue: readonly string[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(QUEUE_KEY_PREFIX + leagueId, JSON.stringify(queue))
  } catch {
    // Non-fatal: the queue still works for this session in memory.
  }
}

/**
 * External-store adapter for `useSyncExternalStore` (item 1). localStorage is
 * an external system the server cannot read, so the queue is consumed through
 * a store rather than a useState + load effect — the endorsed hydration-safe
 * pattern (getServerSnapshot returns empty so SSR and the hydrating render
 * match, then the client adopts the stored queue with no mismatch AND no
 * setState-in-effect). The in-memory map is the snapshot source: it returns a
 * STABLE array reference per league until `setLeagueQueue` replaces it, which
 * is what keeps useSyncExternalStore from looping.
 */
type QueueListener = () => void
const queueStore = new Map<string, string[]>()
const queueListeners = new Map<string, Set<QueueListener>>()
const EMPTY_QUEUE: string[] = []

function ensureLoaded(leagueId: string): string[] {
  let current = queueStore.get(leagueId)
  if (current === undefined) {
    current = loadQueue(leagueId)
    queueStore.set(leagueId, current)
  }
  return current
}

/** useSyncExternalStore client snapshot — the league's current queue (seeded
 *  from localStorage on first read; a stable ref until a write replaces it). */
export function getQueueSnapshot(leagueId: string): string[] {
  return ensureLoaded(leagueId)
}

/** useSyncExternalStore server/hydration snapshot — always empty (localStorage
 *  is client-only), so the hydrating render matches the server output. */
export function getQueueServerSnapshot(): string[] {
  return EMPTY_QUEUE
}

/** Subscribe a component to one league's queue changes. */
export function subscribeQueue(
  leagueId: string,
  listener: QueueListener
): () => void {
  let set = queueListeners.get(leagueId)
  if (set === undefined) {
    set = new Set()
    queueListeners.set(leagueId, set)
  }
  set.add(listener)
  return () => {
    set.delete(listener)
  }
}

/** Replace a league's queue: update the in-memory store (new stable ref),
 *  persist to localStorage, and notify subscribers. The ONE queue-write path —
 *  every mutation (toggle/remove/move/prune) routes through it. */
export function setLeagueQueue(leagueId: string, next: string[]): void {
  queueStore.set(leagueId, next)
  saveQueue(leagueId, next)
  const set = queueListeners.get(leagueId)
  if (set !== undefined) for (const listener of set) listener()
}
