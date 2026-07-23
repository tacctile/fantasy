import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import type { Database } from '@/lib/supabase/database.types'

import { recordManualPick } from './draft-picks'

/**
 * Resilience item 2 — concurrent manual + poll writes racing on
 * (league_id, pick_number) with only ONE accepted (the list's first case).
 *
 * Rule 13 forbids test writes to the shared prolabel DB, so this drives
 * recordManualPick against a fake in-memory Supabase client (Nick's Clarify
 * 2026-07-23) that models the (league_id, pick_number) unique constraint as
 * ON CONFLICT DO NOTHING — the exact first-write-wins guarantee the real PK
 * gives. The fake's upsert check-and-insert is synchronous, so among
 * concurrently-awaited writers exactly one inserts and the rest read back the
 * authoritative winning row, precisely as the deployed schema behaves.
 */

type Row = Record<string, unknown>

const LEAGUE_ID = '11111111-1111-1111-1111-111111111111'

/** A fresh seed per test — leagues/config/players/rosters populated, draft_state
 *  empty unless a test pre-seeds a poller row. */
function seed(): Record<string, Row[]> {
  return {
    leagues: [
      {
        platform_league_uuid: LEAGUE_ID,
        platform: 'sleeper',
        season_year: 2026,
      },
    ],
    league_config: [{ league_id: LEAGUE_ID, derived_config: { league_size: 10 } }],
    players: [
      { sleeper_player_id: 'X', full_name: 'Player X', first_name: 'Player', last_name: 'X', position: 'RB' },
      { sleeper_player_id: 'Y', full_name: 'Player Y', first_name: 'Player', last_name: 'Y', position: 'WR' },
      { sleeper_player_id: 'Z', full_name: 'Player Z', first_name: 'Player', last_name: 'Z', position: 'TE' },
    ],
    rosters: [
      { league_id: LEAGUE_ID, native_roster_id: 1 },
      { league_id: LEAGUE_ID, native_roster_id: 2 },
    ],
    draft_state: [],
  }
}

/** Minimal chainable + thenable query builder modelling only what
 *  recordManualPick calls. */
class FakeQuery {
  private op: 'select' | 'upsert' | 'delete' = 'select'
  private eqs: Array<[string, unknown]> = []
  private pendingRow: Row | null = null
  private conflictCols: string[] = []
  private ignoreDuplicates = false

  constructor(
    private store: Record<string, Row[]>,
    private catalog: Record<string, Row>,
    private table: string
  ) {}

  select(): this {
    return this
  }
  eq(col: string, val: unknown): this {
    this.eqs.push([col, val])
    return this
  }
  limit(): this {
    return this
  }
  order(): this {
    return this
  }
  upsert(
    row: Row,
    opts: { onConflict: string; ignoreDuplicates?: boolean }
  ): this {
    this.op = 'upsert'
    this.pendingRow = row
    this.conflictCols = opts.onConflict.split(',')
    this.ignoreDuplicates = opts.ignoreDuplicates ?? false
    return this
  }
  delete(): this {
    this.op = 'delete'
    return this
  }

  private matches(row: Row): boolean {
    return this.eqs.every(([col, val]) => row[col] === val)
  }

  /** draft_state reads embed the players catalog join (PICK_SELECT). */
  private embed(row: Row): Row {
    if (this.table !== 'draft_state') return row
    const catalogRow = this.catalog[row.sleeper_player_id as string] ?? null
    return {
      ...row,
      players:
        catalogRow === null
          ? null
          : {
              full_name: catalogRow.full_name ?? null,
              first_name: catalogRow.first_name ?? null,
              last_name: catalogRow.last_name ?? null,
              position: catalogRow.position ?? null,
            },
    }
  }

  private resolveArray(): { data: Row[]; error: null } {
    if (this.op === 'upsert') {
      const table = (this.store[this.table] ??= [])
      const row = this.pendingRow as Row
      const exists = table.some((r) =>
        this.conflictCols.every((c) => r[c] === row[c])
      )
      // ON CONFLICT DO NOTHING: the row is returned only if this write won.
      if (exists && this.ignoreDuplicates) return { data: [], error: null }
      table.push({ ...row })
      return { data: [this.embed(row)], error: null }
    }
    if (this.op === 'delete') {
      const matched = (this.store[this.table] ?? []).filter((r) => this.matches(r))
      this.store[this.table] = (this.store[this.table] ?? []).filter(
        (r) => !this.matches(r)
      )
      return { data: matched.map((r) => this.embed(r)), error: null }
    }
    return {
      data: (this.store[this.table] ?? []).filter((r) => this.matches(r)).map((r) => this.embed(r)),
      error: null,
    }
  }

  maybeSingle(): Promise<{ data: Row | null; error: null }> {
    const { data } = this.resolveArray()
    return Promise.resolve({ data: data.length > 0 ? data[0] : null, error: null })
  }

  then<T>(onFulfilled: (value: { data: Row[]; error: null }) => T): Promise<T> {
    return Promise.resolve(this.resolveArray()).then(onFulfilled)
  }
}

function fakeDb(store: Record<string, Row[]>): SupabaseClient<Database> {
  const catalog: Record<string, Row> = {}
  for (const player of store.players) catalog[player.sleeper_player_id as string] = player
  const client = {
    from(table: string) {
      return new FakeQuery(store, catalog, table)
    },
  }
  return client as unknown as SupabaseClient<Database>
}

describe('recordManualPick — first-write-wins on (league_id, pick_number)', () => {
  it('accepts exactly one of several writers racing for the same pick number', async () => {
    const db = fakeDb(seed())
    // Three writers (distinct players) race for pick 5 — the shape of a manual
    // click landing at the same instant the poller ingests Sleeper's board.
    const results = await Promise.all(
      ['X', 'Y', 'Z'].map((sleeperPlayerId) =>
        recordManualPick(db, {
          leagueId: LEAGUE_ID,
          pickNumber: 5,
          round: 1,
          sleeperPlayerId,
          nativeRosterId: 1,
        })
      )
    )

    const accepted = results.filter((r) => r.outcome === 'accepted')
    const conflicts = results.filter((r) => r.outcome === 'conflict')
    expect(accepted).toHaveLength(1)
    expect(conflicts).toHaveLength(2)

    // Every conflict points at the one authoritative winning row.
    const winnerId =
      accepted[0].outcome === 'accepted' ? accepted[0].pick.sleeperPlayerId : null
    for (const conflict of conflicts) {
      if (conflict.outcome !== 'conflict') continue
      expect(conflict.existing.pickNumber).toBe(5)
      expect(conflict.existing.sleeperPlayerId).toBe(winnerId)
    }
  })

  it('reports conflict with the authoritative row when a poller already won the pick', async () => {
    const store = seed()
    store.draft_state.push({
      league_id: LEAGUE_ID,
      pick_number: 5,
      round: 1,
      sleeper_player_id: 'Z',
      native_roster_id: 2,
      source: 'sleeper_poll',
      platform: 'sleeper',
      season_year: 2026,
      native_draft_id: null,
      amount: null,
    })
    const result = await recordManualPick(fakeDb(store), {
      leagueId: LEAGUE_ID,
      pickNumber: 5,
      round: 1,
      sleeperPlayerId: 'X',
      nativeRosterId: 1,
    })
    expect(result.outcome).toBe('conflict')
    if (result.outcome === 'conflict') {
      expect(result.existing.sleeperPlayerId).toBe('Z')
      expect(result.existing.source).toBe('sleeper_poll')
    }
  })

  it('accepts an uncontested pick', async () => {
    const result = await recordManualPick(fakeDb(seed()), {
      leagueId: LEAGUE_ID,
      pickNumber: 3,
      round: 1,
      sleeperPlayerId: 'X',
      nativeRosterId: 1,
    })
    expect(result.outcome).toBe('accepted')
    if (result.outcome === 'accepted') {
      expect(result.pick.pickNumber).toBe(3)
      expect(result.pick.source).toBe('manual')
      expect(result.pick.playerFullName).toBe('Player X')
    }
  })
})
