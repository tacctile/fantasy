/**
 * Sleeper rosters + users sync (Wave 2): fetches `/league/{league_id}/rosters`
 * and `/league/{league_id}/users` and reconciles `rosters`, `roster_players`,
 * and `standings` for that league.
 *
 * Identity follows the roster-endpoint ADR: a team is keyed by
 * (`league_id`, `roster_id`) — ownership is a nullable attribute, never part
 * of the key (orphaned and co-owned rosters are normal states, joined
 * null-tolerantly to the users response via `owner_id`/`co_owners`).
 *
 * Slot classification realizes the roster_slot enum: `starters` (positional,
 * placeholder-tolerant) → starter, `reserve` → reserve, `taxi` → taxi, and
 * bench is the mandatory three-way subtraction — `players` minus all three —
 * since Sleeper returns no bench array.
 *
 * Standings figures come from each roster's `settings` object; the split
 * integer/decimal points pairs (`fpts`/`fpts_decimal` etc.) are recombined
 * into single decimals here at ingestion and the wire pair is never stored.
 * Both tables hold current-snapshot state — this sync overwrites in place and
 * removes stale membership; historical lineups belong to matchups.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import { sleeperGet } from './client'
import type { SleeperLeagueUser, SleeperRoster } from './types'

type RosterInsert = Database['public']['Tables']['rosters']['Insert']
type RosterPlayerInsert = Database['public']['Tables']['roster_players']['Insert']
type StandingsInsert = Database['public']['Tables']['standings']['Insert']
type RosterSlot = Database['public']['Enums']['roster_slot']

export type LeagueRostersSyncResult = {
  startedAt: string
  completedAt: string
  leagueUuid: string
  seasonYear: number
  rosterCount: number
  membershipCount: number
  standingsCount: number
  /**
   * Rostered player IDs absent from our players catalog, skipped and reported
   * per Nick's 2026-07-22 ruling — never silently dropped. Non-empty means
   * the once-per-day catalog is stale relative to a new signing; the next
   * daily catalog run self-heals, then a roster re-sync picks the player up.
   */
  skippedMissingPlayerIds: string[]
}

/** Sync one Sleeper league's rosters, membership, and standings snapshot. */
export async function syncLeagueRosters(
  db: SupabaseClient<Database>,
  nativeLeagueId: string
): Promise<LeagueRostersSyncResult> {
  const startedAt = new Date().toISOString()

  const { data: leagueRow, error: leagueError } = await db
    .from('leagues')
    .select('platform_league_uuid, season_year')
    .eq('platform', 'sleeper')
    .eq('native_league_id', nativeLeagueId)
    .maybeSingle()
  if (leagueError) {
    throw new Error(`league lookup failed: ${leagueError.message}`)
  }
  if (leagueRow === null) {
    throw new Error(
      `league ${nativeLeagueId} is not connected — run the league-config sync first`
    )
  }
  const leagueUuid = leagueRow.platform_league_uuid
  const seasonYear = leagueRow.season_year

  const [rosters, users] = await Promise.all([
    sleeperGet<SleeperRoster[]>(`/league/${nativeLeagueId}/rosters`),
    sleeperGet<SleeperLeagueUser[]>(`/league/${nativeLeagueId}/users`),
  ])
  const validatedRosters = validateRosters(rosters)
  const usersById = validateUsers(users)

  const rosterRows: RosterInsert[] = []
  const membershipRows: RosterPlayerInsert[] = []
  for (const roster of validatedRosters) {
    rosterRows.push(toRosterRow(roster, leagueUuid, seasonYear, usersById))
    membershipRows.push(...toMembershipRows(roster, leagueUuid, seasonYear))
  }

  // Skip-and-record for players our catalog doesn't hold yet (FK would
  // reject them); the rest of the roster still syncs.
  const skippedMissingPlayerIds = await findMissingPlayerIds(
    db,
    membershipRows.map((row) => row.sleeper_player_id)
  )
  const missing = new Set(skippedMissingPlayerIds)
  const persistableMembership = membershipRows.filter(
    (row) => !missing.has(row.sleeper_player_id)
  )

  const { error: rostersError } = await db
    .from('rosters')
    .upsert(rosterRows, { onConflict: 'league_id,native_roster_id' })
  if (rostersError) {
    throw new Error(`rosters upsert failed: ${rostersError.message}`)
  }

  // Stale-state removal before the membership upsert: teams that vanished
  // from the response (cascades their membership/standings), then dropped
  // players. A player who changed teams is still in the current set, so the
  // delete leaves them alone and the upsert below moves them — its conflict
  // target is the one-player-one-roster unique pair, not the PK.
  const currentRosterIds = rosterRows.map((row) => row.native_roster_id)
  const { error: staleRostersError } = await db
    .from('rosters')
    .delete()
    .eq('league_id', leagueUuid)
    .not('native_roster_id', 'in', `(${currentRosterIds.join(',')})`)
  if (staleRostersError) {
    throw new Error(`stale rosters delete failed: ${staleRostersError.message}`)
  }

  const currentPlayerIds = membershipRows.map((row) => row.sleeper_player_id)
  let stalePlayersQuery = db.from('roster_players').delete().eq('league_id', leagueUuid)
  if (currentPlayerIds.length > 0) {
    const inList = `(${currentPlayerIds.map((id) => `"${id}"`).join(',')})`
    stalePlayersQuery = stalePlayersQuery.not('sleeper_player_id', 'in', inList)
  }
  const { error: stalePlayersError } = await stalePlayersQuery
  if (stalePlayersError) {
    throw new Error(`stale roster_players delete failed: ${stalePlayersError.message}`)
  }

  if (persistableMembership.length > 0) {
    const { error: membershipError } = await db
      .from('roster_players')
      .upsert(persistableMembership, { onConflict: 'league_id,sleeper_player_id' })
    if (membershipError) {
      throw new Error(`roster_players upsert failed: ${membershipError.message}`)
    }
  }

  const standingsRows: StandingsInsert[] = validatedRosters.map((roster) =>
    toStandingsRow(roster, leagueUuid, seasonYear)
  )
  const { error: standingsError } = await db
    .from('standings')
    .upsert(standingsRows, { onConflict: 'league_id,native_roster_id' })
  if (standingsError) {
    throw new Error(`standings upsert failed: ${standingsError.message}`)
  }

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    leagueUuid,
    seasonYear,
    rosterCount: rosterRows.length,
    membershipCount: persistableMembership.length,
    standingsCount: standingsRows.length,
    skippedMissingPlayerIds,
  }
}

type ValidatedRoster = SleeperRoster & { roster_id: number }

/**
 * Validate the rosters response before anything is persisted: a non-empty
 * array in which every entry carries an integer `roster_id` (the only
 * guaranteed-present identity field). Player arrays may be absent pre-draft —
 * that is a valid empty state, not a failure.
 */
function validateRosters(rosters: SleeperRoster[]): ValidatedRoster[] {
  if (!Array.isArray(rosters) || rosters.length === 0) {
    throw new Error('rosters validation failed: response is not a non-empty array')
  }
  return rosters.map((roster) => {
    if (
      typeof roster !== 'object' ||
      roster === null ||
      typeof roster.roster_id !== 'number' ||
      !Number.isInteger(roster.roster_id)
    ) {
      throw new Error('rosters validation failed: entry without an integer roster_id')
    }
    return roster as ValidatedRoster
  })
}

/**
 * Validate the users response and index by `user_id` — the only durable
 * account key. An empty array is tolerated (ownership joins are null-tolerant
 * by design); an entry without a user_id is a malformed response.
 */
function validateUsers(users: SleeperLeagueUser[]): Map<string, SleeperLeagueUser> {
  if (!Array.isArray(users)) {
    throw new Error('users validation failed: response is not an array')
  }
  const byId = new Map<string, SleeperLeagueUser>()
  for (const user of users) {
    const userId = asString(user?.user_id)
    if (userId === null) {
      throw new Error('users validation failed: entry without a user_id')
    }
    byId.set(userId, user)
  }
  return byId
}

/**
 * Raw-per-column display storage: `team_name` is the league-scoped
 * `metadata.team_name` exactly as set (missing and empty string both mean
 * unset → null), `owner_display_name` is the account label
 * (`display_name`, else `username`). The users-endpoint fallback chain —
 * team_name → display name → generated "Team {roster_id}" — is presentation
 * logic resolved at read time, never baked into stored values.
 */
function toRosterRow(
  roster: ValidatedRoster,
  leagueUuid: string,
  seasonYear: number,
  usersById: Map<string, SleeperLeagueUser>
): RosterInsert {
  const ownerNativeId = asString(roster.owner_id)
  const owner = ownerNativeId ? usersById.get(ownerNativeId) : undefined
  const ownerMetadata = asPlainObject(owner?.metadata)

  return {
    league_id: leagueUuid,
    native_roster_id: roster.roster_id,
    platform: 'sleeper',
    season_year: seasonYear,
    owner_native_id: ownerNativeId,
    co_owner_native_ids: asStringArray(roster.co_owners) ?? [],
    team_name: ownerMetadata ? asString(ownerMetadata.team_name) : null,
    owner_display_name: owner
      ? (asString(owner.display_name) ?? asString(owner.username))
      : null,
  }
}

/**
 * Classify one roster's players into roster_slot rows. Precedence when a
 * transactional window shows a player in more than one array: starter >
 * reserve > taxi; bench is strictly the three-way remainder. `starters`
 * placeholders (null/empty/"0" sentinel for an unfilled slot) are skipped as
 * players but their position still advances `starter_slot_index`, which is
 * only meaningful against the league's ordered active slot layout.
 */
function toMembershipRows(
  roster: ValidatedRoster,
  leagueUuid: string,
  seasonYear: number
): RosterPlayerInsert[] {
  const starters = Array.isArray(roster.starters) ? roster.starters : []
  const reserve = asStringArray(roster.reserve) ?? []
  const taxi = asStringArray(roster.taxi) ?? []
  const allPlayers = asStringArray(roster.players) ?? []

  const classified = new Map<string, { slot: RosterSlot; starterSlotIndex: number | null }>()

  starters.forEach((entry, index) => {
    const playerId = asPlayerId(entry)
    if (playerId === null || classified.has(playerId)) return
    classified.set(playerId, { slot: 'starter', starterSlotIndex: index })
  })
  for (const playerId of reserve) {
    if (asPlayerId(playerId) === null || classified.has(playerId)) continue
    classified.set(playerId, { slot: 'reserve', starterSlotIndex: null })
  }
  for (const playerId of taxi) {
    if (asPlayerId(playerId) === null || classified.has(playerId)) continue
    classified.set(playerId, { slot: 'taxi', starterSlotIndex: null })
  }
  // Three-way subtraction: the full squad minus starters, reserve, and taxi.
  for (const playerId of allPlayers) {
    if (asPlayerId(playerId) === null || classified.has(playerId)) continue
    classified.set(playerId, { slot: 'bench', starterSlotIndex: null })
  }

  return Array.from(classified, ([playerId, { slot, starterSlotIndex }]) => ({
    league_id: leagueUuid,
    native_roster_id: roster.roster_id,
    platform: 'sleeper' as const,
    season_year: seasonYear,
    sleeper_player_id: playerId,
    slot,
    starter_slot_index: starterSlotIndex,
    espn_lineup_slot_id: null,
  }))
}

/**
 * Standings snapshot from the roster's `settings` object. The split
 * integer/decimal points pairs recombine as int + dec/100 (`1234` + `56` →
 * `1234.56`); absent figures are genuine zeros for a fresh league.
 */
function toStandingsRow(
  roster: ValidatedRoster,
  leagueUuid: string,
  seasonYear: number
): StandingsInsert {
  const settings = asPlainObject(roster.settings) ?? {}
  return {
    league_id: leagueUuid,
    native_roster_id: roster.roster_id,
    platform: 'sleeper',
    season_year: seasonYear,
    wins: asNumber(settings.wins) ?? 0,
    losses: asNumber(settings.losses) ?? 0,
    ties: asNumber(settings.ties) ?? 0,
    points_for: recombinePoints(settings.fpts, settings.fpts_decimal),
    points_against: recombinePoints(settings.fpts_against, settings.fpts_against_decimal),
  }
}

function recombinePoints(integerPart: unknown, decimalPart: unknown): number {
  return (asNumber(integerPart) ?? 0) + (asNumber(decimalPart) ?? 0) / 100
}

/** Query which of the given player IDs are absent from our catalog. */
async function findMissingPlayerIds(
  db: SupabaseClient<Database>,
  playerIds: string[]
): Promise<string[]> {
  const unique = Array.from(new Set(playerIds))
  if (unique.length === 0) return []
  const { data, error } = await db
    .from('players')
    .select('sleeper_player_id')
    .in('sleeper_player_id', unique)
  if (error) {
    throw new Error(`players existence check failed: ${error.message}`)
  }
  const existing = new Set(data.map((row) => row.sleeper_player_id))
  return unique.filter((id) => !existing.has(id))
}

// Wire-value coercers (drift guards, same posture as the sibling services).

/**
 * A usable player-ID entry: non-empty string, excluding the "0" empty-slot
 * sentinel Sleeper uses in `starters`. D/ST team-abbreviation IDs ("DET")
 * pass through untouched — IDs are opaque strings, never numerically parsed.
 */
function asPlayerId(value: unknown): string | null {
  const id = asString(value)
  return id !== null && id !== '0' ? id : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  return value.filter((item): item is string => typeof item === 'string')
}

function asPlainObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}
