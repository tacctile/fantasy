import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import type { Database } from '@/lib/supabase/database.types'

import { getLeagueContext, parseRosterSlotLayout } from './league-context'

/**
 * Wave 5 shared foundations — the league-context resolver and the slot-layout
 * parser it now owns.
 *
 * `getLeagueContext` runs against a fake in-memory client rather than the real
 * database: Rule 13 forbids test writes to the shared prolabel DB, and this
 * container has no `.env.local` to reach it read-only either. The fake records
 * every column list it is asked for, so the module's stated data-exposure
 * discipline (explicit columns; never `share_token` or `owner_id`) is asserted
 * rather than merely documented.
 *
 * The parser had no direct test before this fold — only indirect coverage
 * through the BPA suite's hand-built LAYOUT fixtures — so these lock its
 * behaviour at its new shared home, where the positional breakdown, the trade
 * positional-fit panel, and the draft board all now depend on one parser.
 */

const LEAGUE_UUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const OTHER_UUID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

type Row = Record<string, unknown>

const SLEEPER_ROSTER_RAW = {
  roster_positions: [
    'QB',
    'RB',
    'RB',
    'WR',
    'WR',
    'TE',
    'FLEX',
    'K',
    'DEF',
    'BN',
    'BN',
    'IR',
  ],
}

function seed(): Record<string, Row[]> {
  return {
    leagues: [
      {
        platform_league_uuid: LEAGUE_UUID,
        name: '10 enter 1 Leaves',
        platform: 'sleeper',
        season_year: 2026,
        share_token: 'x'.repeat(64),
        owner_id: 'owner-uuid',
      },
    ],
    league_config: [
      {
        league_id: LEAGUE_UUID,
        derived_config: {
          ppr: 0.5,
          te_premium: false,
          superflex: false,
          active_slot_count: 9,
          bench_slot_count: 2,
          ir_slot_count: 1,
          league_size: 10,
        },
        roster_settings_raw: SLEEPER_ROSTER_RAW,
      },
    ],
  }
}

type Recorder = {
  /** Column lists this client was asked for, keyed by table. */
  selects: Record<string, string[]>
  tables: string[]
}

class FakeQuery {
  private eqs: Array<[string, unknown]> = []

  constructor(
    private store: Record<string, Row[]>,
    private table: string,
    private recorder: Recorder,
    private failOn: string | null
  ) {
    recorder.tables.push(table)
  }

  select(columns: string): this {
    this.recorder.selects[this.table] = columns.split(',').map((c) => c.trim())
    return this
  }

  eq(col: string, val: unknown): this {
    this.eqs.push([col, val])
    return this
  }

  maybeSingle(): Promise<{ data: Row | null; error: { message: string } | null }> {
    if (this.failOn === this.table) {
      return Promise.resolve({ data: null, error: { message: 'boom' } })
    }
    let rows = this.store[this.table] ?? []
    for (const [col, val] of this.eqs) rows = rows.filter((r) => r[col] === val)
    return Promise.resolve({ data: rows.length > 0 ? rows[0] : null, error: null })
  }
}

function makeDb(
  store: Record<string, Row[]>,
  recorder: Recorder,
  failOn: string | null = null
): SupabaseClient<Database> {
  return {
    from: (table: string) => new FakeQuery(store, table, recorder, failOn),
  } as unknown as SupabaseClient<Database>
}

function recorder(): Recorder {
  return { selects: {}, tables: [] }
}

describe('getLeagueContext', () => {
  it('resolves identity, derived_config, and the parsed slot layout', async () => {
    const result = await getLeagueContext(makeDb(seed(), recorder()), LEAGUE_UUID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual({
      leagueId: LEAGUE_UUID,
      name: '10 enter 1 Leaves',
      platform: 'sleeper',
      seasonYear: 2026,
      ppr: 0.5,
      tePremium: false,
      superflex: false,
      activeSlotCount: 9,
      benchSlotCount: 2,
      irSlotCount: 1,
      leagueSize: 10,
      slotLayout: {
        dedicated: { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 },
        flex: { FLEX: 1 },
        bench: 2,
        ir: 1,
        taxi: 0,
      },
    })
  })

  it('never selects share_token or owner_id', async () => {
    const rec = recorder()
    await getLeagueContext(makeDb(seed(), rec), LEAGUE_UUID)
    const all = Object.values(rec.selects).flat()
    expect(all).not.toContain('share_token')
    expect(all).not.toContain('owner_id')
    expect(all).not.toContain('*')
    expect(rec.selects.leagues).toEqual([
      'platform_league_uuid',
      'name',
      'platform',
      'season_year',
    ])
  })

  it('reads only leagues and league_config — no draft or roster tables', async () => {
    const rec = recorder()
    await getLeagueContext(makeDb(seed(), rec), LEAGUE_UUID)
    expect(new Set(rec.tables)).toEqual(new Set(['leagues', 'league_config']))
  })

  it('rejects a malformed id as not-found WITHOUT querying', async () => {
    const rec = recorder()
    const result = await getLeagueContext(makeDb(seed(), rec), 'not-a-uuid')
    expect(result).toEqual({ ok: false, reason: 'league_not_found' })
    expect(rec.tables).toEqual([])
  })

  it('returns not-found for an unknown league', async () => {
    const result = await getLeagueContext(makeDb(seed(), recorder()), OTHER_UUID)
    expect(result).toEqual({ ok: false, reason: 'league_not_found' })
  })

  it('degrades a missing league_config row to nulls, identity intact', async () => {
    const store = seed()
    store.league_config = []
    const result = await getLeagueContext(makeDb(store, recorder()), LEAGUE_UUID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.name).toBe('10 enter 1 Leaves')
    expect(result.data.ppr).toBeNull()
    expect(result.data.leagueSize).toBeNull()
    expect(result.data.slotLayout).toBeNull()
  })

  it('degrades a malformed derived_config to nulls rather than inventing defaults', async () => {
    const store = seed()
    store.league_config = [
      {
        league_id: LEAGUE_UUID,
        derived_config: ['not', 'an', 'object'],
        roster_settings_raw: null,
      },
    ]
    const result = await getLeagueContext(makeDb(store, recorder()), LEAGUE_UUID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.ppr).toBeNull()
    expect(result.data.superflex).toBeNull()
    expect(result.data.slotLayout).toBeNull()
  })

  it('ignores wrong-typed derived_config values instead of coercing them', async () => {
    const store = seed()
    store.league_config = [
      {
        league_id: LEAGUE_UUID,
        derived_config: { ppr: '0.5', superflex: 'yes', league_size: null },
        roster_settings_raw: null,
      },
    ]
    const result = await getLeagueContext(makeDb(store, recorder()), LEAGUE_UUID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.ppr).toBeNull()
    expect(result.data.superflex).toBeNull()
    expect(result.data.leagueSize).toBeNull()
  })

  it('THROWS on a genuine query error so settleQuery can degrade the section', async () => {
    await expect(
      getLeagueContext(makeDb(seed(), recorder(), 'leagues'), LEAGUE_UUID)
    ).rejects.toThrow(/league-context league query failed/)
    await expect(
      getLeagueContext(makeDb(seed(), recorder(), 'league_config'), LEAGUE_UUID)
    ).rejects.toThrow(/league-context config query failed/)
  })
})

describe('parseRosterSlotLayout', () => {
  it('treats any label containing FLEX as flex-family, keyed separately', () => {
    const layout = parseRosterSlotLayout({
      roster_positions: ['SUPER_FLEX', 'REC_FLEX', 'FLEX'],
    })
    expect(layout?.flex).toEqual({ SUPER_FLEX: 1, REC_FLEX: 1, FLEX: 1 })
    expect(layout?.dedicated).toEqual({})
  })

  it('lands unknown/IDP labels in dedicated rather than dropping them', () => {
    const layout = parseRosterSlotLayout({ roster_positions: ['DL', 'LB', 'DB'] })
    expect(layout?.dedicated).toEqual({ DL: 1, LB: 1, DB: 1 })
  })

  it('counts TAXI separately from bench', () => {
    const layout = parseRosterSlotLayout({
      roster_positions: ['QB', 'BN', 'TAXI', 'TAXI'],
    })
    expect(layout?.bench).toBe(1)
    expect(layout?.taxi).toBe(2)
  })

  it('returns null for anything that is not the Sleeper raw shape', () => {
    expect(parseRosterSlotLayout(null)).toBeNull()
    expect(parseRosterSlotLayout(undefined)).toBeNull()
    expect(parseRosterSlotLayout('QB,RB')).toBeNull()
    expect(parseRosterSlotLayout([])).toBeNull()
    expect(parseRosterSlotLayout({})).toBeNull()
    expect(parseRosterSlotLayout({ roster_positions: [] })).toBeNull()
    expect(parseRosterSlotLayout({ roster_positions: [1, 2] })).toBeNull()
    expect(parseRosterSlotLayout({ roster_positions: ['QB', 3] })).toBeNull()
  })

  it('never throws on a hostile payload — a bad config degrades, it does not crash', () => {
    expect(() => parseRosterSlotLayout({ roster_positions: {} })).not.toThrow()
    expect(() => parseRosterSlotLayout(Number.NaN)).not.toThrow()
  })
})
