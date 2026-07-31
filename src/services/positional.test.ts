import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import type { Database } from '@/lib/supabase/database.types'

import type { RosterSlotLayout } from './league-context'
import {
  computePositionalBreakdown,
  flexEligibility,
  getPositionalBreakdown,
  UNMAPPED_BUCKET,
  type PositionalScoreRow,
} from './positional'

/**
 * Wave 5 — Positional breakdowns, items 1 and 5. The aggregation is pure, so
 * every edge state the section has to survive is asserted without a database:
 * byes, unmapped players, an unparsed slot layout, a lineup larger than the
 * layout allows, a season that never started, and the playoff boundary.
 *
 * Rule 13 forbids test writes against the shared prolabel DB, and this
 * container has no `.env.local` to reach it read-only either, so
 * `getPositionalBreakdown` runs against a recording fake client — which also
 * asserts the module's stated data-exposure boundary (explicit columns; never
 * `share_token`/`owner_id`; player_scores + league_config + rosters only) and
 * the `was_starter` filter, rather than merely documenting them.
 */

const LEAGUE_UUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

const NAMES = new Map([
  [1, { teamName: 'Alpha', ownerDisplayName: 'nick' }],
  [2, { teamName: 'Bravo', ownerDisplayName: 'sam' }],
])

/** A standard 1QB / 2RB / 2WR / 1TE / 1FLEX / 1K / 1DEF layout. */
const STANDARD: RosterSlotLayout = {
  dedicated: { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 },
  flex: { FLEX: 1 },
  bench: 6,
  ir: 1,
  taxi: 0,
}

let playerSeq = 0
function row(
  nativeRosterId: number,
  week: number,
  position: string | null,
  points: number,
  isFinal = true,
  sleeperPlayerId = `p${(playerSeq += 1)}`
): PositionalScoreRow {
  return { nativeRosterId, week, sleeperPlayerId, points, position, isFinal }
}

const bucket = (
  data: ReturnType<typeof computePositionalBreakdown>,
  rosterId: number,
  key: string
) => {
  const team = data.teams.find((t) => t.nativeRosterId === rosterId)
  if (team === undefined) throw new Error(`no team ${rosterId}`)
  const found = team.buckets.find((b) => b.key === key)
  if (found === undefined) throw new Error(`no bucket ${key}`)
  return found
}

describe('flexEligibility', () => {
  it('knows the conventional labels', () => {
    expect(flexEligibility('FLEX')).toEqual(['RB', 'WR', 'TE'])
    expect(flexEligibility('SUPER_FLEX')).toEqual(['QB', 'RB', 'WR', 'TE'])
    expect(flexEligibility('REC_FLEX')).toEqual(['WR', 'TE'])
  })

  it('treats an undocumented flex label as open rather than dropping it', () => {
    // The declared wiki silence: the label inventory is explicitly not
    // exhaustive, so an unknown flex must never discard the points it holds.
    expect(flexEligibility('IDP_FLEX')).toBeNull()
    expect(flexEligibility('WHATEVER_FLEX')).toBeNull()
  })
})

describe('computePositionalBreakdown — slot attribution', () => {
  it('fills dedicated slots first and sends the surplus to the flex', () => {
    // Three RBs started into 2 RB slots + 1 FLEX: the two best RBs take the
    // dedicated slots, the third lands in the flex.
    const data = computePositionalBreakdown(
      [
        row(1, 1, 'RB', 20),
        row(1, 1, 'RB', 15),
        row(1, 1, 'RB', 5),
        row(1, 1, 'QB', 25),
      ],
      NAMES,
      STANDARD,
      null
    )
    expect(bucket(data, 1, 'RB').points).toBe(35)
    expect(bucket(data, 1, 'RB').starts).toBe(2)
    expect(bucket(data, 1, 'FLEX').points).toBe(5)
    expect(bucket(data, 1, 'QB').points).toBe(25)
    expect(data.flexAttributedStarts).toBe(1)
    expect(data.overflowStarts).toBe(0)
  })

  it('refuses the flex to a position it does not admit', () => {
    // A kicker cannot occupy a standard FLEX. With every dedicated K slot
    // already used, the second K is overflow — counted, never dropped.
    const data = computePositionalBreakdown(
      [row(1, 1, 'K', 10), row(1, 1, 'K', 8)],
      NAMES,
      STANDARD,
      null
    )
    expect(bucket(data, 1, 'K').points).toBe(18)
    expect(bucket(data, 1, 'K').starts).toBe(2)
    expect(data.flexAttributedStarts).toBe(0)
    expect(data.overflowStarts).toBe(1)
  })

  it('lets a superflex take a second quarterback', () => {
    const superflex: RosterSlotLayout = {
      dedicated: { QB: 1 },
      flex: { SUPER_FLEX: 1 },
      bench: 5,
      ir: 0,
      taxi: 0,
    }
    const data = computePositionalBreakdown(
      [row(1, 1, 'QB', 30), row(1, 1, 'QB', 22)],
      NAMES,
      superflex,
      null
    )
    expect(bucket(data, 1, 'QB').points).toBe(30)
    expect(bucket(data, 1, 'SUPER_FLEX').points).toBe(22)
  })

  it('never drops points when the layout does not parse', () => {
    const data = computePositionalBreakdown(
      [row(1, 1, 'RB', 20), row(1, 1, 'RB', 15), row(1, 1, 'WR', 10)],
      NAMES,
      null,
      null
    )
    expect(data.layoutResolved).toBe(false)
    expect(bucket(data, 1, 'RB').points).toBe(35)
    expect(bucket(data, 1, 'WR').points).toBe(10)
    expect(data.teams[0].totalPoints).toBe(45)
    expect(data.buckets.some((b) => b.kind === 'flex')).toBe(false)
  })

  it('conserves every started point regardless of layout fit', () => {
    // The invariant that matters: whatever the attribution does, a team's
    // bucket totals must still sum to what it actually started.
    const rows = [
      row(1, 1, 'QB', 25),
      row(1, 1, 'RB', 20),
      row(1, 1, 'RB', 15),
      row(1, 1, 'RB', 12),
      row(1, 1, 'WR', 11),
      row(1, 1, 'TE', 9),
      row(1, 1, 'K', 8),
      row(1, 1, 'DEF', 7),
      row(1, 1, null, 6),
    ]
    const data = computePositionalBreakdown(rows, NAMES, STANDARD, null)
    const expected = rows.reduce((sum, r) => sum + r.points, 0)
    expect(data.teams[0].totalPoints).toBe(expected)
    expect(data.teams[0].totalStarts).toBe(rows.length)
  })
})

describe('computePositionalBreakdown — unmapped players', () => {
  it('surfaces unmapped scores in their own bucket instead of dropping them', () => {
    const data = computePositionalBreakdown(
      [row(1, 1, 'RB', 20), row(1, 1, null, 13, true, 'ghost'), row(1, 2, null, 7, true, 'ghost')],
      NAMES,
      STANDARD,
      null
    )
    expect(bucket(data, 1, UNMAPPED_BUCKET).points).toBe(20)
    expect(data.unmappedStarts).toBe(2)
    expect(data.unmappedPoints).toBe(20)
    // Two starts, one player — the count a reader can act on.
    expect(data.unmappedPlayerCount).toBe(1)
    expect(
      data.buckets.find((b) => b.key === UNMAPPED_BUCKET)?.kind
    ).toBe('unmapped')
  })

  it('keeps unmapped out of the positional slot buckets', () => {
    const data = computePositionalBreakdown(
      [row(1, 1, null, 50)],
      NAMES,
      STANDARD,
      null
    )
    expect(bucket(data, 1, 'RB').points).toBe(0)
    expect(data.flexAttributedStarts).toBe(0)
    expect(data.overflowStarts).toBe(0)
  })
})

describe('computePositionalBreakdown — league context', () => {
  it('ranks each bucket independently with a stable tie-break', () => {
    const data = computePositionalBreakdown(
      [
        row(1, 1, 'QB', 10),
        row(2, 1, 'QB', 30),
        row(1, 1, 'TE', 15),
        row(2, 1, 'TE', 15),
      ],
      NAMES,
      STANDARD,
      null
    )
    expect(bucket(data, 2, 'QB').rank).toBe(1)
    expect(bucket(data, 1, 'QB').rank).toBe(2)
    // Equal points: the lower roster id takes the higher rank, deterministically.
    expect(bucket(data, 1, 'TE').rank).toBe(1)
    expect(bucket(data, 2, 'TE').rank).toBe(2)
  })

  it('measures each team against the bucket league average', () => {
    const data = computePositionalBreakdown(
      [row(1, 1, 'QB', 10), row(2, 1, 'QB', 30)],
      NAMES,
      STANDARD,
      null
    )
    expect(data.buckets.find((b) => b.key === 'QB')?.leagueAverage).toBe(20)
    expect(bucket(data, 1, 'QB').deltaVsAverage).toBe(-10)
    expect(bucket(data, 2, 'QB').deltaVsAverage).toBe(10)
    expect(bucket(data, 2, 'QB').percentile).toBe(100)
    expect(bucket(data, 1, 'QB').percentile).toBe(0)
  })

  it('reports no percentile in a one-team league', () => {
    const solo = new Map([[1, { teamName: 'Alpha', ownerDisplayName: null }]])
    const data = computePositionalBreakdown([row(1, 1, 'QB', 10)], solo, STANDARD, null)
    expect(bucket(data, 1, 'QB').percentile).toBeNull()
  })

  it('computes share of a team own started points', () => {
    const data = computePositionalBreakdown(
      [row(1, 1, 'QB', 25), row(1, 1, 'TE', 75)],
      NAMES,
      STANDARD,
      null
    )
    expect(bucket(data, 1, 'QB').sharePct).toBe(25)
    expect(bucket(data, 1, 'TE').sharePct).toBe(75)
  })

  it('keeps a team with no starts as an honest zero row', () => {
    const data = computePositionalBreakdown([row(1, 1, 'QB', 25)], NAMES, STANDARD, null)
    const bravo = data.teams.find((t) => t.nativeRosterId === 2)
    expect(bravo?.totalPoints).toBe(0)
    expect(bravo?.totalStarts).toBe(0)
    expect(bucket(data, 2, 'QB').sharePct).toBe(0)
  })

  it('shows an unused layout slot as a real zero rather than omitting it', () => {
    const data = computePositionalBreakdown([row(1, 1, 'QB', 25)], NAMES, STANDARD, null)
    expect(data.buckets.map((b) => b.key)).toContain('DEF')
    expect(bucket(data, 1, 'DEF').points).toBe(0)
  })
})

describe('computePositionalBreakdown — week scope and edge states', () => {
  it('counts nothing before the season starts', () => {
    const data = computePositionalBreakdown([], NAMES, STANDARD, null)
    expect(data.weeks).toEqual([])
    expect(data.weeksCounted).toBe(0)
    expect(data.teams).toHaveLength(2)
    expect(data.teams.every((t) => t.totalPoints === 0)).toBe(true)
  })

  it('excludes weeks at or after the playoff boundary', () => {
    const data = computePositionalBreakdown(
      [row(1, 1, 'QB', 10), row(1, 15, 'QB', 99)],
      NAMES,
      STANDARD,
      15
    )
    expect(data.weeks).toEqual([1])
    expect(bucket(data, 1, 'QB').points).toBe(10)
    expect(data.playoffWeekStart).toBe(15)
  })

  it('treats a bye as absent, never as a zero-point start', () => {
    // Roster 2 has no week-2 rows at all. Its totals reflect week 1 only, and
    // week 2 still counts as a league week because roster 1 played it.
    const data = computePositionalBreakdown(
      [row(1, 1, 'QB', 10), row(2, 1, 'QB', 12), row(1, 2, 'QB', 14)],
      NAMES,
      STANDARD,
      null
    )
    expect(data.weeks).toEqual([1, 2])
    expect(bucket(data, 2, 'QB').points).toBe(12)
    expect(bucket(data, 2, 'QB').starts).toBe(1)
  })

  it('flags a provisional week and a small sample', () => {
    const data = computePositionalBreakdown(
      [row(1, 1, 'QB', 10, false), row(1, 2, 'QB', 10)],
      NAMES,
      STANDARD,
      null
    )
    expect(data.nonFinalWeeksCounted).toBe(1)
    expect(data.lowConfidence).toBe(true)
  })

  it('clears the small-sample flag at six counted weeks', () => {
    const rows = [1, 2, 3, 4, 5, 6].map((week) => row(1, week, 'QB', 10))
    expect(computePositionalBreakdown(rows, NAMES, STANDARD, null).lowConfidence).toBe(
      false
    )
  })

  it('ignores a non-finite score rather than poisoning a total', () => {
    const data = computePositionalBreakdown(
      [row(1, 1, 'QB', Number.NaN), row(1, 1, 'RB', 10)],
      NAMES,
      STANDARD,
      null
    )
    expect(data.teams[0].totalPoints).toBe(10)
  })
})

// --- getPositionalBreakdown: the query boundary -----------------------------

type Row = Record<string, unknown>
type Recorder = { selects: Record<string, string[]>; tables: string[] }

class FakeQuery {
  private eqs: Array<[string, unknown]> = []

  constructor(
    private store: Record<string, Row[]>,
    private table: string,
    private recorder: Recorder
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

  private rows(): Row[] {
    let rows = this.store[this.table] ?? []
    for (const [col, val] of this.eqs) rows = rows.filter((r) => r[col] === val)
    return rows
  }

  maybeSingle(): Promise<{ data: Row | null; error: null }> {
    const rows = this.rows()
    return Promise.resolve({ data: rows.length > 0 ? rows[0] : null, error: null })
  }

  then<T>(resolve: (value: { data: Row[]; error: null }) => T): Promise<T> {
    return Promise.resolve(resolve({ data: this.rows(), error: null }))
  }
}

function makeDb(
  store: Record<string, Row[]>,
  recorder: Recorder
): SupabaseClient<Database> {
  return {
    from: (table: string) => new FakeQuery(store, table, recorder),
  } as unknown as SupabaseClient<Database>
}

function seed(): Record<string, Row[]> {
  return {
    player_scores: [
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 1,
        week: 1,
        sleeper_player_id: '4046',
        points: '25.5',
        is_final: true,
        was_starter: true,
        players: { position: 'qb' },
      },
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 2,
        week: 1,
        sleeper_player_id: 'SF',
        points: '12',
        is_final: true,
        was_starter: true,
        // PostgREST sometimes shapes an embed as an array — read defensively.
        players: [{ position: 'DEF' }],
      },
      // A bench row — excluded by the was_starter filter, not by the maths.
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 1,
        week: 1,
        sleeper_player_id: '9999',
        points: '40',
        is_final: true,
        was_starter: false,
        players: { position: 'RB' },
      },
      // An unmapped starter — surfaced, never dropped.
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 1,
        week: 1,
        sleeper_player_id: 'ghost',
        points: '3',
        is_final: true,
        was_starter: true,
        players: null,
      },
      // A different league's row — must never reach the table.
      {
        league_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        native_roster_id: 1,
        week: 1,
        sleeper_player_id: '1',
        points: '999',
        is_final: true,
        was_starter: true,
        players: { position: 'QB' },
      },
    ],
    league_config: [
      {
        league_id: LEAGUE_UUID,
        roster_settings_raw: { settings: { playoff_week_start: 15 } },
      },
    ],
    rosters: [
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 1,
        team_name: 'Alpha',
        owner_display_name: 'nick',
      },
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 2,
        team_name: 'Bravo',
        owner_display_name: 'sam',
      },
    ],
  }
}

const recorder = (): Recorder => ({ selects: {}, tables: [] })

describe('getPositionalBreakdown', () => {
  it('reads the league-scoped regular season and attributes it', async () => {
    const data = await getPositionalBreakdown(
      makeDb(seed(), recorder()),
      LEAGUE_UUID,
      STANDARD
    )
    expect(data.weeks).toEqual([1])
    expect(data.playoffWeekStart).toBe(15)
    // Lower-cased catalog values normalize; the array-shaped embed still reads.
    expect(bucket(data, 1, 'QB').points).toBe(25.5)
    expect(bucket(data, 2, 'DEF').points).toBe(12)
    // The bench row's 40 points are absent — was_starter is the filter.
    expect(bucket(data, 1, 'RB').points).toBe(0)
    expect(data.unmappedStarts).toBe(1)
  })

  it('filters to starters and to this league', async () => {
    const rec = recorder()
    await getPositionalBreakdown(makeDb(seed(), rec), LEAGUE_UUID, STANDARD)
    const data = await getPositionalBreakdown(makeDb(seed(), rec), LEAGUE_UUID, STANDARD)
    expect(data.teams.reduce((sum, t) => sum + t.totalPoints, 0)).toBe(40.5)
  })

  it('reads only player_scores, league_config and rosters', async () => {
    const rec = recorder()
    await getPositionalBreakdown(makeDb(seed(), rec), LEAGUE_UUID, STANDARD)
    expect(new Set(rec.tables)).toEqual(
      new Set(['player_scores', 'league_config', 'rosters'])
    )
  })

  it('never selects share_token, owner_id, or a wildcard', async () => {
    const rec = recorder()
    await getPositionalBreakdown(makeDb(seed(), rec), LEAGUE_UUID, STANDARD)
    const all = Object.values(rec.selects).flat()
    expect(all).not.toContain('share_token')
    expect(all).not.toContain('owner_id')
    expect(all).not.toContain('*')
    expect(rec.selects.player_scores).toEqual([
      'native_roster_id',
      'week',
      'sleeper_player_id',
      'points',
      'is_final',
      'players(position)',
    ])
  })
})
