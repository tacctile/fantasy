import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import type { Database } from '@/lib/supabase/database.types'

import { computeScoreTrends, getScoreTrends, type ScoreRow } from './score-trends'

/**
 * Wave 5 — Score charts, item 1. The aggregation is a pure function over
 * matchup rows, so every edge case the charts have to survive (a bye week, a
 * team with no scores at all, a season that never started, a playoff boundary
 * that doesn't parse) is asserted here without touching a database — Rule 13
 * forbids test writes to the shared prolabel DB, and this container has no
 * `.env.local` to reach it read-only either.
 *
 * `getScoreTrends` additionally runs against a fake client that records every
 * column list it is asked for, so the module's stated data-exposure boundary
 * (explicit columns; never `share_token`/`owner_id`; matchups + league_config
 * + rosters only) is asserted rather than merely documented.
 */

const NAMES = new Map([
  [1, { teamName: 'Alpha', ownerDisplayName: 'nick' }],
  [2, { teamName: 'Bravo', ownerDisplayName: 'sam' }],
  [3, { teamName: null, ownerDisplayName: null }],
])

function row(
  nativeRosterId: number,
  week: number,
  points: number,
  isFinal = true
): ScoreRow {
  return { nativeRosterId, week, points, isFinal }
}

describe('computeScoreTrends — week scope', () => {
  it('excludes weeks at or after playoff_week_start', () => {
    const data = computeScoreTrends(
      [row(1, 13, 100), row(1, 14, 120), row(1, 15, 140)],
      NAMES,
      15
    )
    expect(data.weeks).toEqual([13, 14])
    expect(data.playoffWeekStart).toBe(15)
    expect(data.teams.find((t) => t.nativeRosterId === 1)?.totalPoints).toBe(220)
  })

  it('plots the whole scored season when the boundary is unparseable', () => {
    const data = computeScoreTrends(
      [row(1, 13, 100), row(1, 14, 120), row(1, 15, 140)],
      NAMES,
      null
    )
    expect(data.weeks).toEqual([13, 14, 15])
    expect(data.playoffWeekStart).toBeNull()
  })

  it('returns an honest empty shape for a season with nothing scored', () => {
    const data = computeScoreTrends([], NAMES, null)
    expect(data.weeks).toEqual([])
    expect(data.weeksCounted).toBe(0)
    expect(data.leagueMedianWeek).toBeNull()
    expect(data.teams).toHaveLength(3)
    expect(data.teams.every((team) => team.totalPoints === 0)).toBe(true)
    expect(data.teams.every((team) => team.averagePoints === null)).toBe(true)
  })
})

describe('computeScoreTrends — series assembly', () => {
  const rows = [
    row(1, 1, 100),
    row(2, 1, 90),
    row(1, 2, 80),
    // roster 2 is on bye in week 2 — no row at all
    row(1, 3, 60),
    row(2, 3, 110),
  ]

  it('aligns every team to the same counted-week axis, byes as null', () => {
    const data = computeScoreTrends(rows, NAMES, null)
    expect(data.weeks).toEqual([1, 2, 3])
    const bravo = data.teams.find((team) => team.nativeRosterId === 2)
    expect(bravo?.weeks.map((week) => week.points)).toEqual([90, null, 110])
    expect(bravo?.scoredWeeks).toBe(2)
    // Every team's series is the same length as the axis — a chart can index
    // week i across teams without a per-team lookup.
    expect(
      data.teams.every((team) => team.weeks.length === data.weeks.length)
    ).toBe(true)
  })

  it('carries a cumulative total across a bye instead of dropping to zero', () => {
    const data = computeScoreTrends(rows, NAMES, null)
    const bravo = data.teams.find((team) => team.nativeRosterId === 2)
    expect(bravo?.cumulative).toEqual([90, 90, 200])
  })

  it('leaves cumulative null before a team has scored at all', () => {
    const data = computeScoreTrends([row(1, 1, 100), row(2, 2, 90)], NAMES, null)
    const bravo = data.teams.find((team) => team.nativeRosterId === 2)
    expect(bravo?.cumulative).toEqual([null, 90])
  })

  it('includes a rostered team with no scores as an empty series', () => {
    const data = computeScoreTrends(rows, NAMES, null)
    const empty = data.teams.find((team) => team.nativeRosterId === 3)
    expect(empty?.weeks.map((week) => week.points)).toEqual([null, null, null])
    expect(empty?.cumulative).toEqual([null, null, null])
    expect(empty?.medianPoints).toBeNull()
  })

  it('includes a scoring roster that has no roster-snapshot row yet', () => {
    const data = computeScoreTrends([row(9, 1, 77)], new Map(), null)
    expect(data.teams).toHaveLength(1)
    expect(data.teams[0]).toMatchObject({
      nativeRosterId: 9,
      teamName: null,
      totalPoints: 77,
    })
  })

  it('orders teams by total points desc, then roster id asc', () => {
    const data = computeScoreTrends(
      [row(3, 1, 50), row(1, 1, 50), row(2, 1, 90)],
      NAMES,
      null
    )
    expect(data.teams.map((team) => team.nativeRosterId)).toEqual([2, 1, 3])
  })

  it('assigns colour slots by roster id, not by rank', () => {
    const data = computeScoreTrends(
      [row(3, 1, 50), row(1, 1, 40), row(2, 1, 90)],
      NAMES,
      null
    )
    // Ranked 2, 3, 1 — slots stay 0, 1, 2 in roster-id order, so re-sorting
    // the page can never repaint a team.
    expect(
      data.teams.map((team) => [team.nativeRosterId, team.seriesIndex])
    ).toEqual([
      [2, 1],
      [3, 2],
      [1, 0],
    ])
  })
})

describe('computeScoreTrends — summary statistics', () => {
  it('computes floor/median/ceiling over an odd sample', () => {
    const data = computeScoreTrends(
      [row(1, 1, 100), row(1, 2, 60), row(1, 3, 80)],
      NAMES,
      null
    )
    const alpha = data.teams[0]
    expect(alpha.lowPoints).toBe(60)
    expect(alpha.medianPoints).toBe(80)
    expect(alpha.highPoints).toBe(100)
    expect(alpha.averagePoints).toBe(80)
  })

  it('averages the two middle values on an even sample', () => {
    const data = computeScoreTrends(
      [row(1, 1, 100), row(1, 2, 60), row(1, 3, 80), row(1, 4, 70)],
      NAMES,
      null
    )
    expect(data.teams[0].medianPoints).toBe(75)
  })

  it('averages only the teams present in a week — a bye is not a zero', () => {
    const data = computeScoreTrends(
      [row(1, 1, 100), row(2, 1, 80), row(1, 2, 90)],
      NAMES,
      null
    )
    expect(data.leagueAveragePerWeek).toEqual([90, 90])
  })

  it('averages cumulative totals over the teams that have started scoring', () => {
    const data = computeScoreTrends(
      [row(1, 1, 100), row(2, 2, 80)],
      new Map([
        [1, { teamName: 'Alpha', ownerDisplayName: null }],
        [2, { teamName: 'Bravo', ownerDisplayName: null }],
      ]),
      null
    )
    // Week 1: only Alpha has a cumulative value. Week 2: 100 and 80.
    expect(data.leagueAverageCumulative).toEqual([100, 90])
  })

  it('takes the league median across every counted team-week', () => {
    const data = computeScoreTrends(
      [row(1, 1, 100), row(2, 1, 80), row(1, 2, 60)],
      NAMES,
      null
    )
    expect(data.leagueMedianWeek).toBe(80)
  })
})

describe('computeScoreTrends — provisional and low-confidence flags', () => {
  it('counts a week once however many of its rows are non-final', () => {
    const data = computeScoreTrends(
      [row(1, 1, 100, false), row(2, 1, 80, false), row(1, 2, 90, true)],
      NAMES,
      null
    )
    expect(data.nonFinalWeeksCounted).toBe(1)
    expect(data.weeksCounted).toBe(2)
  })

  it('flags a variance reading under ~6 counted weeks as low-confidence', () => {
    const short = computeScoreTrends(
      [1, 2, 3, 4, 5].map((week) => row(1, week, 100)),
      NAMES,
      null
    )
    const long = computeScoreTrends(
      [1, 2, 3, 4, 5, 6].map((week) => row(1, week, 100)),
      NAMES,
      null
    )
    expect(short.lowConfidence).toBe(true)
    expect(long.lowConfidence).toBe(false)
  })
})

// --- getScoreTrends against a recording fake client ------------------------

const LEAGUE_UUID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

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

  // The list queries are awaited directly, so the builder is thenable.
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
    matchups: [
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 1,
        week: 1,
        effective_points: '110.5',
        is_final: true,
      },
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 2,
        week: 1,
        effective_points: '95.25',
        is_final: true,
      },
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 1,
        week: 15,
        effective_points: '150',
        is_final: true,
      },
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 2,
        week: 2,
        effective_points: null,
        is_final: false,
      },
      // A different league's row — must never reach the series.
      {
        league_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        native_roster_id: 1,
        week: 1,
        effective_points: '999',
        is_final: true,
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

function recorder(): Recorder {
  return { selects: {}, tables: [] }
}

describe('getScoreTrends', () => {
  it('reads the league scoped series, dropping unscored and playoff weeks', async () => {
    const data = await getScoreTrends(makeDb(seed(), recorder()), LEAGUE_UUID)
    expect(data.weeks).toEqual([1])
    expect(data.playoffWeekStart).toBe(15)
    expect(data.teams.map((team) => [team.teamName, team.totalPoints])).toEqual([
      ['Alpha', 110.5],
      ['Bravo', 95.25],
    ])
  })

  it('reads only matchups, league_config and rosters', async () => {
    const rec = recorder()
    await getScoreTrends(makeDb(seed(), rec), LEAGUE_UUID)
    expect(new Set(rec.tables)).toEqual(
      new Set(['matchups', 'league_config', 'rosters'])
    )
  })

  it('never selects share_token, owner_id, or a wildcard', async () => {
    const rec = recorder()
    await getScoreTrends(makeDb(seed(), rec), LEAGUE_UUID)
    const all = Object.values(rec.selects).flat()
    expect(all).not.toContain('share_token')
    expect(all).not.toContain('owner_id')
    expect(all).not.toContain('*')
    expect(rec.selects.matchups).toEqual([
      'native_roster_id',
      'week',
      'effective_points',
      'is_final',
    ])
  })
})
