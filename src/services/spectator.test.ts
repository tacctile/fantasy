import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Database } from '@/lib/supabase/database.types'

/**
 * Wave 4 named-singleton #5 — the two data-boundary tests of the share-token
 * spectator surface (build items: cross-league isolation + draft_state
 * inaccessible). Rule 13 forbids test writes to the shared prolabel DB, so the
 * REAL loader + dashboard getters run against a fake in-memory client that
 * ENFORCES the spectator RLS model keyed on the presented token:
 *   - `leagues` → only the one row whose share_token matches the presented token
 *   - league-scoped tables → only rows for that token's league_id
 *   - `players` → the global catalog, but only when the token is valid
 *   - draft_state / draft_sessions → always empty (no spectator policy) AND
 *     every table access is recorded, so a test can assert the loader code path
 *     never even reaches them.
 * Live RLS (the actual wall) is verified read-only against the real database in
 * the same session; this suite is the durable regression guard on the loader
 * contract. (The third build-file boundary test — spectator RESPONSE contains
 * no admin markup — needs the spectator route/UI and rides that later fold.)
 */

const TOKEN_A = 'a'.repeat(64)
const TOKEN_B = 'b'.repeat(64)
const A_UUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const B_UUID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

type Row = Record<string, unknown>

const LEAGUE_SCOPED = new Set([
  'league_config',
  'rosters',
  'roster_players',
  'matchups',
  'standings',
  'player_scores',
])

/** Two full leagues (A, B) with distinct roster/team names so any cross-league
 *  leak is detectable, a shared global player catalog, and draft rows that must
 *  never surface through a share token. */
function seed(): Record<string, Row[]> {
  return {
    leagues: [
      { platform_league_uuid: A_UUID, share_token: TOKEN_A, platform: 'sleeper', season_year: 2026, name: 'Alpha League' },
      { platform_league_uuid: B_UUID, share_token: TOKEN_B, platform: 'sleeper', season_year: 2026, name: 'Bravo League' },
    ],
    league_config: [
      { league_id: A_UUID, roster_settings_raw: { settings: { playoff_week_start: 15 } } },
      { league_id: B_UUID, roster_settings_raw: { settings: { playoff_week_start: 15 } } },
    ],
    rosters: [
      { league_id: A_UUID, native_roster_id: 1, team_name: 'Alpha One', owner_display_name: 'alphaowner1' },
      { league_id: A_UUID, native_roster_id: 2, team_name: 'Alpha Two', owner_display_name: 'alphaowner2' },
      { league_id: B_UUID, native_roster_id: 1, team_name: 'Bravo One', owner_display_name: 'bravoowner1' },
      { league_id: B_UUID, native_roster_id: 2, team_name: 'Bravo Two', owner_display_name: 'bravoowner2' },
    ],
    standings: [
      { league_id: A_UUID, native_roster_id: 1, wins: 2, losses: 0, ties: 0, points_for: 250.5, points_against: 200.0 },
      { league_id: A_UUID, native_roster_id: 2, wins: 0, losses: 2, ties: 0, points_for: 200.0, points_against: 250.5 },
      { league_id: B_UUID, native_roster_id: 1, wins: 1, losses: 1, ties: 0, points_for: 210.0, points_against: 210.0 },
      { league_id: B_UUID, native_roster_id: 2, wins: 1, losses: 1, ties: 0, points_for: 205.0, points_against: 205.0 },
    ],
    matchups: [
      { league_id: A_UUID, native_roster_id: 1, native_matchup_id: 1, week: 1, effective_points: 120.0, is_final: true, fetched_at: '2026-09-10T00:00:00Z' },
      { league_id: A_UUID, native_roster_id: 2, native_matchup_id: 1, week: 1, effective_points: 100.0, is_final: true, fetched_at: '2026-09-10T00:00:00Z' },
      { league_id: A_UUID, native_roster_id: 1, native_matchup_id: 1, week: 2, effective_points: 125.5, is_final: false, fetched_at: '2026-09-17T00:00:00Z' },
      { league_id: A_UUID, native_roster_id: 2, native_matchup_id: 1, week: 2, effective_points: 110.0, is_final: false, fetched_at: '2026-09-17T00:00:00Z' },
      { league_id: B_UUID, native_roster_id: 1, native_matchup_id: 1, week: 1, effective_points: 130.0, is_final: true, fetched_at: '2026-09-10T00:00:00Z' },
      { league_id: B_UUID, native_roster_id: 2, native_matchup_id: 1, week: 1, effective_points: 128.0, is_final: true, fetched_at: '2026-09-10T00:00:00Z' },
    ],
    player_scores: [
      { league_id: A_UUID, week: 2, native_roster_id: 1, sleeper_player_id: 'p1', points: 22.4, was_starter: true, is_final: false, fetched_at: '2026-09-17T00:00:00Z' },
      { league_id: A_UUID, week: 2, native_roster_id: 2, sleeper_player_id: 'p2', points: 15.1, was_starter: true, is_final: false, fetched_at: '2026-09-17T00:00:00Z' },
      { league_id: A_UUID, week: 1, native_roster_id: 1, sleeper_player_id: 'p1', points: 18.0, was_starter: true, is_final: true, fetched_at: '2026-09-10T00:00:00Z' },
      { league_id: B_UUID, week: 1, native_roster_id: 1, sleeper_player_id: 'p1', points: 25.0, was_starter: true, is_final: true, fetched_at: '2026-09-10T00:00:00Z' },
    ],
    players: [
      { sleeper_player_id: 'p1', full_name: 'Global Player One', first_name: 'Global', last_name: 'Player One', position: 'RB', team: 'DET', status: 'Active', injury_status: null, fantasy_positions: ['RB'] },
      { sleeper_player_id: 'p2', full_name: 'Global Player Two', first_name: 'Global', last_name: 'Player Two', position: 'WR', team: 'GB', status: 'Active', injury_status: null, fantasy_positions: ['WR'] },
    ],
    roster_players: [
      { league_id: A_UUID, native_roster_id: 1, sleeper_player_id: 'p1', slot: 'starter' },
      { league_id: B_UUID, native_roster_id: 1, sleeper_player_id: 'p1', slot: 'starter' },
    ],
    // Present but must NEVER be reachable through a share token.
    draft_state: [
      { league_id: A_UUID, pick_number: 1, round: 1, sleeper_player_id: 'p1', native_roster_id: 1, source: 'sleeper_poll', platform: 'sleeper', season_year: 2026 },
    ],
    draft_sessions: [{ league_id: A_UUID, is_draft_active: true, activated_at: '2026-09-01T00:00:00Z' }],
  }
}

/** Chainable + thenable query builder that enforces the spectator RLS model for
 *  the presented token and records every table it is opened against. */
class FakeQuery {
  private eqs: Array<[string, unknown]> = []
  private ins: Array<[string, unknown[]]> = []

  constructor(
    private store: Record<string, Row[]>,
    private token: string,
    private table: string,
    queried: Set<string>
  ) {
    queried.add(table)
  }

  select(): this {
    return this
  }
  eq(col: string, val: unknown): this {
    this.eqs.push([col, val])
    return this
  }
  in(col: string, vals: unknown[]): this {
    this.ins.push([col, vals])
    return this
  }
  order(): this {
    return this
  }
  limit(): this {
    return this
  }

  /** RLS-visible rows for the presented token, before the query's own filters. */
  private visible(): Row[] {
    const tokenLeague =
      (this.store.leagues ?? []).find((l) => l.share_token === this.token) ?? null
    if (this.table === 'leagues') return tokenLeague ? [tokenLeague] : []
    if (this.table === 'players') return tokenLeague ? (this.store.players ?? []) : []
    // draft_state / draft_sessions carry no spectator policy → always empty.
    if (this.table === 'draft_state' || this.table === 'draft_sessions') return []
    if (LEAGUE_SCOPED.has(this.table)) {
      if (tokenLeague === null) return []
      return (this.store[this.table] ?? []).filter(
        (r) => r.league_id === tokenLeague.platform_league_uuid
      )
    }
    return []
  }

  private filtered(): Row[] {
    let rows = this.visible()
    for (const [col, val] of this.eqs) rows = rows.filter((r) => r[col] === val)
    for (const [col, vals] of this.ins) rows = rows.filter((r) => vals.includes(r[col]))
    return rows
  }

  maybeSingle(): Promise<{ data: Row | null; error: null }> {
    const rows = this.filtered()
    return Promise.resolve({ data: rows.length > 0 ? rows[0] : null, error: null })
  }

  then<T>(onFulfilled: (value: { data: Row[]; error: null }) => T): Promise<T> {
    return Promise.resolve({ data: this.filtered(), error: null }).then(onFulfilled)
  }
}

function makeFakeDb(
  store: Record<string, Row[]>,
  token: string,
  queried: Set<string>
): SupabaseClient<Database> {
  const client = {
    from(table: string) {
      return new FakeQuery(store, token, table, queried)
    },
  }
  return client as unknown as SupabaseClient<Database>
}

// The loader builds its client via createClient(token); mock it to return the
// RLS-enforcing fake so the real loader + getters run unchanged.
vi.mock('@/lib/supabase/spectator', () => ({ createClient: vi.fn() }))
import { createClient } from '@/lib/supabase/spectator'
import { loadSpectatorDashboard, loadSpectatorPlayerCard } from './spectator'

let store: Record<string, Row[]>
let queried: Set<string>

beforeEach(() => {
  store = seed()
  queried = new Set()
  vi.mocked(createClient).mockImplementation(
    (token: string) => makeFakeDb(store, token, queried) as ReturnType<typeof createClient>
  )
})

describe('spectator loader — draft data is unreachable via a share token', () => {
  it('never queries draft_state or draft_sessions loading the dashboard', async () => {
    const result = await loadSpectatorDashboard(TOKEN_A)
    expect(result.ok).toBe(true)
    expect(queried.has('draft_state')).toBe(false)
    expect(queried.has('draft_sessions')).toBe(false)
    // It does read the sanctioned surfaces.
    expect(queried.has('standings')).toBe(true)
    expect(queried.has('matchups')).toBe(true)
  })

  it('never queries draft tables loading a player card', async () => {
    const result = await loadSpectatorPlayerCard(TOKEN_A, 'p1')
    expect(result.ok).toBe(true)
    expect(queried.has('draft_state')).toBe(false)
    expect(queried.has('draft_sessions')).toBe(false)
  })
})

describe('spectator loader — a share token exposes only its own league', () => {
  it("returns league A's teams and nothing from league B", async () => {
    const result = await loadSpectatorDashboard(TOKEN_A)
    if (!result.ok) throw new Error('expected ok')
    const standingsTeams = result.data.standings.teams.map((t) => t.teamName)
    const powerTeams = result.data.powerRankings.teams.map((t) => t.teamName)
    expect(new Set(standingsTeams)).toEqual(new Set(['Alpha One', 'Alpha Two']))
    expect(new Set(powerTeams)).toEqual(new Set(['Alpha One', 'Alpha Two']))
    // No league-B roster/team identity anywhere in the response.
    expect(JSON.stringify(result)).not.toContain('Bravo')
    expect(result.data.context.leagueId).toBe(A_UUID)
  })

  it("returns league B's teams from the SAME loader — isolation is per token", async () => {
    const result = await loadSpectatorDashboard(TOKEN_B)
    if (!result.ok) throw new Error('expected ok')
    const standingsTeams = result.data.standings.teams.map((t) => t.teamName)
    expect(new Set(standingsTeams)).toEqual(new Set(['Bravo One', 'Bravo Two']))
    const json = JSON.stringify(result)
    expect(json).not.toContain('Alpha One')
    expect(json).not.toContain('Alpha Two')
    expect(result.data.context.leagueId).toBe(B_UUID)
  })
})

describe('spectator loader — invalid / revoked tokens resolve to not-found', () => {
  it('returns invalid_token for an unknown token and queries no data tables', async () => {
    const result = await loadSpectatorDashboard('z'.repeat(64))
    expect(result).toEqual({ ok: false, reason: 'invalid_token' })
    // Resolution touched leagues; the short-circuit reached no data surface.
    expect(queried.has('leagues')).toBe(true)
    expect(queried.has('standings')).toBe(false)
    expect(queried.has('matchups')).toBe(false)
    expect(queried.has('player_scores')).toBe(false)
  })

  it('returns invalid_token for a blank token without opening a client', async () => {
    const result = await loadSpectatorDashboard('   ')
    expect(result).toEqual({ ok: false, reason: 'invalid_token' })
    expect(queried.size).toBe(0)
  })

  it('returns invalid_token for a player-card request with a bad token', async () => {
    const result = await loadSpectatorPlayerCard('z'.repeat(64), 'p1')
    expect(result).toEqual({ ok: false, reason: 'invalid_token' })
  })
})

describe('spectator loader — week selection and player-card resolution', () => {
  it('defaults to the latest scored week and honors a valid requested week', async () => {
    const latest = await loadSpectatorDashboard(TOKEN_A)
    if (!latest.ok) throw new Error('expected ok')
    expect(latest.data.availableWeeks).toEqual([1, 2])
    expect(latest.data.week).toBe(2)

    const requested = await loadSpectatorDashboard(TOKEN_A, { week: 1 })
    if (!requested.ok) throw new Error('expected ok')
    expect(requested.data.week).toBe(1)

    const outOfRange = await loadSpectatorDashboard(TOKEN_A, { week: 99 })
    if (!outOfRange.ok) throw new Error('expected ok')
    expect(outOfRange.data.week).toBe(2)
  })

  it('resolves a known player and reports player_not_found for an unknown one', async () => {
    const found = await loadSpectatorPlayerCard(TOKEN_A, 'p1')
    if (!found.ok) throw new Error('expected ok')
    expect(found.data.player.sleeperPlayerId).toBe('p1')
    expect(found.data.context.leagueId).toBe(A_UUID)

    const missing = await loadSpectatorPlayerCard(TOKEN_A, 'does-not-exist')
    expect(missing).toEqual({ ok: false, reason: 'player_not_found' })
  })
})
