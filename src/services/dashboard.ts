/**
 * League-dashboard query service (Wave 4): standings, matchups, power
 * rankings, and player cards for one league's dashboard surfaces.
 * Server-only. The owner (admin) dashboard is the primary consumer, reading
 * through the RLS server client as the signed-in admin. Wave 4's spectator
 * loader MAY reuse these query functions with its own share_token-scoped
 * client — shared data-access logic is sanctioned, shared UI never is; the
 * spectator page stays a genuinely separate rendering path (Access Model,
 * MASTER_CONTEXT.md). Never re-derive the standings ordering or the
 * power-ranking formula elsewhere — this module is their single home.
 *
 * Data-exposure boundary (same discipline as services/draft-board.ts):
 * every query selects explicit columns. This module never selects or
 * returns `share_token`, `owner_id`, provider-native league IDs, or any
 * `draft_state` row. An unknown, malformed, or inaccessible `league_id`
 * resolves to a typed not-found result — never a partial response
 * (malformed IDs are rejected before any query so genuine database errors
 * still throw rather than masquerading as not-found).
 *
 * Standings ordering (Nick-signed 2026-07-22): wins desc → points_for desc
 * → native_roster_id asc, rank = position in that order, flat (no division
 * grouping) in v1. Sleeper's league settings map documents no
 * standings-ordering or tiebreaker key (wiki: sleeper-api/league-endpoint —
 * declared silence), so ordering is a platform decision, not a wire value.
 *
 * Matchup pairing (wiki: sleeper-api/matchup-endpoint; Nick-signed
 * 2026-07-22): rows group on `native_matchup_id` with nulls excluded from
 * grouping (a null is a bye/no-opponent week, returned as an unpaired
 * entry); a group of exactly two is a head-to-head pair; any other group
 * size degrades to unpaired entries plus a response-level anomaly flag —
 * never a forced pairing, never a throw. A side's weekly total is the
 * stored `effective_points` (commissioner override precedence realized
 * once in schema). Score lines are `player_scores` rows as-received —
 * platform-scored at ingestion, never computed here — with `was_starter`
 * and the `fetched_at`/`is_final` freshness machinery passed through for
 * the dashboard UI to surface.
 *
 * Season scoping is structural: a `leagues` row is already per-season
 * (unique platform + native_league_id + season_year), so every league-scoped
 * read here is inherently that league-season's data — no season filter is
 * needed or meaningful on top of `league_id`.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type DashboardLeagueContext = {
  /** platform_league_uuid — never a provider-native ID. */
  leagueId: string
  name: string | null
  platform: Database['public']['Enums']['platform']
  seasonYear: number
}

export type StandingsTeam = {
  nativeRosterId: number
  teamName: string | null
  ownerDisplayName: string | null
  /** 1-based position under the Nick-signed ordering (wins → PF → id). */
  rank: number
  wins: number
  losses: number
  ties: number
  pointsFor: number
  pointsAgainst: number
}

export type StandingsData = {
  context: DashboardLeagueContext
  teams: StandingsTeam[]
}

export type StandingsResult =
  | { ok: true; data: StandingsData }
  | { ok: false; reason: 'league_not_found' }

export type MatchupPlayerScore = {
  sleeperPlayerId: string
  fullName: string | null
  position: string | null
  team: string | null
  /** As-received platform-scored value — zero and negatives are legitimate. */
  points: number
  wasStarter: boolean
  isFinal: boolean
  fetchedAt: string | null
}

export type MatchupSide = {
  nativeRosterId: number
  teamName: string | null
  ownerDisplayName: string | null
  /** Stored effective_points: commissioner override when present, else the
   *  platform-computed total. Null when the platform hasn't scored the week. */
  effectivePoints: number | null
  isFinal: boolean
  fetchedAt: string | null
  /** Full-roster score lines for the week (was_starter distinguishes
   *  starters), ordered starters first, then points desc, then player id. */
  playerScores: MatchupPlayerScore[]
}

export type MatchupPair = {
  nativeMatchupId: number
  /** Ordered by native_roster_id asc — Sleeper has no home/away. */
  sides: [MatchupSide, MatchupSide]
}

export type MatchupsData = {
  context: DashboardLeagueContext
  week: number
  /** Head-to-head pairs, ordered by native_matchup_id asc. */
  pairs: MatchupPair[]
  /** Bye/no-opponent roster-weeks, plus any rows from anomalous groups. */
  unpaired: MatchupSide[]
  /** True when any non-null matchup group had a size other than two —
   *  those rows are in `unpaired`, never silently forced into pairs. */
  hasPairingAnomaly: boolean
}

export type MatchupsResult =
  | { ok: true; data: MatchupsData }
  | { ok: false; reason: 'league_not_found' | 'invalid_week' }

export type PowerRankingTeam = {
  nativeRosterId: number
  teamName: string | null
  ownerDisplayName: string | null
  /** 1-based position under all-play win% desc → PF desc → roster id asc. */
  rank: number
  allPlayWins: number
  allPlayLosses: number
  allPlayTies: number
  /** (W + T/2) / (W+L+T); 0 when no weeks have been counted yet. */
  allPlayWinPct: number
  /** Sum of effective_points over the counted weeks (self-consistent with
   *  the all-play computation — not the standings table's cumulative PF). */
  pointsFor: number
  /** This team's rank under the standings ordering; null if the team has no
   *  standings row yet. */
  standingsRank: number | null
  /** standingsRank − rank: positive = stronger than the record shows. */
  rankDelta: number | null
}

export type PowerRankingsData = {
  context: DashboardLeagueContext
  teams: PowerRankingTeam[]
  /** Weeks that fed the computation (≥2 scored rosters in the week). */
  weeksCounted: number
  /** Counted weeks containing any non-final score — surface as provisional. */
  nonFinalWeeksCounted: number
  /** Under ~6 counted weeks an all-play reading is sample-noise-dominated
   *  (wiki: points-for-against-luck-analysis) — the UI must flag it. */
  lowConfidence: boolean
}

export type PowerRankingsResult =
  | { ok: true; data: PowerRankingsData }
  | { ok: false; reason: 'league_not_found' }

export type PlayerCardWeekEntry =
  | {
      week: number
      status: 'scored'
      /** As-received platform-scored value — zero and negatives legitimate. */
      points: number
      wasStarter: boolean
      isFinal: boolean
      fetchedAt: string | null
      /** The roster holding the player that week — player_scores is the only
       *  historical per-week attribution record (roster_players is
       *  current-snapshot), so mid-season moves are visible here. */
      nativeRosterId: number
      teamName: string | null
      ownerDisplayName: string | null
    }
  | {
      /** A league-scored week with no row for this player: the player was on
       *  no roster (Nick-signed FA-week gap — rendered honestly, never an
       *  invented zero). */
      week: number
      status: 'not_rostered'
    }

export type PlayerCardRosterStatus =
  | {
      availability: 'rostered'
      nativeRosterId: number
      teamName: string | null
      ownerDisplayName: string | null
      slot: Database['public']['Enums']['roster_slot']
    }
  | { availability: 'available' }

export type PlayerCardData = {
  context: DashboardLeagueContext
  player: {
    sleeperPlayerId: string
    fullName: string | null
    firstName: string | null
    lastName: string | null
    position: string | null
    fantasyPositions: string[] | null
    team: string | null
    /** Sleeper roster-status and injury designation are independent fields —
     *  read together, never collapsed (sleeper-api/player-data-quirks). */
    status: string | null
    injuryStatus: string | null
  }
  rosterStatus: PlayerCardRosterStatus
  /** One entry per league-scored week, week asc — scored rows as-received,
   *  gaps as explicit not_rostered entries. */
  weeks: PlayerCardWeekEntry[]
}

export type PlayerCardResult =
  | { ok: true; data: PlayerCardData }
  | { ok: false; reason: 'league_not_found' | 'player_not_found' }

/**
 * Resolve the league's identity context, or null when the ID is malformed
 * or no such league is connected. Explicit columns only — the module
 * boundary discipline applies here and to every query built on top of it.
 */
async function fetchLeagueContext(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<DashboardLeagueContext | null> {
  if (!UUID_PATTERN.test(leagueId)) return null
  const { data, error } = await db
    .from('leagues')
    .select('platform_league_uuid, name, platform, season_year')
    .eq('platform_league_uuid', leagueId)
    .maybeSingle()
  if (error) throw new Error(`dashboard league query failed: ${error.message}`)
  if (data === null) return null
  return {
    leagueId: data.platform_league_uuid,
    name: data.name,
    platform: data.platform,
    seasonYear: data.season_year,
  }
}

type RosterNames = {
  teamName: string | null
  ownerDisplayName: string | null
}

/** Display names per native_roster_id — mutable attributes, never join keys. */
async function fetchRosterNames(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<Map<number, RosterNames>> {
  const { data, error } = await db
    .from('rosters')
    .select('native_roster_id, team_name, owner_display_name')
    .eq('league_id', leagueId)
  if (error) throw new Error(`dashboard rosters query failed: ${error.message}`)
  return new Map(
    data.map((row) => [
      row.native_roster_id,
      { teamName: row.team_name, ownerDisplayName: row.owner_display_name },
    ])
  )
}

/**
 * Current standings for one connected league: team records and points
 * for/against from the `standings` snapshot, display names joined from
 * `rosters`, ordered wins desc → points_for desc → native_roster_id asc.
 * An empty teams array is the honest state for a league whose rosters
 * haven't synced yet — not an error.
 */
export async function getStandings(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<StandingsResult> {
  const context = await fetchLeagueContext(db, leagueId)
  if (context === null) return { ok: false, reason: 'league_not_found' }

  const ranked = await fetchRankedStandings(db, leagueId)
  const rosterNames = await fetchRosterNames(db, leagueId)

  const teams: StandingsTeam[] = ranked.map((row) => {
    const names = rosterNames.get(row.nativeRosterId)
    return {
      nativeRosterId: row.nativeRosterId,
      teamName: names?.teamName ?? null,
      ownerDisplayName: names?.ownerDisplayName ?? null,
      rank: row.rank,
      wins: row.wins,
      losses: row.losses,
      ties: row.ties,
      pointsFor: row.pointsFor,
      pointsAgainst: row.pointsAgainst,
    }
  })

  return { ok: true, data: { context, teams } }
}

type RankedStandingsRow = {
  nativeRosterId: number
  rank: number
  wins: number
  losses: number
  ties: number
  pointsFor: number
  pointsAgainst: number
}

/**
 * Standings rows under the Nick-signed ordering (wins desc → points_for
 * desc → native_roster_id asc), ranked 1..N. The single definition of
 * standings order — getStandings renders it and getPowerRankings' rank-delta
 * compares against it; there are never two orderings to drift apart.
 */
async function fetchRankedStandings(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<RankedStandingsRow[]> {
  const { data, error } = await db
    .from('standings')
    .select('native_roster_id, wins, losses, ties, points_for, points_against')
    .eq('league_id', leagueId)
  if (error) throw new Error(`standings query failed: ${error.message}`)

  const rows = data.map((row) => ({
    nativeRosterId: row.native_roster_id,
    wins: row.wins,
    losses: row.losses,
    ties: row.ties,
    pointsFor: Number(row.points_for),
    pointsAgainst: Number(row.points_against),
  }))
  rows.sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins
    if (a.pointsFor !== b.pointsFor) return b.pointsFor - a.pointsFor
    return a.nativeRosterId - b.nativeRosterId
  })
  return rows.map((row, index) => ({ ...row, rank: index + 1 }))
}

const MIN_WEEK = 1
const MAX_WEEK = 18
const SELECT_CHUNK_SIZE = 500

/**
 * One week's matchups for a connected league: head-to-head pairs
 * reconstructed by grouping on native_matchup_id (nulls = byes, returned
 * unpaired; non-two-sized groups degrade to unpaired + anomaly flag), each
 * side carrying its stored effective_points and full-roster score lines
 * from player_scores. An empty week (unsynced or unplayed) returns empty
 * pairs/unpaired — the honest state, not an error.
 */
export async function getMatchups(
  db: SupabaseClient<Database>,
  leagueId: string,
  week: number
): Promise<MatchupsResult> {
  if (!Number.isInteger(week) || week < MIN_WEEK || week > MAX_WEEK) {
    return { ok: false, reason: 'invalid_week' }
  }
  const context = await fetchLeagueContext(db, leagueId)
  if (context === null) return { ok: false, reason: 'league_not_found' }

  const { data: matchupRows, error: matchupsError } = await db
    .from('matchups')
    .select('native_roster_id, native_matchup_id, effective_points, is_final, fetched_at')
    .eq('league_id', leagueId)
    .eq('week', week)
  if (matchupsError) {
    throw new Error(`matchups query failed: ${matchupsError.message}`)
  }

  const { data: scoreRows, error: scoresError } = await db
    .from('player_scores')
    .select('sleeper_player_id, native_roster_id, points, was_starter, is_final, fetched_at')
    .eq('league_id', leagueId)
    .eq('week', week)
  if (scoresError) {
    throw new Error(`matchup player-scores query failed: ${scoresError.message}`)
  }

  const rosterNames = await fetchRosterNames(db, leagueId)

  type PlayerIdentity = {
    full_name: string | null
    position: string | null
    team: string | null
  }
  const playerIds = [...new Set(scoreRows.map((row) => row.sleeper_player_id))]
  const playersById = new Map<string, PlayerIdentity>()
  for (let offset = 0; offset < playerIds.length; offset += SELECT_CHUNK_SIZE) {
    const chunk = playerIds.slice(offset, offset + SELECT_CHUNK_SIZE)
    const { data: playerRows, error: playersError } = await db
      .from('players')
      .select('sleeper_player_id, full_name, position, team')
      .in('sleeper_player_id', chunk)
    if (playersError) {
      throw new Error(`matchup players query failed: ${playersError.message}`)
    }
    for (const row of playerRows) {
      playersById.set(row.sleeper_player_id, {
        full_name: row.full_name,
        position: row.position,
        team: row.team,
      })
    }
  }

  const linesByRoster = new Map<number, MatchupPlayerScore[]>()
  for (const row of scoreRows) {
    const identity = playersById.get(row.sleeper_player_id)
    const line: MatchupPlayerScore = {
      sleeperPlayerId: row.sleeper_player_id,
      fullName: identity?.full_name ?? null,
      position: identity?.position ?? null,
      team: identity?.team ?? null,
      points: Number(row.points),
      wasStarter: row.was_starter,
      isFinal: row.is_final,
      fetchedAt: row.fetched_at,
    }
    const lines = linesByRoster.get(row.native_roster_id)
    if (lines === undefined) linesByRoster.set(row.native_roster_id, [line])
    else lines.push(line)
  }
  for (const lines of linesByRoster.values()) {
    lines.sort((a, b) => {
      if (a.wasStarter !== b.wasStarter) return a.wasStarter ? -1 : 1
      if (a.points !== b.points) return b.points - a.points
      return a.sleeperPlayerId < b.sleeperPlayerId
        ? -1
        : a.sleeperPlayerId > b.sleeperPlayerId
          ? 1
          : 0
    })
  }

  const groups = new Map<number, MatchupSide[]>()
  const unpaired: MatchupSide[] = []
  let hasPairingAnomaly = false
  for (const row of matchupRows) {
    const names = rosterNames.get(row.native_roster_id)
    const side: MatchupSide = {
      nativeRosterId: row.native_roster_id,
      teamName: names?.teamName ?? null,
      ownerDisplayName: names?.ownerDisplayName ?? null,
      effectivePoints:
        row.effective_points === null ? null : Number(row.effective_points),
      isFinal: row.is_final,
      fetchedAt: row.fetched_at,
      playerScores: linesByRoster.get(row.native_roster_id) ?? [],
    }
    if (row.native_matchup_id === null) {
      unpaired.push(side)
      continue
    }
    const group = groups.get(row.native_matchup_id)
    if (group === undefined) groups.set(row.native_matchup_id, [side])
    else group.push(side)
  }

  const pairs: MatchupPair[] = []
  for (const [nativeMatchupId, group] of groups) {
    if (group.length === 2) {
      group.sort((a, b) => a.nativeRosterId - b.nativeRosterId)
      pairs.push({ nativeMatchupId, sides: [group[0], group[1]] })
    } else {
      hasPairingAnomaly = true
      unpaired.push(...group)
    }
  }
  pairs.sort((a, b) => a.nativeMatchupId - b.nativeMatchupId)
  unpaired.sort((a, b) => a.nativeRosterId - b.nativeRosterId)

  return {
    ok: true,
    data: { context, week, pairs, unpaired, hasPairingAnomaly },
  }
}

/**
 * Current-season power rankings (Nick-signed 2026-07-22, wiki-grounded):
 * All-Play record — each counted week, every scored roster "plays" every
 * other; season all-play win% orders the ranking (the platform's decided
 * schedule-neutral team-quality measure, per in-season-management/
 * points-for-against-luck-analysis). Regular-season weeks only, bounded by
 * the league's raw `playoff_week_start` (all scored weeks when the key is
 * unparseable). Non-final weeks count and are reported so the UI can caveat
 * provisional readings; under six counted weeks the result is flagged
 * low-confidence per the same wiki page. Weekly score ties are half-wins.
 * Tie-break: counted-week points-for desc, then native_roster_id. Rank-delta
 * compares against the standings ordering via fetchRankedStandings — the
 * same definition getStandings renders. No historical/cross-season inputs.
 */
export async function getPowerRankings(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<PowerRankingsResult> {
  const context = await fetchLeagueContext(db, leagueId)
  if (context === null) return { ok: false, reason: 'league_not_found' }

  const { data: matchupRows, error: matchupsError } = await db
    .from('matchups')
    .select('native_roster_id, week, effective_points, is_final')
    .eq('league_id', leagueId)
  if (matchupsError) {
    throw new Error(`power-rankings matchups query failed: ${matchupsError.message}`)
  }

  const { data: config, error: configError } = await db
    .from('league_config')
    .select('roster_settings_raw')
    .eq('league_id', leagueId)
    .maybeSingle()
  if (configError) {
    throw new Error(`power-rankings config query failed: ${configError.message}`)
  }
  const playoffWeekStart = parsePlayoffWeekStart(config?.roster_settings_raw)

  const rosterNames = await fetchRosterNames(db, leagueId)
  const standings = await fetchRankedStandings(db, leagueId)
  const standingsRankById = new Map(
    standings.map((row) => [row.nativeRosterId, row.rank])
  )

  type WeekScore = { rosterId: number; points: number; isFinal: boolean }
  const scoresByWeek = new Map<number, WeekScore[]>()
  for (const row of matchupRows) {
    if (row.effective_points === null) continue
    if (playoffWeekStart !== null && row.week >= playoffWeekStart) continue
    const score: WeekScore = {
      rosterId: row.native_roster_id,
      points: Number(row.effective_points),
      isFinal: row.is_final,
    }
    const scores = scoresByWeek.get(row.week)
    if (scores === undefined) scoresByWeek.set(row.week, [score])
    else scores.push(score)
  }

  type AllPlayTally = {
    wins: number
    losses: number
    ties: number
    pointsFor: number
  }
  const tallies = new Map<number, AllPlayTally>()
  const tallyFor = (rosterId: number): AllPlayTally => {
    let tally = tallies.get(rosterId)
    if (tally === undefined) {
      tally = { wins: 0, losses: 0, ties: 0, pointsFor: 0 }
      tallies.set(rosterId, tally)
    }
    return tally
  }

  let weeksCounted = 0
  let nonFinalWeeksCounted = 0
  for (const scores of scoresByWeek.values()) {
    if (scores.length < 2) continue
    weeksCounted += 1
    if (scores.some((score) => !score.isFinal)) nonFinalWeeksCounted += 1
    for (const own of scores) {
      const tally = tallyFor(own.rosterId)
      tally.pointsFor += own.points
      for (const other of scores) {
        if (other === own) continue
        if (own.points > other.points) tally.wins += 1
        else if (own.points < other.points) tally.losses += 1
        else tally.ties += 1
      }
    }
  }

  const rosterIds = new Set([...rosterNames.keys(), ...tallies.keys()])
  const unranked = [...rosterIds].map((rosterId) => {
    const names = rosterNames.get(rosterId)
    const tally = tallies.get(rosterId) ?? {
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
    }
    const games = tally.wins + tally.losses + tally.ties
    return {
      nativeRosterId: rosterId,
      teamName: names?.teamName ?? null,
      ownerDisplayName: names?.ownerDisplayName ?? null,
      allPlayWins: tally.wins,
      allPlayLosses: tally.losses,
      allPlayTies: tally.ties,
      allPlayWinPct: games === 0 ? 0 : (tally.wins + tally.ties / 2) / games,
      pointsFor: Math.round(tally.pointsFor * 100) / 100,
    }
  })

  unranked.sort((a, b) => {
    if (a.allPlayWinPct !== b.allPlayWinPct) {
      return b.allPlayWinPct - a.allPlayWinPct
    }
    if (a.pointsFor !== b.pointsFor) return b.pointsFor - a.pointsFor
    return a.nativeRosterId - b.nativeRosterId
  })

  const teams: PowerRankingTeam[] = unranked.map((team, index) => {
    const rank = index + 1
    const standingsRank = standingsRankById.get(team.nativeRosterId) ?? null
    return {
      ...team,
      rank,
      standingsRank,
      rankDelta: standingsRank === null ? null : standingsRank - rank,
    }
  })

  return {
    ok: true,
    data: {
      context,
      teams,
      weeksCounted,
      nonFinalWeeksCounted,
      lowConfidence: weeksCounted < 6,
    },
  }
}

/**
 * One player's card for one league: Sleeper-anchored identity, current
 * roster/availability status in that league, and the per-week score line —
 * scored rows as-received from player_scores (with the holding roster, the
 * only historical attribution record), and every other league-scored week
 * as an explicit not_rostered entry (Nick-signed FA-week gap: absent from
 * every platform payload, rendered honestly, never invented). Keyed on
 * `sleeper_player_id` only — ESPN players resolve through the crosswalk at
 * ingestion, so this path never branches on platform. Player IDs are opaque
 * strings, never format-checked (D/ST rows use team abbreviations).
 */
export async function getPlayerCard(
  db: SupabaseClient<Database>,
  sleeperPlayerId: string,
  leagueId: string
): Promise<PlayerCardResult> {
  const context = await fetchLeagueContext(db, leagueId)
  if (context === null) return { ok: false, reason: 'league_not_found' }
  if (sleeperPlayerId.length === 0) {
    return { ok: false, reason: 'player_not_found' }
  }

  const { data: player, error: playerError } = await db
    .from('players')
    .select(
      'sleeper_player_id, full_name, first_name, last_name, position, fantasy_positions, team, status, injury_status'
    )
    .eq('sleeper_player_id', sleeperPlayerId)
    .maybeSingle()
  if (playerError) {
    throw new Error(`player-card player query failed: ${playerError.message}`)
  }
  if (player === null) return { ok: false, reason: 'player_not_found' }

  const rosterNames = await fetchRosterNames(db, leagueId)

  const { data: membership, error: membershipError } = await db
    .from('roster_players')
    .select('native_roster_id, slot')
    .eq('league_id', leagueId)
    .eq('sleeper_player_id', sleeperPlayerId)
    .maybeSingle()
  if (membershipError) {
    throw new Error(`player-card membership query failed: ${membershipError.message}`)
  }
  const membershipNames =
    membership === null ? undefined : rosterNames.get(membership.native_roster_id)
  const rosterStatus: PlayerCardRosterStatus =
    membership === null
      ? { availability: 'available' }
      : {
          availability: 'rostered',
          nativeRosterId: membership.native_roster_id,
          teamName: membershipNames?.teamName ?? null,
          ownerDisplayName: membershipNames?.ownerDisplayName ?? null,
          slot: membership.slot,
        }

  const { data: scoreRows, error: scoresError } = await db
    .from('player_scores')
    .select('week, points, was_starter, is_final, fetched_at, native_roster_id')
    .eq('league_id', leagueId)
    .eq('sleeper_player_id', sleeperPlayerId)
  if (scoresError) {
    throw new Error(`player-card scores query failed: ${scoresError.message}`)
  }

  const { data: weekRows, error: weeksError } = await db
    .from('matchups')
    .select('week, effective_points')
    .eq('league_id', leagueId)
  if (weeksError) {
    throw new Error(`player-card weeks query failed: ${weeksError.message}`)
  }

  const scoredEntries = new Map<number, PlayerCardWeekEntry>()
  for (const row of scoreRows) {
    const names = rosterNames.get(row.native_roster_id)
    scoredEntries.set(row.week, {
      week: row.week,
      status: 'scored',
      points: Number(row.points),
      wasStarter: row.was_starter,
      isFinal: row.is_final,
      fetchedAt: row.fetched_at,
      nativeRosterId: row.native_roster_id,
      teamName: names?.teamName ?? null,
      ownerDisplayName: names?.ownerDisplayName ?? null,
    })
  }

  const leagueScoredWeeks = new Set<number>()
  for (const row of weekRows) {
    if (row.effective_points !== null) leagueScoredWeeks.add(row.week)
  }
  const allWeeks = [...new Set([...leagueScoredWeeks, ...scoredEntries.keys()])]
  allWeeks.sort((a, b) => a - b)

  const weeks: PlayerCardWeekEntry[] = allWeeks.map(
    (week) => scoredEntries.get(week) ?? { week, status: 'not_rostered' }
  )

  return {
    ok: true,
    data: {
      context,
      player: {
        sleeperPlayerId: player.sleeper_player_id,
        fullName: player.full_name,
        firstName: player.first_name,
        lastName: player.last_name,
        position: player.position,
        fantasyPositions: player.fantasy_positions,
        team: player.team,
        status: player.status,
        injuryStatus: player.injury_status,
      },
      rosterStatus,
      weeks,
    },
  }
}

/**
 * The league's regular-season boundary from raw settings — the
 * wiki-documented `playoff_week_start` key (raw-column read per the
 * league-configuration-data-model ADR's escape hatch; derived_config
 * carries no playoff fields). Null when absent, unparseable, or
 * non-positive — the caller then counts all scored weeks.
 */
function parsePlayoffWeekStart(raw: unknown): number | null {
  const record = asRecord(raw)
  const settings = record === null ? null : asRecord(record.settings)
  const value = settings?.playoff_week_start
  return typeof value === 'number' && Number.isInteger(value) && value >= 2
    ? value
    : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}
