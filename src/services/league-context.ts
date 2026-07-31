/**
 * Current-season league context (Wave 5 shared foundations) — the one resolver
 * every Wave 5 section uses to answer "which league, on which platform, with
 * what scoring and what roster shape".
 *
 * Server-only, and deliberately CLIENT-INJECTED like `services/dashboard.ts`:
 * the caller passes whichever Supabase client its path is entitled to, so the
 * admin sections read as the signed-in owner through `server.ts` and the
 * spectator sections read through the `x-share-token` anon client — one code
 * path, two entitlements, RLS as the wall in both cases. `league_config`
 * carries a spectator SELECT policy (migration 20260723072917), so the
 * spectator luck and playoff-status components can resolve real context rather
 * than being handed admin-fetched values.
 *
 * This module imports NOTHING draft-related, which is what makes it safe for
 * `services/spectator.ts` to reach (that module's boundary rule, enforced by
 * its own import-graph test). The dependency runs the other way:
 * `services/draft-board.ts` imports the slot-layout parser FROM here.
 *
 * Season scoping is structural, not a filter: a `leagues` row is already
 * per-season (unique platform + native_league_id + season_year), so resolving
 * a league IS resolving that league-season. Wave 5's "current season only"
 * rule needs no extra predicate — the same reasoning `dashboard.ts` records.
 *
 * Data-exposure boundary, same discipline as `dashboard.ts` and
 * `draft-board.ts`: explicit columns only. This module never selects or
 * returns `share_token`, `owner_id`, or a provider-native league ID.
 *
 * KNOWN GAP (flagged 2026-07-31, Nick-signed as out of this fold's scope):
 * playoff team count and seeding rules are NOT in `derived_config` and are not
 * resolved here. The playoff-picture section's own rules-resolver item owns
 * that decision; `getPowerRankings` reading raw `playoff_week_start` is the
 * precedent to follow when it does. Nothing here should guess at those field
 * names in the meantime.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The league's lineup-slot layout, parsed from `roster_settings_raw`'s
 * `roster_positions` array — the raw-column escape hatch the
 * league-configuration-data-model ADR sanctions for settings `derived_config`
 * doesn't normalize (it carries slot TOTALS only, never the per-slot shape).
 *
 * `ir` here is the raw IR-label count; display capacity should prefer
 * `derived_config`'s `ir_slot_count`, which also honours `settings.reserve_slots`.
 *
 * Moved here from `services/draft-board.ts` (Nick's Clarify 2026-07-31) so the
 * positional-breakdown and trade-fit sections — and the spectator surface —
 * share the draft board's one parser instead of growing a second one that would
 * drift the first time ESPN's roster shape lands. `draft-board.ts` re-exports
 * both the type and the parser, so its existing consumers are unchanged.
 */
export type RosterSlotLayout = {
  /** Dedicated single-position starting slots, keyed by label, layout order. */
  dedicated: Record<string, number>
  /** Flex-family starting slots (any label containing FLEX), keyed by label. */
  flex: Record<string, number>
  bench: number
  ir: number
  taxi: number
}

/**
 * Parse a `roster_settings_raw` payload into the lineup-slot layout. Shape-
 * tolerant, never throws: anything other than the Sleeper raw shape (an
 * object carrying a non-empty `roster_positions` string array) returns null
 * and the consumer degrades gracefully. Labels classify pattern-based — the
 * full label inventory is unpublished (wiki: sleeper-api/league-endpoint), so
 * BN/IR/TAXI are structural, any label containing FLEX is flex-family, and
 * everything else is a dedicated position slot (IDP labels land there
 * naturally, no closed list anywhere).
 */
export function parseRosterSlotLayout(raw: unknown): RosterSlotLayout | null {
  const record = asRecord(raw)
  if (record === null) return null
  const positions = record.roster_positions
  if (
    !Array.isArray(positions) ||
    positions.length === 0 ||
    !positions.every((slot): slot is string => typeof slot === 'string')
  ) {
    return null
  }
  const layout: RosterSlotLayout = {
    dedicated: {},
    flex: {},
    bench: 0,
    ir: 0,
    taxi: 0,
  }
  for (const label of positions) {
    if (label === 'BN') layout.bench += 1
    else if (label === 'IR') layout.ir += 1
    else if (label === 'TAXI') layout.taxi += 1
    else if (label.includes('FLEX')) {
      layout.flex[label] = (layout.flex[label] ?? 0) + 1
    } else {
      layout.dedicated[label] = (layout.dedicated[label] ?? 0) + 1
    }
  }
  return layout
}

/**
 * The league context every Wave 5 section resolves before computing anything.
 *
 * Every `derived_config`-sourced field is nullable on purpose: the column is
 * JSONB, re-derived at ingestion from whichever raw column applies for that
 * league's platform, and a league whose settings haven't synced yet must
 * degrade to an honest null rather than to an invented default. No field here
 * is ever guessed — a null means "not known", which sections render as such.
 */
export type LeagueContext = {
  /** platform_league_uuid — never a provider-native ID. */
  leagueId: string
  name: string | null
  platform: Database['public']['Enums']['platform']
  /** The league-season this row IS; Wave 5's current-season scope, structurally. */
  seasonYear: number
  ppr: number | null
  tePremium: boolean | null
  superflex: boolean | null
  activeSlotCount: number | null
  benchSlotCount: number | null
  irSlotCount: number | null
  /** Team count — the denominator for all-play, luck, and seeding maths. */
  leagueSize: number | null
  /** Null when `roster_settings_raw` is absent or not the Sleeper shape. */
  slotLayout: RosterSlotLayout | null
}

export type LeagueContextResult =
  | { ok: true; data: LeagueContext }
  | { ok: false; reason: 'league_not_found' }

/**
 * Resolve one connected league's current-season context.
 *
 * Platform-agnostic by construction — nothing here branches on Sleeper vs.
 * ESPN, and no league count is assumed anywhere (the build file's explicit
 * requirement). An ESPN league joins these sections automatically once its
 * sync lands, with `slotLayout` degrading to null until its native roster
 * shape parses, exactly as an unsynced Sleeper league does today.
 *
 * A malformed or unknown league ID is a typed not-found, never a partial
 * response — and malformed IDs are rejected before any query, so a genuine
 * database error still throws (and reaches `settleQuery`) rather than
 * masquerading as a missing league.
 */
export async function getLeagueContext(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<LeagueContextResult> {
  if (!UUID_PATTERN.test(leagueId)) return { ok: false, reason: 'league_not_found' }

  const { data: league, error: leagueError } = await db
    .from('leagues')
    .select('platform_league_uuid, name, platform, season_year')
    .eq('platform_league_uuid', leagueId)
    .maybeSingle()
  if (leagueError) {
    throw new Error(`league-context league query failed: ${leagueError.message}`)
  }
  if (league === null) return { ok: false, reason: 'league_not_found' }

  const { data: config, error: configError } = await db
    .from('league_config')
    .select('derived_config, roster_settings_raw')
    .eq('league_id', leagueId)
    .maybeSingle()
  if (configError) {
    throw new Error(`league-context config query failed: ${configError.message}`)
  }

  const derived = asRecord(config?.derived_config)

  return {
    ok: true,
    data: {
      leagueId: league.platform_league_uuid,
      name: league.name,
      platform: league.platform,
      seasonYear: league.season_year,
      ppr: derived === null ? null : asNumber(derived.ppr),
      tePremium: derived === null ? null : asBoolean(derived.te_premium),
      superflex: derived === null ? null : asBoolean(derived.superflex),
      activeSlotCount:
        derived === null ? null : asNumber(derived.active_slot_count),
      benchSlotCount:
        derived === null ? null : asNumber(derived.bench_slot_count),
      irSlotCount: derived === null ? null : asNumber(derived.ir_slot_count),
      leagueSize: derived === null ? null : asNumber(derived.league_size),
      slotLayout: parseRosterSlotLayout(config?.roster_settings_raw),
    },
  }
}

// derived_config is JSONB — parsed defensively; a malformed value degrades to
// nulls, never a throw and never an invented default.

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}
