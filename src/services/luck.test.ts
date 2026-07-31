import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import type { Database } from '@/lib/supabase/database.types'

import { computeLuck, getLuck, type LuckRow } from './luck'

/**
 * Wave 5 — Lucky/unlucky tracker, item 3. The build file names the cases this
 * suite must cover explicitly: ties, byes, incomplete weeks, zero completed
 * weeks, and odd/even team counts. Each has its own describe block below.
 *
 * The calculation is pure, so all of it is asserted without a database — Rule
 * 13 forbids test writes against the shared prolabel DB, and this container has
 * no `.env.local` to reach it read-only either. `getLuck` additionally runs
 * against a recording fake client so the module's stated data-exposure boundary
 * (explicit columns; never `share_token`/`owner_id`; matchups + league_config +
 * standings + rosters only) is asserted rather than merely documented.
 */

const NAMES = new Map([
  [1, { teamName: 'Alpha', ownerDisplayName: 'nick' }],
  [2, { teamName: 'Bravo', ownerDisplayName: 'sam' }],
  [3, { teamName: 'Charlie', ownerDisplayName: null }],
  [4, { teamName: 'Delta', ownerDisplayName: null }],
])

/** A paired roster-week. `matchupId` groups the two sides, as Sleeper does. */
function row(
  nativeRosterId: number,
  week: number,
  points: number,
  nativeMatchupId: number | null = 1,
  isFinal = true
): LuckRow {
  return { nativeRosterId, nativeMatchupId, week, points, isFinal }
}

const team = (data: ReturnType<typeof computeLuck>, rosterId: number) => {
  const found = data.teams.find((t) => t.nativeRosterId === rosterId)
  if (found === undefined) throw new Error(`no team ${rosterId}`)
  return found
}

describe('computeLuck — the core differential', () => {
  it('reads zero luck when the schedule matches the scoring', () => {
    // Two teams, one game: the higher scorer wins. All-play over one opponent
    // gives the winner 1.0 expected and the loser 0.0 — luck is exactly zero
    // for both, which is the definition working.
    const data = computeLuck([row(1, 1, 100), row(2, 1, 90)], NAMES, null)
    expect(team(data, 1).luck).toBe(0)
    expect(team(data, 2).luck).toBe(0)
    expect(team(data, 1).expectedWins).toBe(1)
    expect(team(data, 2).expectedWins).toBe(0)
  })

  it('credits a team that won despite scoring below the field', () => {
    // Roster 1 (80) beats roster 2 (70) while rosters 3 and 4 both score 120.
    // Actual: 1 win. Expected: it beat one of three opponents → 0.333.
    const data = computeLuck(
      [
        row(1, 1, 80, 1),
        row(2, 1, 70, 1),
        row(3, 1, 120, 2),
        row(4, 1, 120, 2),
      ],
      NAMES,
      null
    )
    const lucky = team(data, 1)
    expect(lucky.actualWins).toBe(1)
    expect(lucky.expectedWins).toBe(0.33)
    expect(lucky.luck).toBe(0.67)
    expect(data.teams[0].nativeRosterId).toBe(1)
  })

  it('penalises a team that lost while outscoring most of the field', () => {
    const data = computeLuck(
      [
        row(1, 1, 130, 1),
        row(2, 1, 140, 1),
        row(3, 1, 60, 2),
        row(4, 1, 50, 2),
      ],
      NAMES,
      null
    )
    const unlucky = team(data, 1)
    expect(unlucky.actualWins).toBe(0)
    // Beat rosters 3 and 4, lost to 2 → 2/3.
    expect(unlucky.expectedWins).toBe(0.67)
    expect(unlucky.luck).toBe(-0.67)
    // Luckiest first: the ranking puts the beneficiary above the victim.
    expect(data.teams[data.teams.length - 1].nativeRosterId).toBe(1)
  })

  it('ranks luck desc, then actual win-equivalent, then roster id', () => {
    // Scores 100/90/80/70 paired 1-2 and 3-4. Roster 3 wins the lower game
    // while ranking 3rd of 4 (+0.67); roster 2 loses while ranking 2nd
    // (−0.67). Rosters 1 and 4 both land at exactly zero luck — the top scorer
    // who won and the bottom scorer who lost — so the tie falls to the actual
    // record (1 win vs 0), and only then to the stable roster key.
    const data = computeLuck(
      [row(1, 1, 100, 1), row(2, 1, 90, 1), row(3, 1, 80, 2), row(4, 1, 70, 2)],
      NAMES,
      null
    )
    expect(data.teams.map((t) => t.rank)).toEqual([1, 2, 3, 4])
    expect(data.teams.map((t) => t.nativeRosterId)).toEqual([3, 1, 4, 2])
    expect(data.teams.map((t) => t.luck)).toEqual([0.67, 0, 0, -0.67])
  })
})

describe('computeLuck — ties', () => {
  it('splits a head-to-head tie as half a win on both sides', () => {
    const data = computeLuck([row(1, 1, 100), row(2, 1, 100)], NAMES, null)
    expect(team(data, 1).actualTies).toBe(1)
    expect(team(data, 1).actualWins).toBe(0)
    expect(team(data, 1).actualWinEquivalent).toBe(0.5)
    // All-play against one equal opponent is also half — no luck either way.
    expect(team(data, 1).expectedWins).toBe(0.5)
    expect(team(data, 1).luck).toBe(0)
  })

  it('splits all-play ties evenly against the wider field', () => {
    // Roster 1 ties roster 2 head-to-head; both also tie nobody else and beat
    // roster 3, losing to roster 4.
    const data = computeLuck(
      [
        row(1, 1, 100, 1),
        row(2, 1, 100, 1),
        row(3, 1, 50, 2),
        row(4, 1, 150, 2),
      ],
      NAMES,
      null
    )
    // Beat 3, tied 2, lost to 4 → (1 + 0.5) / 3 = 0.5.
    expect(team(data, 1).weeks[0].expectedWinShare).toBe(0.5)
    expect(team(data, 1).expectedWins).toBe(0.5)
  })

  it('reports the tie in the record string inputs', () => {
    const data = computeLuck(
      [row(1, 1, 100), row(2, 1, 100), row(1, 2, 90, 1), row(2, 2, 80, 1)],
      NAMES,
      null
    )
    const alpha = team(data, 1)
    expect([alpha.actualWins, alpha.actualLosses, alpha.actualTies]).toEqual([
      1, 0, 1,
    ])
    expect(alpha.actualWinEquivalent).toBe(1.5)
  })
})

describe('computeLuck — byes and unpaired weeks', () => {
  it('rates a bye week for expectation but records no game', () => {
    // Roster 3 scores with a null matchup id — a bye. Nick's Clarify: it still
    // all-plays (the score is a real observation) but has no actual result.
    const data = computeLuck(
      [row(1, 1, 100, 1), row(2, 1, 90, 1), row(3, 1, 120, null)],
      NAMES,
      null
    )
    const bye = team(data, 3)
    expect(bye.gamesPlayed).toBe(0)
    expect(bye.weeksRated).toBe(1)
    expect(bye.hasRatingGap).toBe(true)
    expect(bye.weeks[0].result).toBe('no_game')
    expect(bye.weeks[0].expectedWinShare).toBe(1)
    // The disclosure propagates to the league level so the UI can state it.
    expect(data.hasRatingGap).toBe(true)
  })

  it('treats an anomalous matchup group as no game rather than inventing one', () => {
    // Three rosters sharing one matchup id: getMatchups refuses to force these
    // into pairs, and so does this.
    const data = computeLuck(
      [row(1, 1, 100, 7), row(2, 1, 90, 7), row(3, 1, 80, 7)],
      new Map([...NAMES].slice(0, 3)),
      null
    )
    expect(data.teams.every((t) => t.gamesPlayed === 0)).toBe(true)
    // All three still rate against each other — an unpairable group is a
    // scheduling anomaly, not a reason to discard three real scores.
    expect(data.teams.every((t) => t.weeksRated === 1)).toBe(true)
    expect(team(data, 1).weeks[0].expectedWinShare).toBe(1)
  })

  it('leaves a team absent from a week entirely unrated for that week', () => {
    const data = computeLuck(
      [row(1, 1, 100, 1), row(2, 1, 90, 1), row(1, 2, 110, 1), row(2, 2, 95, 1)],
      new Map([...NAMES].slice(0, 3)),
      null
    )
    const absent = team(data, 3)
    expect(absent.weeksRated).toBe(0)
    expect(absent.gamesPlayed).toBe(0)
    expect(absent.hasRatingGap).toBe(false)
    expect(absent.luck).toBe(0)
    expect(absent.weeks.map((w) => w.points)).toEqual([null, null])
  })
})

describe('computeLuck — incomplete weeks', () => {
  it('counts a non-final week and reports it as provisional', () => {
    const data = computeLuck(
      [row(1, 1, 60, 1, false), row(2, 1, 50, 1, false)],
      NAMES,
      null
    )
    expect(data.weeksCounted).toBe(1)
    expect(data.nonFinalWeeksCounted).toBe(1)
    expect(team(data, 1).weeks[0].isFinal).toBe(false)
    expect(team(data, 1).actualWins).toBe(1)
  })

  it('rates a week where only one roster has scored as unrateable', () => {
    // Mid-Sunday: one game has posted, the rest have not. A lone score has no
    // field to be compared against, so it earns no free 1.000.
    const data = computeLuck([row(1, 1, 100, 1)], NAMES, null)
    expect(data.weeksCounted).toBe(0)
    expect(team(data, 1).weeksRated).toBe(0)
    expect(team(data, 1).weeks[0].expectedWinShare).toBeNull()
    expect(team(data, 1).luck).toBe(0)
  })

  it('excludes weeks at or after playoff_week_start', () => {
    const data = computeLuck(
      [
        row(1, 14, 100, 1),
        row(2, 14, 90, 1),
        row(1, 15, 100, 1),
        row(2, 15, 90, 1),
      ],
      NAMES,
      15
    )
    expect(data.weeks).toEqual([14])
    expect(data.playoffWeekStart).toBe(15)
    expect(team(data, 1).gamesPlayed).toBe(1)
  })

  it('counts every scored week when the boundary is unparseable', () => {
    const data = computeLuck(
      [row(1, 15, 100, 1), row(2, 15, 90, 1)],
      NAMES,
      null
    )
    expect(data.weeks).toEqual([15])
    expect(data.playoffWeekStart).toBeNull()
  })
})

describe('computeLuck — zero completed weeks', () => {
  it('returns an honest empty shape with every team still listed', () => {
    const data = computeLuck([], NAMES, null)
    expect(data.weeks).toEqual([])
    expect(data.weeksCounted).toBe(0)
    expect(data.teams).toHaveLength(4)
    expect(data.teams.every((t) => t.luck === 0)).toBe(true)
    expect(data.teams.every((t) => t.expectedWins === 0)).toBe(true)
    expect(data.teams.every((t) => t.weeks.length === 0)).toBe(true)
    expect(data.hasRatingGap).toBe(false)
  })

  it('lists a league with no rosters synced yet as genuinely empty', () => {
    const data = computeLuck([], new Map(), null)
    expect(data.teams).toEqual([])
    expect(data.lowConfidence).toBe(true)
  })
})

describe('computeLuck — odd and even team counts', () => {
  /** N teams scoring N distinct values in one week, paired where possible. */
  function week(teamCount: number, weekNumber: number): LuckRow[] {
    return Array.from({ length: teamCount }, (_, index) => {
      const rosterId = index + 1
      // Pair 1-2, 3-4, …; a trailing odd roster gets a null matchup id.
      const isPaired = index < teamCount - (teamCount % 2)
      return row(
        rosterId,
        weekNumber,
        100 - index * 5,
        isPaired ? Math.floor(index / 2) + 1 : null
      )
    })
  }

  it('divides an even league across N−1 opponents', () => {
    const data = computeLuck(week(4, 1), NAMES, null)
    // Top scorer beats all three; bottom scorer beats none.
    expect(team(data, 1).weeks[0].expectedWinShare).toBe(1)
    expect(team(data, 4).weeks[0].expectedWinShare).toBe(0)
    expect(team(data, 2).weeks[0].expectedWinShare).toBe(0.667)
    expect(data.teams.every((t) => t.gamesPlayed === 1)).toBe(true)
  })

  it('rates an odd league fully while the unpaired team plays no game', () => {
    const names = new Map([...NAMES, [5, { teamName: 'Echo', ownerDisplayName: null }]])
    const data = computeLuck(week(5, 1), names, null)
    // Every team is compared against the other four…
    expect(data.teams.every((t) => t.weeksRated === 1)).toBe(true)
    // …but roster 5 has no opponent, so its record stays empty.
    expect(team(data, 5).gamesPlayed).toBe(0)
    expect(team(data, 5).luck).toBe(0)
    expect(team(data, 5).hasRatingGap).toBe(true)
    expect(team(data, 1).gamesPlayed).toBe(1)
  })

  it('sums expectation across many weeks in a full-size league', () => {
    const names = new Map(
      Array.from({ length: 10 }, (_, i) => [
        i + 1,
        { teamName: `T${i + 1}`, ownerDisplayName: null },
      ])
    )
    const rows = [1, 2, 3, 4, 5, 6].flatMap((w) => week(10, w))
    const data = computeLuck(rows, names, null)
    expect(data.weeksCounted).toBe(6)
    // The consistent top scorer wins all nine all-play games every week.
    expect(team(data, 1).expectedWins).toBe(6)
    expect(team(data, 1).actualWins).toBe(6)
    expect(team(data, 1).luck).toBe(0)
    // Ranks are contiguous over all ten teams.
    expect(data.teams.map((t) => t.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
  })
})

describe('computeLuck — cumulative luck and low confidence', () => {
  it('accumulates weekly luck for the drill-down series', () => {
    // Week 1: roster 1 wins while scoring 3rd of 4 → +0.667.
    // Week 2: roster 1 wins while top scoring → 0.
    const rows = [
      row(1, 1, 80, 1),
      row(2, 1, 70, 1),
      row(3, 1, 120, 2),
      row(4, 1, 110, 2),
      row(1, 2, 140, 1),
      row(2, 2, 70, 1),
      row(3, 2, 60, 2),
      row(4, 2, 50, 2),
    ]
    const data = computeLuck(rows, NAMES, null)
    expect(team(data, 1).weeks.map((w) => w.cumulativeLuck)).toEqual([
      0.667, 0.667,
    ])
    expect(team(data, 1).luck).toBe(0.67)
  })

  it('flags a reading under ~6 counted weeks as low-confidence', () => {
    const build = (weekCount: number) =>
      Array.from({ length: weekCount }, (_, i) => [
        row(1, i + 1, 100, 1),
        row(2, i + 1, 90, 1),
      ]).flat()
    expect(computeLuck(build(5), NAMES, null).lowConfidence).toBe(true)
    expect(computeLuck(build(6), NAMES, null).lowConfidence).toBe(false)
  })

  it('records the weekly result and opponent score for the drill-down', () => {
    const data = computeLuck([row(1, 1, 100), row(2, 1, 90)], NAMES, null)
    expect(team(data, 1).weeks[0]).toMatchObject({
      week: 1,
      points: 100,
      opponentPoints: 90,
      result: 'win',
      actualWinShare: 1,
    })
    expect(team(data, 2).weeks[0]).toMatchObject({
      result: 'loss',
      actualWinShare: 0,
      opponentPoints: 100,
    })
  })
})

describe('computeLuck — standings cross-check', () => {
  it('carries the snapshot wins and flags a disagreement', () => {
    const rows = [row(1, 1, 100, 1), row(2, 1, 90, 1)]
    const agreeing = computeLuck(rows, NAMES, null, new Map([[1, 1], [2, 0]]))
    expect(team(agreeing, 1).standingsWins).toBe(1)
    expect(team(agreeing, 1).disagreesWithStandings).toBe(false)
    expect(agreeing.hasStandingsDisagreement).toBe(false)

    // A snapshot including playoff results diverges from the recomputed
    // regular-season record — surfaced, never silently reconciled.
    const diverging = computeLuck(rows, NAMES, null, new Map([[1, 3], [2, 0]]))
    expect(team(diverging, 1).disagreesWithStandings).toBe(true)
    expect(diverging.hasStandingsDisagreement).toBe(true)
  })

  it('leaves standings wins null for a team with no snapshot row', () => {
    const data = computeLuck([row(1, 1, 100), row(2, 1, 90)], NAMES, null)
    expect(team(data, 1).standingsWins).toBeNull()
    expect(team(data, 1).disagreesWithStandings).toBe(false)
  })
})

// --- getLuck against a recording fake client -------------------------------

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
        native_matchup_id: 1,
        week: 1,
        effective_points: '110.5',
        is_final: true,
      },
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 2,
        native_matchup_id: 1,
        week: 1,
        effective_points: '95.25',
        is_final: true,
      },
      // A playoff week — excluded by the boundary below.
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 1,
        native_matchup_id: 1,
        week: 15,
        effective_points: '150',
        is_final: true,
      },
      // An unscored week — never reaches the calculation.
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 2,
        native_matchup_id: 2,
        week: 2,
        effective_points: null,
        is_final: false,
      },
      // A different league's row — must never reach the table.
      {
        league_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        native_roster_id: 1,
        native_matchup_id: 1,
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
    standings: [
      { league_id: LEAGUE_UUID, native_roster_id: 1, wins: 1 },
      { league_id: LEAGUE_UUID, native_roster_id: 2, wins: 0 },
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

describe('getLuck', () => {
  it('reads the league-scoped regular season and ranks it', async () => {
    const data = await getLuck(makeDb(seed(), recorder()), LEAGUE_UUID)
    expect(data.weeks).toEqual([1])
    expect(data.playoffWeekStart).toBe(15)
    expect(data.teams.map((t) => t.teamName)).toEqual(['Alpha', 'Bravo'])
    expect(data.teams.every((t) => t.luck === 0)).toBe(true)
    expect(data.teams[0].standingsWins).toBe(1)
    expect(data.hasStandingsDisagreement).toBe(false)
  })

  it('reads only matchups, league_config, standings and rosters', async () => {
    const rec = recorder()
    await getLuck(makeDb(seed(), rec), LEAGUE_UUID)
    expect(new Set(rec.tables)).toEqual(
      new Set(['matchups', 'league_config', 'standings', 'rosters'])
    )
  })

  it('never selects share_token, owner_id, or a wildcard', async () => {
    const rec = recorder()
    await getLuck(makeDb(seed(), rec), LEAGUE_UUID)
    const all = Object.values(rec.selects).flat()
    expect(all).not.toContain('share_token')
    expect(all).not.toContain('owner_id')
    expect(all).not.toContain('*')
    expect(rec.selects.matchups).toEqual([
      'native_roster_id',
      'native_matchup_id',
      'week',
      'effective_points',
      'is_final',
    ])
    expect(rec.selects.standings).toEqual(['native_roster_id', 'wins'])
  })
})
