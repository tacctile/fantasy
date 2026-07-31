/**
 * Spectator data loader (Wave 4 named-singleton #5) — the server-side entry
 * point for the read-only share-link surface. Resolves a `share_token` to its
 * league and fetches ONLY standings / matchups / power-rankings / player-card
 * data, reusing the dashboard query service (`services/dashboard.ts`) with a
 * share-token-scoped anon client. Data-access sharing is sanctioned; the
 * spectator UI is a separate rendering path that imports zero admin components
 * (MASTER_CONTEXT Access Model).
 *
 * Boundary guarantees (this module is the whole spectator read path):
 * - It NEVER imports or calls anything draft-related (draft-picks,
 *   draft-sessions, bpa) — the reused getters read only standings/matchups/
 *   power/player-card/rosters/players. `draft_state`/`draft_sessions` carry no
 *   spectator RLS policy, so they are unreachable through the anon client too;
 *   the code path simply never touches them.
 * - An invalid, revoked, or blank token resolves to a clean `invalid_token`
 *   result — never partial data, never a thrown internal error surfaced to the
 *   viewer. Isolation between leagues is enforced by RLS (the token unlocks
 *   exactly one league's rows); this loader adds the token→league resolution
 *   and the compose-only orchestration on top.
 *
 * Server-only.
 */
import { createClient } from '@/lib/supabase/spectator'
import {
  getMatchups,
  getPlayerCard,
  getPowerRankings,
  getStandings,
  listScoredWeeks,
  SECTION_UNAVAILABLE,
  settleQuery,
  toSection,
  type DashboardLeagueContext,
  type MatchupsData,
  type PlayerCardData,
  type PowerRankingsData,
  type SectionOutcome,
  type StandingsData,
} from '@/services/dashboard'

export type SpectatorDashboardData = {
  leagueId: string
  /** Resolved from the `leagues` row at token resolution, so the header
   *  survives any individual section failing. */
  context: DashboardLeagueContext
  standings: SectionOutcome<StandingsData>
  powerRankings: SectionOutcome<PowerRankingsData>
  /** Weeks the league has scored, ascending — the spectator's (current-week-only)
   *  matchup week is always the max; the array documents what exists. */
  availableWeeks: number[]
  /** The resolved week (latest scored, or the requested week when it exists),
   *  or null when nothing has been scored yet. */
  week: number | null
  /** Current-week matchups. `data: null` inside an ok outcome is the honest
   *  "nothing scored yet" state; an `unavailable` outcome means the query
   *  failed — two different things a viewer must not see conflated. */
  matchups: SectionOutcome<MatchupsData | null>
}

export type SpectatorDashboardResult =
  | { ok: true; data: SpectatorDashboardData }
  | { ok: false; reason: 'invalid_token' }

export type SpectatorPlayerCardResult =
  | { ok: true; data: PlayerCardData }
  | { ok: false; reason: 'invalid_token' | 'player_not_found' }

/**
 * Resolve a presented `share_token` to its league via the anon client. RLS
 * returns at most the single league whose token matches (share_token is
 * unique), so a blank/invalid/revoked token yields no row → `invalid_token`.
 * On success the caller gets the resolved `leagueId` and the token-scoped
 * client to run the dashboard getters through.
 */
async function resolveSpectatorLeague(shareToken: string): Promise<
  | {
      ok: true
      leagueId: string
      context: DashboardLeagueContext
      db: ReturnType<typeof createClient>
    }
  | { ok: false; reason: 'invalid_token' }
> {
  const token = shareToken.trim()
  if (token.length === 0) return { ok: false, reason: 'invalid_token' }

  const db = createClient(token)
  // Identity columns only — never share_token or owner_id. Read here (rather
  // than lifted out of the standings result) so the page keeps a titled header
  // when an individual section's query fails.
  const { data, error } = await db
    .from('leagues')
    .select('platform_league_uuid, name, platform, season_year')
    .maybeSingle()
  if (error) {
    throw new Error(`spectator league resolution failed: ${error.message}`)
  }
  if (data === null) return { ok: false, reason: 'invalid_token' }
  return {
    ok: true,
    leagueId: data.platform_league_uuid,
    context: {
      leagueId: data.platform_league_uuid,
      name: data.name,
      platform: data.platform,
      seasonYear: data.season_year,
    },
    db,
  }
}

/** Latest scored week, honoring a valid requested week; null when nothing is
 *  scored (mirrors the admin dashboard's default-week behavior). */
function pickWeek(
  requested: number | undefined,
  availableWeeks: number[]
): number | null {
  if (availableWeeks.length === 0) return null
  if (requested !== undefined && availableWeeks.includes(requested)) {
    return requested
  }
  return availableWeeks[availableWeeks.length - 1]
}

/**
 * Load the full read-only spectator dashboard for a share link: standings,
 * power rankings, and the current-week (or requested-and-valid week) matchups,
 * plus the scored-week list. One token resolution, then the dashboard getters
 * run through the token-scoped client. Returns `invalid_token` for any bad
 * token; never touches draft data.
 */
export async function loadSpectatorDashboard(
  shareToken: string,
  options?: { week?: number }
): Promise<SpectatorDashboardResult> {
  const resolved = await resolveSpectatorLeague(shareToken)
  if (!resolved.ok) return resolved
  const { db, leagueId, context } = resolved

  // Each section is settled independently (2026-07-31): one failing query
  // degrades to its own inline notice on the page instead of blanking a
  // leaguemate's whole view. A section that resolves not-found is impossible
  // here — resolution already proved the league is reachable through this
  // client — so it collapses to the same unavailable outcome as a throw
  // rather than leaking an internal inconsistency to the viewer.
  const [standings, powerRankings, availableWeeks] = await Promise.all([
    settleQuery(
      'spectator standings',
      getStandings(db, leagueId),
      SECTION_UNAVAILABLE
    ),
    settleQuery(
      'spectator powerRankings',
      getPowerRankings(db, leagueId),
      SECTION_UNAVAILABLE
    ),
    settleQuery('spectator scoredWeeks', listScoredWeeks(db, leagueId), []),
  ])

  const week = pickWeek(options?.week, availableWeeks)
  const matchupsResult =
    week === null
      ? null
      : await settleQuery(
          'spectator matchups',
          getMatchups(db, leagueId, week),
          SECTION_UNAVAILABLE
        )
  const matchups: SectionOutcome<MatchupsData | null> =
    matchupsResult === null
      ? { status: 'ok', data: null }
      : toSection(matchupsResult)

  return {
    ok: true,
    data: {
      leagueId,
      context,
      standings: toSection(standings),
      powerRankings: toSection(powerRankings),
      availableWeeks,
      week,
      matchups,
    },
  }
}

/**
 * Load one player's card for a share link — the spectator player drawer's data.
 * Resolves the token, then the same `getPlayerCard` the admin surface uses,
 * through the token-scoped client. `invalid_token` for a bad token,
 * `player_not_found` for an unknown player id.
 */
export async function loadSpectatorPlayerCard(
  shareToken: string,
  sleeperPlayerId: string
): Promise<SpectatorPlayerCardResult> {
  const resolved = await resolveSpectatorLeague(shareToken)
  if (!resolved.ok) return { ok: false, reason: 'invalid_token' }

  const card = await getPlayerCard(resolved.db, sleeperPlayerId, resolved.leagueId)
  if (!card.ok) {
    return card.reason === 'player_not_found'
      ? { ok: false, reason: 'player_not_found' }
      : { ok: false, reason: 'invalid_token' }
  }
  return { ok: true, data: card.data }
}
