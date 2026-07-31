import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import type { Database } from '@/lib/supabase/database.types'

import {
  computePlayoffPicture,
  getPlayoffPicture,
  getPlayoffRules,
  parsePlayoffRules,
  type PlayoffRules,
  type PlayoffScheduleRow,
} from './playoff-picture'

/**
 * Wave 5 — Playoff picture, item 3. The build file names the cases this suite
 * must cover explicitly: preseason/late-season states, ties, incomplete
 * schedules, and arbitrary league sizes/playoff-spot counts. Each has its own
 * describe block below, plus one for the rules resolver (item 1) and one
 * asserting the service's data-exposure boundary.
 *
 * The calculation is pure, so all of it is asserted without a database — Rule
 * 13 forbids test writes against the shared prolabel DB, and this container has
 * no `.env.local` to reach it read-only either. `getPlayoffPicture` runs against
 * a recording fake client so the module's stated boundary (explicit columns;
 * never `share_token`/`owner_id`; matchups + standings + league_config +
 * rosters only) is asserted rather than merely documented.
 *
 * THE LOAD-BEARING PROPERTY, asserted throughout: a printed status can never be
 * falsified by a later result. Every scenario below that expects `clinched` or
 * `eliminated` is one where no sequence of remaining outcomes — and no
 * tiebreaker resolution — could make the badge wrong.
 */

const names = (count: number) =>
  new Map(
    Array.from({ length: count }, (_, index) => [
      index + 1,
      { teamName: `Team ${index + 1}`, ownerDisplayName: null },
    ])
  )

/** The four rosters the shared datasets below actually play. */
const NAMES = names(4)
/** Two extra rosters that never appear in a schedule — the unsynced shape. */
const NAMES6 = names(6)

/** A roster-week. Null points means scheduled but not yet played. */
function row(
  nativeRosterId: number,
  week: number,
  points: number | null,
  nativeMatchupId: number | null = 1,
  isFinal = true
): PlayoffScheduleRow {
  return { nativeRosterId, nativeMatchupId, week, points, isFinal }
}

/** Rules with a two-team field, overridable per test. */
function rules(over: Partial<PlayoffRules> = {}): PlayoffRules {
  return {
    playoffTeams: 2,
    playoffWeekStart: null,
    playoffTypeRaw: null,
    playoffRoundTypeRaw: null,
    divisionCount: null,
    hasDivisions: false,
    firstRoundByes: 0,
    seedingBasis: 'recomputed_record',
    ...over,
  }
}

const team = (
  data: ReturnType<typeof computePlayoffPicture>,
  rosterId: number
) => {
  const found = data.teams.find((t) => t.nativeRosterId === rosterId)
  if (found === undefined) throw new Error(`no team ${rosterId}`)
  return found
}

/**
 * Four teams, two weeks, every game played. T1 2-0, T2 and T3 both 1-1 on
 * identical points-for, T4 0-2.
 */
const COMPLETED: PlayoffScheduleRow[] = [
  row(1, 1, 100, 1),
  row(2, 1, 90, 1),
  row(3, 1, 80, 2),
  row(4, 1, 70, 2),
  row(1, 2, 100, 1),
  row(3, 2, 90, 1),
  row(2, 2, 80, 2),
  row(4, 2, 70, 2),
]

/** The same league one week earlier: week 2 scheduled but unplayed. */
const MID_SEASON: PlayoffScheduleRow[] = [
  row(1, 1, 100, 1),
  row(2, 1, 90, 1),
  row(3, 1, 80, 2),
  row(4, 1, 70, 2),
  row(1, 2, null, 1),
  row(3, 2, null, 1),
  row(2, 2, null, 2),
  row(4, 2, null, 2),
]

describe('computePlayoffPicture — late-season, schedule exhausted', () => {
  it('clinches only the team no rival can reach', () => {
    const data = computePlayoffPicture(COMPLETED, NAMES, rules())
    expect(team(data, 1).status).toBe('clinched')
    expect(team(data, 1).wins).toBe(2)
    expect(team(data, 1).maxWinEquivalent).toBe(2)
    // Clinched means nothing left to chase.
    expect(team(data, 1).magicNumber).toBeNull()
  })

  it('does NOT eliminate a team merely tied for the last spot', () => {
    // T2 and T3 are level at 1-1 for one remaining berth. Declaring either
    // eliminated would be a false statement — the tiebreaker could go their
    // way. This is the asymmetric comparison doing its job.
    const data = computePlayoffPicture(COMPLETED, NAMES, rules())
    expect(team(data, 2).status).toBe('needs_help')
    expect(team(data, 3).status).toBe('needs_help')
  })

  it('eliminates a team that cannot catch a full field', () => {
    // T4 finished 0-2 with three teams guaranteed strictly above it and a
    // two-team field. No tiebreaker saves it.
    const data = computePlayoffPicture(COMPLETED, NAMES, rules())
    expect(team(data, 4).status).toBe('eliminated')
    expect(team(data, 4).magicNumber).toBeNull()
  })

  it('reports schedule exhaustion rather than asserting the season ended', () => {
    const data = computePlayoffPicture(COMPLETED, NAMES, rules())
    expect(data.gamesRemainingTotal).toBe(0)
    expect(data.scheduleExhausted).toBe(true)
    expect(data.weeksCounted).toBe(2)
    expect(data.nonFinalWeeksCounted).toBe(0)
  })

  it('seeds on win percentage, then points-for, then roster id', () => {
    const data = computePlayoffPicture(COMPLETED, NAMES, rules())
    expect(data.teams.map((t) => t.seed)).toEqual([1, 2, 3, 4])
    // T2 and T3 tie on both record and points-for — the stable roster key
    // decides, so the order never depends on row arrival.
    expect(data.teams.map((t) => t.nativeRosterId)).toEqual([1, 2, 3, 4])
    expect(team(data, 2).pointsFor).toBe(team(data, 3).pointsFor)
  })
})

describe('computePlayoffPicture — mid-season, games remaining', () => {
  it('gives a leader who can secure a berth alone a magic number', () => {
    const data = computePlayoffPicture(MID_SEASON, NAMES, rules())
    expect(team(data, 1).status).toBe('controls_own_path')
    expect(team(data, 1).gamesRemaining).toBe(1)
    expect(team(data, 1).magicNumber).toBe(1)
  })

  it('withholds a magic number from a team that winning out cannot save', () => {
    // T2 is 0-1 with one game left; even at 1-1 it could be passed by more
    // teams than the field holds. Printing "win 1" would promise a berth it
    // cannot deliver on its own.
    const data = computePlayoffPicture(MID_SEASON, NAMES, rules())
    expect(team(data, 2).status).toBe('needs_help')
    expect(team(data, 2).magicNumber).toBeNull()
  })

  it('counts remaining games per team and in total', () => {
    const data = computePlayoffPicture(MID_SEASON, NAMES, rules())
    expect(data.gamesRemainingTotal).toBe(4)
    expect(data.scheduleExhausted).toBe(false)
    expect(data.teams.every((t) => t.gamesRemaining === 1)).toBe(true)
    // Unscored rows never inflate the record or the points-for.
    expect(team(data, 1).gamesPlayed).toBe(1)
    expect(team(data, 1).pointsFor).toBe(100)
  })

  it('nobody is eliminated or clinched while everyone can still move', () => {
    const data = computePlayoffPicture(MID_SEASON, NAMES, rules())
    expect(data.teams.map((t) => t.status)).not.toContain('clinched')
    expect(data.teams.map((t) => t.status)).not.toContain('eliminated')
  })
})

describe('computePlayoffPicture — preseason and unsynced', () => {
  it('returns undetermined for a league with no schedule at all', () => {
    // Rosters exist, nothing is scheduled or played. There is no evidence, so
    // there is no claim — this is the branch that stops an unsynced league
    // from being told it has clinched something.
    const data = computePlayoffPicture([], NAMES6, rules())
    expect(data.teams).toHaveLength(6)
    expect(data.teams.every((t) => t.status === 'undetermined')).toBe(true)
    expect(data.teams.every((t) => t.magicNumber === null)).toBe(true)
    expect(data.weeksCounted).toBe(0)
  })

  it('returns undetermined for every team when the field size is unknown', () => {
    const data = computePlayoffPicture(
      COMPLETED,
      NAMES,
      rules({ playoffTeams: null })
    )
    expect(data.teams.every((t) => t.status === 'undetermined')).toBe(true)
    expect(data.teams.every((t) => t.magicNumber === null)).toBe(true)
    // The record is still computed — only the verdict is withheld.
    expect(team(data, 1).wins).toBe(2)
    expect(data.scheduleExhausted).toBe(false)
  })

  it('rates a team with a full slate of scheduled but unplayed games', () => {
    const scheduled = MID_SEASON.filter((r) => r.points === null)
    const data = computePlayoffPicture(scheduled, NAMES6, rules())
    // Games remain, so these teams are not evidence-free — they get a verdict.
    expect(team(data, 1).gamesRemaining).toBe(1)
    expect(team(data, 1).status).not.toBe('undetermined')
    // A team with no scheduled row at all still has none.
    expect(team(data, 5).status).toBe('undetermined')
  })
})

describe('computePlayoffPicture — ties', () => {
  it('counts a drawn game as half a win on both sides', () => {
    const data = computePlayoffPicture(
      [row(1, 1, 100, 1), row(2, 1, 100, 1)],
      NAMES,
      rules({ playoffTeams: 1 })
    )
    expect(team(data, 1).ties).toBe(1)
    expect(team(data, 1).wins).toBe(0)
    expect(team(data, 1).losses).toBe(0)
    expect(team(data, 1).winEquivalent).toBe(0.5)
  })

  it('leaves two teams dead level for one spot both alive', () => {
    // Neither has clinched (the other could take it on a tiebreaker) and
    // neither is eliminated (either could win it). "Needs help" is the only
    // honest reading of a coin-flip this module refuses to call.
    const data = computePlayoffPicture(
      [row(1, 1, 100, 1), row(2, 1, 100, 1)],
      names(2),
      rules({ playoffTeams: 1 })
    )
    expect(data.teams.map((t) => t.status)).toEqual(['needs_help', 'needs_help'])
  })

  it('breaks a seed tie on points-for before the roster key', () => {
    const data = computePlayoffPicture(
      [
        row(1, 1, 100, 1),
        row(2, 1, 90, 1),
        row(3, 1, 120, 2),
        row(4, 1, 80, 2),
      ],
      names(4),
      rules()
    )
    // T1 and T3 both won; T3 scored more, so it seeds first despite the
    // higher roster id.
    expect(data.teams.slice(0, 2).map((t) => t.nativeRosterId)).toEqual([3, 1])
  })
})

describe('computePlayoffPicture — incomplete schedules', () => {
  it('treats a bye (null matchup id) as no game, not a loss', () => {
    const data = computePlayoffPicture(
      [row(1, 1, 100, 1), row(2, 1, 90, 1), row(3, 1, 80, null)],
      names(3),
      rules()
    )
    expect(team(data, 3).gamesPlayed).toBe(0)
    expect(team(data, 3).losses).toBe(0)
    expect(team(data, 3).winEquivalent).toBe(0)
    // Its points don't count toward points-for either — that column is a
    // record of games played, and it played none.
    expect(team(data, 3).pointsFor).toBe(0)
  })

  it('treats an anomalous group size as no game rather than inventing one', () => {
    // Three rosters sharing one matchup id: `getMatchups` refuses to force
    // these into pairs and so does this, so the two surfaces can never
    // disagree about who played whom.
    const data = computePlayoffPicture(
      [row(1, 1, 100, 1), row(2, 1, 90, 1), row(3, 1, 80, 1)],
      names(3),
      rules()
    )
    expect(data.teams.every((t) => t.gamesPlayed === 0)).toBe(true)
    expect(data.gamesRemainingTotal).toBe(0)
  })

  it('counts a half-scored pair as remaining for the unscored side only', () => {
    // One side is in, the other still pending. The team that already has its
    // result must not also be told it has a game left.
    const data = computePlayoffPicture(
      [row(1, 1, 100, 1), row(2, 1, null, 1)],
      names(2),
      rules()
    )
    expect(team(data, 1).gamesRemaining).toBe(0)
    expect(team(data, 2).gamesRemaining).toBe(1)
    expect(team(data, 1).gamesPlayed).toBe(0)
  })

  it('excludes playoff weeks from the regular-season picture', () => {
    const data = computePlayoffPicture(
      [...COMPLETED, row(1, 15, 200, 1), row(4, 15, 10, 1)],
      NAMES,
      rules({ playoffWeekStart: 15 })
    )
    expect(data.weeksCounted).toBe(2)
    expect(team(data, 1).gamesPlayed).toBe(2)
    expect(team(data, 1).pointsFor).toBe(200)
  })

  it('flags a non-final week so the picture reads as provisional', () => {
    const data = computePlayoffPicture(
      [row(1, 1, 100, 1, false), row(2, 1, 90, 1, false)],
      names(2),
      rules({ playoffTeams: 1 })
    )
    expect(data.weeksCounted).toBe(1)
    expect(data.nonFinalWeeksCounted).toBe(1)
  })
})

describe('computePlayoffPicture — arbitrary league sizes and field sizes', () => {
  it('produces a different picture for every field size over one dataset', () => {
    const statuses = (playoffTeams: number) =>
      computePlayoffPicture(COMPLETED, NAMES, rules({ playoffTeams })).teams.map(
        (t) => t.status
      )
    // Field of 1: only the outright leader is alive on its own merits.
    expect(statuses(1)).toEqual([
      'clinched',
      'eliminated',
      'eliminated',
      'eliminated',
    ])
    // Field of 3: the two tied teams are now safe and only the last is out.
    expect(statuses(3)).toEqual([
      'clinched',
      'clinched',
      'clinched',
      'eliminated',
    ])
    // Nothing about the bracket size is hardcoded anywhere.
    expect(statuses(2)).not.toEqual(statuses(3))
  })

  it('handles a ten-team league with a six-team field', () => {
    const wide: PlayoffScheduleRow[] = []
    // Week 1: rosters pair 1-2, 3-4, … and the lower id always wins.
    for (let id = 1; id <= 10; id += 2) {
      const matchupId = (id + 1) / 2
      wide.push(row(id, 1, 100 + id, matchupId))
      wide.push(row(id + 1, 1, 50 + id, matchupId))
    }
    const data = computePlayoffPicture(wide, names(10), rules({ playoffTeams: 6 }))
    expect(data.teams).toHaveLength(10)
    expect(data.teams.map((t) => t.seed)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
    // Five winners, five losers, six spots: every winner is safe and the
    // losers are all still level with each other for the last berth.
    expect(data.teams.filter((t) => t.status === 'clinched')).toHaveLength(5)
    expect(data.teams.filter((t) => t.status === 'needs_help')).toHaveLength(5)
  })

  it('clamps a field larger than the league and says so', () => {
    const data = computePlayoffPicture(
      COMPLETED,
      NAMES,
      rules({ playoffTeams: 12 })
    )
    // Four rosters, a field of twelve: everyone is genuinely in, but the
    // surface must be able to say the configured size was impossible.
    expect(data.fieldSizeClamped).toBe(true)
    expect(data.teams.every((t) => t.status === 'clinched')).toBe(true)
  })
})

describe('computePlayoffPicture — standings cross-check', () => {
  it('flags a snapshot that disagrees with the recomputed record', () => {
    const data = computePlayoffPicture(
      COMPLETED,
      NAMES,
      rules(),
      new Map([
        [1, 3],
        [2, 1],
      ])
    )
    expect(team(data, 1).standingsWins).toBe(3)
    expect(team(data, 1).disagreesWithStandings).toBe(true)
    expect(team(data, 2).disagreesWithStandings).toBe(false)
    expect(data.hasStandingsDisagreement).toBe(true)
  })

  it('leaves standings wins null for a team with no snapshot row', () => {
    const data = computePlayoffPicture(COMPLETED, NAMES, rules())
    expect(team(data, 1).standingsWins).toBeNull()
    expect(data.hasStandingsDisagreement).toBe(false)
  })
})

describe('parsePlayoffRules', () => {
  it('reads the wiki-documented playoff settings keys', () => {
    const parsed = parsePlayoffRules({
      settings: {
        playoff_teams: 6,
        playoff_week_start: 15,
        playoff_type: 1,
        playoff_round_type: 0,
      },
    })
    expect(parsed.playoffTeams).toBe(6)
    expect(parsed.playoffWeekStart).toBe(15)
    expect(parsed.playoffTypeRaw).toBe(1)
    expect(parsed.playoffRoundTypeRaw).toBe(0)
    expect(parsed.seedingBasis).toBe('recomputed_record')
  })

  it('infers first-round byes from the bracket size, never from a flag', () => {
    // No bracket resource is ingested, so byes are arithmetic:
    // nextPowerOfTwo(N) − N.
    expect(parsePlayoffRules({ settings: { playoff_teams: 6 } }).firstRoundByes).toBe(2)
    expect(parsePlayoffRules({ settings: { playoff_teams: 4 } }).firstRoundByes).toBe(0)
    expect(parsePlayoffRules({ settings: { playoff_teams: 8 } }).firstRoundByes).toBe(0)
    expect(parsePlayoffRules({ settings: { playoff_teams: 5 } }).firstRoundByes).toBe(3)
  })

  it('detects divisions without acting on them', () => {
    const divisional = parsePlayoffRules({
      settings: { playoff_teams: 6, divisions: 2 },
    })
    expect(divisional.divisionCount).toBe(2)
    expect(divisional.hasDivisions).toBe(true)

    const single = parsePlayoffRules({ settings: { playoff_teams: 6, divisions: 1 } })
    expect(single.divisionCount).toBe(1)
    expect(single.hasDivisions).toBe(false)
  })

  it('degrades every field to null rather than to a default', () => {
    for (const raw of [null, undefined, 42, 'settings', [], {}, { settings: null }]) {
      const parsed = parsePlayoffRules(raw)
      expect(parsed.playoffTeams).toBeNull()
      expect(parsed.playoffWeekStart).toBeNull()
      expect(parsed.divisionCount).toBeNull()
      expect(parsed.hasDivisions).toBe(false)
      expect(parsed.firstRoundByes).toBeNull()
    }
  })

  it('rejects values that are not usable integers', () => {
    // The settings object is an open map with no schema guarantee (wiki:
    // sleeper-api/league-endpoint), so a string or a float is a real
    // possibility and must not become a field size.
    expect(parsePlayoffRules({ settings: { playoff_teams: '6' } }).playoffTeams).toBeNull()
    expect(parsePlayoffRules({ settings: { playoff_teams: 6.5 } }).playoffTeams).toBeNull()
    expect(parsePlayoffRules({ settings: { playoff_teams: 0 } }).playoffTeams).toBeNull()
    expect(parsePlayoffRules({ settings: { playoff_teams: 1 } }).playoffTeams).toBeNull()
    expect(parsePlayoffRules({ settings: { playoff_teams: -6 } }).playoffTeams).toBeNull()
  })

  it('preserves unrecognized keys by ignoring them, never by throwing', () => {
    const parsed = parsePlayoffRules({
      settings: { playoff_teams: 6, some_future_key: { nested: true } },
    })
    expect(parsed.playoffTeams).toBe(6)
  })
})

// --- service reads against a recording fake client --------------------------

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
      // Week 2 is scheduled but unscored — the remaining schedule.
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 1,
        native_matchup_id: 1,
        week: 2,
        effective_points: null,
        is_final: false,
      },
      {
        league_id: LEAGUE_UUID,
        native_roster_id: 2,
        native_matchup_id: 1,
        week: 2,
        effective_points: null,
        is_final: false,
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
        roster_settings_raw: {
          settings: { playoff_week_start: 15, playoff_teams: 2 },
        },
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

describe('getPlayoffRules', () => {
  it('resolves the field size from raw settings, not derived_config', () => {
    return getPlayoffRules(makeDb(seed(), recorder()), LEAGUE_UUID).then((r) => {
      expect(r.playoffTeams).toBe(2)
      expect(r.playoffWeekStart).toBe(15)
    })
  })

  it('reads only league_config, and only roster_settings_raw', async () => {
    const rec = recorder()
    await getPlayoffRules(makeDb(seed(), rec), LEAGUE_UUID)
    expect(rec.tables).toEqual(['league_config'])
    expect(rec.selects.league_config).toEqual(['roster_settings_raw'])
  })

  it('returns an all-null shape for a league with no config row', async () => {
    const r = await getPlayoffRules(makeDb({}, recorder()), LEAGUE_UUID)
    expect(r.playoffTeams).toBeNull()
    expect(r.firstRoundByes).toBeNull()
  })
})

describe('getPlayoffPicture', () => {
  it('reads the league-scoped regular season and its remaining schedule', async () => {
    const data = await getPlayoffPicture(makeDb(seed(), recorder()), LEAGUE_UUID)
    expect(data.teams.map((t) => t.teamName)).toEqual(['Alpha', 'Bravo'])
    // Week 15 excluded by the playoff boundary; the other league never appears.
    expect(data.weeksCounted).toBe(1)
    expect(team(data, 1).wins).toBe(1)
    expect(team(data, 1).pointsFor).toBe(110.5)
    // Week 2's unscored pair is the remaining schedule, one game each.
    expect(data.gamesRemainingTotal).toBe(2)
    expect(data.scheduleExhausted).toBe(false)
    expect(team(data, 1).standingsWins).toBe(1)
    expect(data.hasStandingsDisagreement).toBe(false)
  })

  it('reads only matchups, standings, league_config and rosters', async () => {
    const rec = recorder()
    await getPlayoffPicture(makeDb(seed(), rec), LEAGUE_UUID)
    expect(new Set(rec.tables)).toEqual(
      new Set(['matchups', 'standings', 'league_config', 'rosters'])
    )
  })

  it('never selects share_token, owner_id, or a wildcard', async () => {
    const rec = recorder()
    await getPlayoffPicture(makeDb(seed(), rec), LEAGUE_UUID)
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
