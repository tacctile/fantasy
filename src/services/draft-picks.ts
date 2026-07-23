/**
 * Manual draft-pick write path (Wave 3b) — the app-internal mutation surface
 * for click-to-draft. Writes to the shared `draft_state` table with
 * `source='manual'`, alongside the Wave 2 Sleeper poller (`sleeper_poll`) and
 * the future ESPN poller. First-write-wins is the `(league_id, pick_number)`
 * primary key: the insert uses ON CONFLICT DO NOTHING, so a pick the poller
 * already recorded comes back as a typed `conflict`, never a rewrite —
 * recorded picks are immutable.
 *
 * Admin surface only — invoked through the auth-gated server actions under
 * the draft route, never reachable from the spectator/share-token surface.
 * Wave 3b's auto-pick mechanism writes through this same function by mandate
 * (build-file rule: auto-pick only ever writes to our own draft_state).
 *
 * Validation posture (Nick's Clarify decisions, 2026-07-22): any unclaimed
 * pick number is accepted (enables mid-draft backfill; the UI defaults to the
 * next pick), a player already in the league's draft_state is rejected
 * server-side, and round is cross-checked against `ceil(pick / league_size)`
 * when league size is known — arithmetic as a validation check only, never a
 * source of truth (sleeper-api/draft-endpoint's snake-math rule). There is
 * deliberately no absolute pick-number upper bound: total draft rounds lives
 * on the Sleeper draft object, which this schema does not persist, and no
 * bound is invented from general knowledge.
 *
 * The optional `amount` field is accepted (and persisted as given) so the
 * shared mutation signature carries 03c's auction path without a breaking
 * change — it stays null/unused for Sleeper snake drafts.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Every RecordedPick read/write returns this shape — the players embed rides
 *  the draft_state→players FK so all paths carry catalog identity. Name parts
 *  are included because DST rows have no full_name — their identity is the
 *  location/name split across the name fields (sleeper-api/dst-and-free-agents). */
const PICK_SELECT =
  'league_id, pick_number, round, sleeper_player_id, native_roster_id, source, players (full_name, first_name, last_name, position)'

export type ManualPickInput = {
  /** platform_league_uuid — never a provider-native ID. */
  leagueId: string
  pickNumber: number
  round: number
  sleeperPlayerId: string
  /** The roster receiving the player (the ownership dimension). */
  nativeRosterId: number
  /** Auction winning bid — null/omitted for snake drafts (03c signature stability). */
  amount?: number | null
}

export type ManualPickValidationReason =
  | 'league_not_found'
  | 'invalid_pick_number'
  | 'invalid_round'
  | 'round_mismatch'
  | 'invalid_player_id'
  | 'player_not_found'
  | 'roster_not_found'
  | 'player_already_drafted'
  | 'invalid_amount'

export type RecordedPick = {
  leagueId: string
  pickNumber: number
  round: number
  sleeperPlayerId: string
  nativeRosterId: number
  source: Database['public']['Enums']['draft_pick_source']
  /** Joined from the players catalog at read time (Wave 3b UI extensions
   *  item 4, Nick-signed) — never from pick metadata, which is a
   *  point-in-time snapshot per sleeper-api/draft-endpoint. Null when the
   *  catalog row lacks the field. */
  playerFullName: string | null
  playerPosition: string | null
}

export type ManualPickResult =
  | { outcome: 'accepted'; pick: RecordedPick }
  /** A different write path already recorded this pick number — its row is authoritative. */
  | { outcome: 'conflict'; existing: RecordedPick }
  | { outcome: 'validation_error'; reason: ManualPickValidationReason; message: string }

export type UndoManualPickResult =
  | { outcome: 'undone'; pick: RecordedPick }
  | { outcome: 'no_manual_picks' }
  | { outcome: 'validation_error'; reason: 'league_not_found'; message: string }

/**
 * Record a manual draft pick into `draft_state`. Validates everything the row
 * references (league, player, receiving roster, round consistency, duplicate
 * player), then inserts with first-write-wins conflict semantics — a
 * concurrent poller write for the same pick number is reported as `conflict`
 * with the authoritative row, never retried and never overwritten.
 */
export async function recordManualPick(
  db: SupabaseClient<Database>,
  input: ManualPickInput
): Promise<ManualPickResult> {
  // Malformed IDs are not-found by definition; rejecting them here keeps any
  // later query error a genuine failure (draft-board precedent).
  if (!UUID_PATTERN.test(input.leagueId)) {
    return validationError('league_not_found', 'Unknown league.')
  }
  if (!isPositiveInteger(input.pickNumber)) {
    return validationError(
      'invalid_pick_number',
      'Pick number must be a positive integer.'
    )
  }
  if (!isPositiveInteger(input.round)) {
    return validationError('invalid_round', 'Round must be a positive integer.')
  }
  const playerId = asPlayerId(input.sleeperPlayerId)
  if (playerId === null) {
    return validationError(
      'invalid_player_id',
      'Player ID must be a non-empty string.'
    )
  }
  const amount = input.amount ?? null
  if (amount !== null && !(Number.isFinite(amount) && amount >= 0)) {
    return validationError(
      'invalid_amount',
      'Amount must be a non-negative number when provided.'
    )
  }

  const { data: league, error: leagueError } = await db
    .from('leagues')
    .select('platform_league_uuid, platform, season_year')
    .eq('platform_league_uuid', input.leagueId)
    .maybeSingle()
  if (leagueError) {
    throw new Error(`manual-pick league query failed: ${leagueError.message}`)
  }
  if (league === null) {
    return validationError('league_not_found', 'Unknown league.')
  }

  // Round↔pick consistency, validation-only (sleeper-api/draft-endpoint:
  // snake arithmetic is a fallback check, never a data source). Round
  // boundaries are unaffected by reversal rounds or keeper interleaving, so
  // ceil(pick / league_size) is safe as a cross-check when size is known;
  // an unusable derived_config skips the check rather than inventing one.
  const leagueSize = await fetchLeagueSize(db, input.leagueId)
  if (leagueSize !== null) {
    const expectedRound = Math.ceil(input.pickNumber / leagueSize)
    if (input.round !== expectedRound) {
      return validationError(
        'round_mismatch',
        `Pick ${input.pickNumber} in a ${leagueSize}-team league falls in ` +
          `round ${expectedRound}, not round ${input.round}.`
      )
    }
  }

  const { data: player, error: playerError } = await db
    .from('players')
    .select('sleeper_player_id')
    .eq('sleeper_player_id', playerId)
    .maybeSingle()
  if (playerError) {
    throw new Error(`manual-pick player query failed: ${playerError.message}`)
  }
  if (player === null) {
    return validationError('player_not_found', 'Player is not in the catalog.')
  }

  const { data: roster, error: rosterError } = await db
    .from('rosters')
    .select('native_roster_id')
    .eq('league_id', input.leagueId)
    .eq('native_roster_id', input.nativeRosterId)
    .maybeSingle()
  if (rosterError) {
    throw new Error(`manual-pick roster query failed: ${rosterError.message}`)
  }
  if (roster === null) {
    return validationError(
      'roster_not_found',
      'That roster does not exist in this league.'
    )
  }

  // Server-side duplicate-player rejection (Nick's Clarify decision): the PK
  // only guards pick numbers, so the same player at a second pick number must
  // be caught here. Application-level by design — a unique constraint would
  // fight the poller's authoritative ingestion of Sleeper's own board.
  const { data: priorPick, error: priorError } = await db
    .from('draft_state')
    .select('pick_number')
    .eq('league_id', input.leagueId)
    .eq('sleeper_player_id', playerId)
    .limit(1)
    .maybeSingle()
  if (priorError) {
    throw new Error(
      `manual-pick duplicate-player query failed: ${priorError.message}`
    )
  }
  if (priorPick !== null) {
    return validationError(
      'player_already_drafted',
      `Player is already drafted at pick ${priorPick.pick_number}.`
    )
  }

  // First-write-wins: ON CONFLICT (league_id, pick_number) DO NOTHING. The
  // returned representation contains the row only if this write won.
  const { data: inserted, error: insertError } = await db
    .from('draft_state')
    .upsert(
      {
        league_id: input.leagueId,
        pick_number: input.pickNumber,
        round: input.round,
        sleeper_player_id: playerId,
        native_roster_id: input.nativeRosterId,
        source: 'manual',
        platform: league.platform,
        season_year: league.season_year,
        native_draft_id: null,
        amount,
      },
      { onConflict: 'league_id,pick_number', ignoreDuplicates: true }
    )
    .select(PICK_SELECT)
  if (insertError) {
    throw new Error(`manual-pick insert failed: ${insertError.message}`)
  }
  if (inserted.length === 1) {
    return { outcome: 'accepted', pick: toRecordedPick(inserted[0]) }
  }

  // Another write path won this pick number — surface its authoritative row.
  const { data: winner, error: winnerError } = await db
    .from('draft_state')
    .select(PICK_SELECT)
    .eq('league_id', input.leagueId)
    .eq('pick_number', input.pickNumber)
    .maybeSingle()
  if (winnerError) {
    throw new Error(`manual-pick conflict query failed: ${winnerError.message}`)
  }
  if (winner === null) {
    // Insert reported a conflict but the row is gone (e.g. undone between the
    // two statements) — a genuine transient, not a state this API models.
    throw new Error(
      `manual-pick conflict on pick ${input.pickNumber} but no row found on re-read`
    )
  }
  return { outcome: 'conflict', existing: toRecordedPick(winner) }
}

/**
 * Undo the last manual pick: deletes only the single highest-`pick_number`
 * row for the league where `source='manual'` (build-file semantics). The
 * delete is keyed by primary key AND `source='manual'`, so poller-written
 * rows are untouchable by construction — even under a race, the guard makes
 * deleting a `sleeper_poll` row impossible.
 */
export async function undoLastManualPick(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<UndoManualPickResult> {
  if (!UUID_PATTERN.test(leagueId)) {
    return {
      outcome: 'validation_error',
      reason: 'league_not_found',
      message: 'Unknown league.',
    }
  }
  const { data: league, error: leagueError } = await db
    .from('leagues')
    .select('platform_league_uuid')
    .eq('platform_league_uuid', leagueId)
    .maybeSingle()
  if (leagueError) {
    throw new Error(`undo league query failed: ${leagueError.message}`)
  }
  if (league === null) {
    return {
      outcome: 'validation_error',
      reason: 'league_not_found',
      message: 'Unknown league.',
    }
  }

  const { data: latest, error: latestError } = await db
    .from('draft_state')
    .select('pick_number')
    .eq('league_id', leagueId)
    .eq('source', 'manual')
    .order('pick_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latestError) {
    throw new Error(`undo latest-pick query failed: ${latestError.message}`)
  }
  if (latest === null) return { outcome: 'no_manual_picks' }

  const { data: deleted, error: deleteError } = await db
    .from('draft_state')
    .delete()
    .eq('league_id', leagueId)
    .eq('pick_number', latest.pick_number)
    .eq('source', 'manual')
    .select(PICK_SELECT)
  if (deleteError) {
    throw new Error(`undo delete failed: ${deleteError.message}`)
  }
  if (deleted.length === 0) {
    // The row changed between read and delete (undone elsewhere) — treat as
    // nothing left to undo rather than failing.
    return { outcome: 'no_manual_picks' }
  }
  return { outcome: 'undone', pick: toRecordedPick(deleted[0]) }
}

/**
 * Full draft_state snapshot for one league, `pick_number` ascending — the
 * client-side live sync's per-tick payload (Wave 3b, Nick-signed 2026-07-22:
 * full snapshot over incremental, so an undone pick's deleted row self-heals
 * on the next tick instead of ghosting on the board). Malformed IDs resolve
 * to an empty snapshot (listScoredWeeks precedent) so genuine query errors
 * still throw rather than masquerading as "no picks".
 */
export async function listDraftPicks(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<RecordedPick[]> {
  if (!UUID_PATTERN.test(leagueId)) return []
  const { data, error } = await db
    .from('draft_state')
    .select(PICK_SELECT)
    .eq('league_id', leagueId)
    .order('pick_number', { ascending: true })
  if (error) {
    throw new Error(`draft-picks snapshot query failed: ${error.message}`)
  }
  return data.map(toRecordedPick)
}

function toRecordedPick(row: {
  league_id: string
  pick_number: number
  round: number
  sleeper_player_id: string
  native_roster_id: number
  source: Database['public']['Enums']['draft_pick_source']
  players: {
    full_name: string | null
    first_name: string | null
    last_name: string | null
    position: string | null
  } | null
}): RecordedPick {
  // DST rows carry no full_name — their identity is the location/name split
  // across the name fields (sleeper-api/dst-and-free-agents), so compose it.
  const composed = [row.players?.first_name, row.players?.last_name]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ')
  return {
    leagueId: row.league_id,
    pickNumber: row.pick_number,
    round: row.round,
    sleeperPlayerId: row.sleeper_player_id,
    nativeRosterId: row.native_roster_id,
    source: row.source,
    playerFullName: row.players?.full_name ?? (composed.length > 0 ? composed : null),
    playerPosition: row.players?.position ?? null,
  }
}

/**
 * League size from `derived_config`, defensively parsed (malformed → null,
 * never an invented default — draft-board posture). Null skips the
 * round-consistency check.
 */
async function fetchLeagueSize(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<number | null> {
  const { data: config, error } = await db
    .from('league_config')
    .select('derived_config')
    .eq('league_id', leagueId)
    .maybeSingle()
  if (error) {
    throw new Error(`manual-pick league_config query failed: ${error.message}`)
  }
  const derived = config?.derived_config
  if (typeof derived !== 'object' || derived === null || Array.isArray(derived)) {
    return null
  }
  const size = (derived as Record<string, unknown>).league_size
  return typeof size === 'number' && Number.isInteger(size) && size > 0
    ? size
    : null
}

function validationError(
  reason: ManualPickValidationReason,
  message: string
): ManualPickResult {
  return { outcome: 'validation_error', reason, message }
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1
}

/** Opaque non-empty player ID; `"0"` is Sleeper's empty-slot sentinel. */
function asPlayerId(value: string): string | null {
  return typeof value === 'string' && value.length > 0 && value !== '0'
    ? value
    : null
}
