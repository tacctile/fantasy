/**
 * Roster-need signal (Wave 3b BPA item 5): a SEPARATE, independent read of one
 * roster's remaining starter demand vs. bench room, per position — never a
 * factor in the base VORP ranking.
 *
 * Hard design constraint (build-file item 5, unanimous across the panel): this
 * signal must NEVER multiply into or reorder base value. Structurally it lives
 * in its own module and item 6 attaches it as a parallel annotation field
 * alongside the value-ranked list — the two are separate, independently
 * inspectable mechanisms (value-based-drafting.md: surface value and need
 * separately, never a single blended score).
 *
 * Model (Nick-signed 2026-07-22, roster-construction-starting-lineups.md):
 * demand for ONE roster comes from that league's exact lineup shape — dedicated
 * starter slots per position, then flex slots pooled across their eligible
 * positions (the same FLEX_ELIGIBILITY home as league-wide replacement, never
 * re-derived). Bench (Sleeper `BN`) is a GENERIC shared pool, not per-position
 * (the wiki treats bench as generic waiver-liquidity capacity), so there is one
 * roster-wide `benchSlotsRemaining`, not a per-position bench count. IR/taxi are
 * roster-sync-only and out of the draft-need model (prior Nick-signed decision).
 *
 * Need kinds (Nick's Clarify decision — generic-bench "position full"):
 * - 'starter' — an open dedicated slot for the position OR an open flex slot it
 *   is eligible for (Fills starter need).
 * - 'bench'   — no open starter slot for it, but generic bench room remains
 *   (Bench depth).
 * - 'full'    — no open starter slot AND no bench room (Position full). Because
 *   bench is generic, 'full' is effectively roster-full; per-position bench caps
 *   (e.g. no 3rd QB) are deliberately an auto-pick concern for a later item, not
 *   this signal.
 *
 * Pure and deterministic, same posture as the rest of bpa/: the caller supplies
 * the roster's drafted positions (from listDraftPicks' catalog-joined
 * playerPosition) and the parsed layout; this module reads nothing itself.
 * Flex-slot consumption order among eligible positions is immaterial to every
 * output (total flex-fill count, unfilled-flex-per-position, and generic bench
 * remaining are all invariant to it), so a deterministic order is used.
 */
import type { RosterSlotLayout } from '@/services/draft-board'

import { FLEX_ELIGIBILITY } from './replacement'

export type NeedKind = 'starter' | 'bench' | 'full'

export type PositionNeed = {
  position: string
  /** Unfilled dedicated starter slots for this position. */
  dedicatedSlotsRemaining: number
  /** Open flex slots this position is eligible to fill (shared with other
   *  eligible positions — a count of "can I still start here via flex", not an
   *  exclusive allocation). */
  flexSlotsOpenEligible: number
  /** dedicatedSlotsRemaining + flexSlotsOpenEligible. > 0 ⇒ 'starter'. */
  starterSlotsRemaining: number
  needKind: NeedKind
}

export type RosterNeedSignal = {
  /** Keyed by position — every position the layout can start (dedicated labels
   *  ∪ known-flex-eligible positions). Positions the league cannot start are
   *  absent; classifyPositionNeed handles them generically. */
  byPosition: Record<string, PositionNeed>
  /** Generic bench (BN) capacity left after starters are filled. */
  benchSlotsRemaining: number
  /** Dedicated + flex starter slots the roster has already filled. */
  startersFilled: number
  /** Total dedicated + known-flex starter slots for one team. */
  totalStarterSlots: number
  /** Drafted players considered (the roster's pick count). */
  rosterPlayerCount: number
  /** Flex-family labels with no known eligibility — excluded from open-slot
   *  counting and surfaced (declared wiki silence, replacement.ts precedent). */
  unknownFlexLabels: string[]
}

type FlexSlot = { label: string; eligible: readonly string[]; slots: number }

/**
 * Compute one roster's need signal from its drafted positions and the league's
 * lineup layout (per-team counts — NOT × league size; this is a single team).
 */
export function computeRosterNeed(
  rosterPositions: readonly string[],
  layout: RosterSlotLayout
): RosterNeedSignal {
  // Roster composition by position.
  const have = new Map<string, number>()
  for (const position of rosterPositions) {
    have.set(position, (have.get(position) ?? 0) + 1)
  }

  // Fill dedicated starter slots first; track leftovers available for flex.
  const dedicatedRemaining = new Map<string, number>()
  const leftover = new Map<string, number>(have)
  let totalStarterSlots = 0
  let startersFilled = 0
  for (const [position, slots] of Object.entries(layout.dedicated)) {
    if (slots <= 0) continue
    totalStarterSlots += slots
    const filled = Math.min(leftover.get(position) ?? 0, slots)
    dedicatedRemaining.set(position, slots - filled)
    leftover.set(position, (leftover.get(position) ?? 0) - filled)
    startersFilled += filled
  }

  // Flex slots second, narrowest eligibility first (replacement.ts order).
  const knownFlex: FlexSlot[] = []
  const unknownFlexLabels: string[] = []
  for (const label of Object.keys(layout.flex).sort()) {
    const slots = layout.flex[label]
    if (slots <= 0) continue
    const eligible = FLEX_ELIGIBILITY[label]
    if (eligible === undefined) {
      unknownFlexLabels.push(label)
      continue
    }
    knownFlex.push({ label, eligible, slots })
  }
  knownFlex.sort(
    (a, b) => a.eligible.length - b.eligible.length || (a.label < b.label ? -1 : 1)
  )

  // Track unfilled flex slots per flex label so per-position open counts can be
  // summed across every flex the position is eligible for.
  const unfilledFlexByLabel = new Map<string, number>()
  for (const flex of knownFlex) {
    totalStarterSlots += flex.slots
    let filled = 0
    for (let i = 0; i < flex.slots; i += 1) {
      // Consume one leftover from any eligible position (deterministic order).
      const source = flex.eligible.find((position) => (leftover.get(position) ?? 0) > 0)
      if (source === undefined) break
      leftover.set(source, (leftover.get(source) ?? 0) - 1)
      filled += 1
    }
    startersFilled += filled
    unfilledFlexByLabel.set(flex.label, flex.slots - filled)
  }

  // Generic bench: players not consumed by any starter slot land on the bench;
  // remaining capacity is layout.bench minus that, floored at 0.
  let benchUsed = 0
  for (const count of leftover.values()) benchUsed += Math.max(0, count)
  const benchSlotsRemaining = Math.max(0, layout.bench - benchUsed)

  // Positions the layout can start: dedicated labels ∪ known-flex-eligible.
  const startablePositions = new Set<string>(Object.keys(layout.dedicated))
  for (const flex of knownFlex) for (const position of flex.eligible) startablePositions.add(position)

  const byPosition: Record<string, PositionNeed> = {}
  for (const position of startablePositions) {
    const dedicated = dedicatedRemaining.get(position) ?? 0
    let flexOpen = 0
    for (const flex of knownFlex) {
      if (flex.eligible.includes(position)) flexOpen += unfilledFlexByLabel.get(flex.label) ?? 0
    }
    const starterSlotsRemaining = dedicated + flexOpen
    byPosition[position] = {
      position,
      dedicatedSlotsRemaining: dedicated,
      flexSlotsOpenEligible: flexOpen,
      starterSlotsRemaining,
      needKind: classifyKind(starterSlotsRemaining, benchSlotsRemaining),
    }
  }

  return {
    byPosition,
    benchSlotsRemaining,
    startersFilled,
    totalStarterSlots,
    rosterPlayerCount: rosterPositions.length,
    unknownFlexLabels,
  }
}

/**
 * Classify one position's need against a roster's signal. Positions the league
 * can start resolve from `byPosition`; any other position (the league cannot
 * start it) has no starter slot, so it is 'bench' when bench room remains, else
 * 'full'.
 */
export function classifyPositionNeed(
  signal: RosterNeedSignal,
  position: string
): NeedKind {
  const entry = signal.byPosition[position]
  if (entry !== undefined) return entry.needKind
  return signal.benchSlotsRemaining > 0 ? 'bench' : 'full'
}

function classifyKind(starterSlotsRemaining: number, benchSlotsRemaining: number): NeedKind {
  if (starterSlotsRemaining > 0) return 'starter'
  if (benchSlotsRemaining > 0) return 'bench'
  return 'full'
}
