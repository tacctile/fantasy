/**
 * Lucky/unlucky tracker (Wave 5 — items 1, 2 and 4). Server-only.
 *
 * The one place schedule luck is defined. Luck is the gap between what a team's
 * SCORING earned it and what its SCHEDULE gave it:
 *
 *     luck = actual win-equivalent − expected (all-play) wins
 *
 * ALL-PLAY IS THE EXPECTATION (wiki: in-season-management/
 * points-for-against-luck-analysis, Key Decision). Each counted week, a team is
 * compared against every other team that scored that week — W × (N−1)
 * hypothetical matchups — and its win share for the week is
 * `(beaten + tied/2) / (opponents)`. Summed over the season that is its expected
 * wins. Pythagorean expectation is deliberately NOT computed here: the same wiki
 * page records that no proposed exponent is corroborated, so the platform
 * surfaces all-play alone rather than an uncalibrated second number.
 *
 * ACTUAL WINS ARE RECOMPUTED, NOT READ FROM `standings` (Nick's Clarify,
 * 2026-07-31). Head-to-head results are re-derived from the same counted weeks
 * the expectation uses, pairing on `native_matchup_id` exactly as
 * `getMatchups` does. Reading the standings snapshot instead would mix a
 * season-to-date figure (playoff weeks and commissioner adjustments included)
 * against a regular-season-only expectation, making the differential an
 * artifact of two week scopes rather than a measurement. `standingsWins` is
 * carried alongside so the surface can show the snapshot too and say so when
 * the two disagree — never silently pick one.
 *
 * A BYE WEEK RATES BUT DOES NOT PLAY (Nick's Clarify, 2026-07-31). A team with
 * a score but no opponent (null `native_matchup_id`, an odd league, an
 * anomalous group size) is still all-play-compared — the score is a real
 * observation of team strength, and `getPowerRankings` already counts it that
 * way — but records no actual result. The consequence is deliberate and must be
 * surfaced, never hidden: such a team's `weeksRated` exceeds its `gamesPlayed`,
 * so its expected wins are drawn from a larger denominator than its actual
 * record. `hasRatingGap` is that disclosure, per team and league-wide.
 *
 * WEEK SCOPE: regular season only, through the SAME `parsePlayoffWeekStart`
 * power rankings and score trends already share (exported from `dashboard.ts`,
 * never copied). When the boundary is absent or unparseable every scored week
 * counts, exactly as both existing surfaces already degrade.
 *
 * Season scoping is structural: a `leagues` row is already per-season, so a
 * league-scoped read is inherently that league-season's data.
 *
 * NOT a not-found-resolving service, matching `score-trends.ts`: the page
 * resolves identity through `getLeagueContext` first, so re-reading `leagues`
 * here would mean two identity queries per render. A genuine database fault
 * throws and is caught by `settleQuery` at the page.
 *
 * Data-exposure boundary, same discipline as `dashboard.ts` and
 * `league-context.ts`: explicit columns only, never `share_token`, `owner_id`,
 * or a provider-native league ID. Nothing here touches `draft_state`, which is
 * what lets the spectator summary component read this service's output.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import { fetchRosterNames, parsePlayoffWeekStart } from './dashboard'

/** A head-to-head outcome, or the honest absence of one. */
export type LuckWeekResult = 'win' | 'loss' | 'tie' | 'no_game'

/** One counted week of one team's luck accumulation. */
export type TeamLuckWeek = {
  week: number
  /** Null when the team has no scored row that week — a bye, not a zero. */
  points: number | null
  /** The head-to-head opponent's points; null when no game was paired. */
  opponentPoints: number | null
  result: LuckWeekResult
  /**
   * The team's all-play win share for the week, 0–1. Null when the week
   * couldn't be rated (the team didn't score, or nobody else did).
   */
  expectedWinShare: number | null
  /** Actual win-equivalent for the week: 1 win, 0.5 tie, 0 loss, 0 no game. */
  actualWinShare: number
  /** Running `actual − expected` through this week — the drill-down's series. */
  cumulativeLuck: number
  /** False when the platform still reports the week as in-progress. */
  isFinal: boolean
}

export type TeamLuck = {
  nativeRosterId: number
  teamName: string | null
  ownerDisplayName: string | null
  /** 1-based, luck desc → actual win-equivalent desc → roster id asc. */
  rank: number
  actualWins: number
  actualLosses: number
  actualTies: number
  /** wins + ties/2 — the figure directly comparable to expected wins, since
   *  the all-play expectation splits ties the same way. */
  actualWinEquivalent: number
  /** Sum of weekly all-play win shares over the team's rated weeks. */
  expectedWins: number
  /** ratedWeeks − expectedWins; the other half of "5.4-3.6 expected". */
  expectedLosses: number
  /** actualWinEquivalent − expectedWins. Positive = luckier than it scored. */
  luck: number
  /** Head-to-head games actually played (both sides scored). */
  gamesPlayed: number
  /** Weeks that fed the expectation — byes included, so this can exceed
   *  `gamesPlayed`. Surfaced, never silently reconciled. */
  weeksRated: number
  /** weeksRated > gamesPlayed: the expectation covers weeks the record can't. */
  hasRatingGap: boolean
  /** The `standings` snapshot's wins, for cross-checking against the
   *  recomputed record. Null when the team has no standings row yet. */
  standingsWins: number | null
  /** True when the snapshot and the recomputed record disagree — the surface
   *  says so rather than quietly presenting one as the other. */
  disagreesWithStandings: boolean
  /** One entry per counted league week, aligned to `LuckData.weeks`. */
  weeks: TeamLuckWeek[]
}

export type LuckData = {
  /** Counted regular-season weeks with at least one scored roster, ascending. */
  weeks: number[]
  /** Ranked by luck differential, luckiest first. */
  teams: TeamLuck[]
  /** Weeks where at least two rosters scored — the rateable weeks. */
  weeksCounted: number
  /** Counted weeks carrying any non-final score — surfaced as provisional. */
  nonFinalWeeksCounted: number
  /**
   * Under ~6 counted weeks a luck reading is sample-noise dominated (wiki:
   * points-for-against-luck-analysis — "treat roughly the first five to six
   * weeks as producing an unreliable luck signal"). Nick's Clarify: render the
   * chart WITH a caveat rather than suppressing it, matching how power
   * rankings and the score-spread band already behave.
   */
  lowConfidence: boolean
  /** True when any team's expectation covers more weeks than its record. */
  hasRatingGap: boolean
  /** True when any team's recomputed record differs from its standings row. */
  hasStandingsDisagreement: boolean
  /** Null when unparseable — the whole scored season was counted. */
  playoffWeekStart: number | null
}

/** A matchup row reduced to what the luck calculation needs. */
export type LuckRow = {
  nativeRosterId: number
  /** Null is a bye/no-opponent week (wiki: sleeper-api/matchup-endpoint). */
  nativeMatchupId: number | null
  week: number
  points: number
  isFinal: boolean
}

/**
 * Assemble one league's regular-season luck table.
 *
 * An empty `weeks` array is the honest pre-season / unsynced state, not an
 * error — the section renders its empty copy rather than a failure notice.
 */
export async function getLuck(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<LuckData> {
  const { data: matchupRows, error: matchupsError } = await db
    .from('matchups')
    .select('native_roster_id, native_matchup_id, week, effective_points, is_final')
    .eq('league_id', leagueId)
  if (matchupsError) {
    throw new Error(`luck matchups query failed: ${matchupsError.message}`)
  }

  const { data: config, error: configError } = await db
    .from('league_config')
    .select('roster_settings_raw')
    .eq('league_id', leagueId)
    .maybeSingle()
  if (configError) {
    throw new Error(`luck config query failed: ${configError.message}`)
  }

  const { data: standingsRows, error: standingsError } = await db
    .from('standings')
    .select('native_roster_id, wins')
    .eq('league_id', leagueId)
  if (standingsError) {
    throw new Error(`luck standings query failed: ${standingsError.message}`)
  }

  const rosterNames = await fetchRosterNames(db, leagueId)

  const rows: LuckRow[] = []
  for (const row of matchupRows) {
    if (row.effective_points === null) continue
    rows.push({
      nativeRosterId: row.native_roster_id,
      nativeMatchupId: row.native_matchup_id,
      week: row.week,
      points: Number(row.effective_points),
      isFinal: row.is_final,
    })
  }

  const standingsWins = new Map(
    standingsRows.map((row) => [row.native_roster_id, row.wins])
  )

  return computeLuck(
    rows,
    rosterNames,
    parsePlayoffWeekStart(config?.roster_settings_raw),
    standingsWins
  )
}

/**
 * The pure luck calculation — no I/O, so every edge case the tracker has to
 * survive is unit-testable without a database: ties, byes, a week still being
 * played, a season that never started, an odd team count.
 */
export function computeLuck(
  rows: readonly LuckRow[],
  rosterNames: ReadonlyMap<
    number,
    { teamName: string | null; ownerDisplayName: string | null }
  >,
  playoffWeekStart: number | null,
  standingsWins: ReadonlyMap<number, number> = new Map()
): LuckData {
  const counted = rows.filter(
    (row) =>
      Number.isFinite(row.points) &&
      (playoffWeekStart === null || row.week < playoffWeekStart)
  )

  const weeks = [...new Set(counted.map((row) => row.week))].sort((a, b) => a - b)

  // Roster ids come from the roster snapshot AND the score rows, mirroring
  // score-trends: a team whose roster row hasn't synced still belongs in the
  // table, and so does a team with no scores yet (as an honest empty row).
  const rosterIds = [
    ...new Set([...rosterNames.keys(), ...counted.map((row) => row.nativeRosterId)]),
  ].sort((a, b) => a - b)

  const byWeek = new Map<number, LuckRow[]>()
  for (const row of counted) {
    const week = byWeek.get(row.week)
    if (week === undefined) byWeek.set(row.week, [row])
    else week.push(row)
  }

  let weeksCounted = 0
  let nonFinalWeeksCounted = 0
  for (const week of weeks) {
    const scores = byWeek.get(week) ?? []
    if (scores.length >= 2) weeksCounted += 1
    if (scores.some((row) => !row.isFinal)) nonFinalWeeksCounted += 1
  }

  const unranked = rosterIds.map((rosterId) => {
    const names = rosterNames.get(rosterId)

    let actualWins = 0
    let actualLosses = 0
    let actualTies = 0
    let expectedWins = 0
    let gamesPlayed = 0
    let weeksRated = 0
    let runningLuck = 0

    const weekEntries: TeamLuckWeek[] = weeks.map((week) => {
      const scores = byWeek.get(week) ?? []
      const own = scores.find((row) => row.nativeRosterId === rosterId)

      if (own === undefined) {
        // No scored row at all this week: nothing to rate, nothing played.
        return {
          week,
          points: null,
          opponentPoints: null,
          result: 'no_game',
          expectedWinShare: null,
          actualWinShare: 0,
          cumulativeLuck: round3(runningLuck),
          isFinal: true,
        }
      }

      const expectedWinShare = allPlayShare(own, scores)
      if (expectedWinShare !== null) {
        expectedWins += expectedWinShare
        weeksRated += 1
      }

      const opponent = findOpponent(own, scores)
      let result: LuckWeekResult = 'no_game'
      let actualWinShare = 0
      if (opponent !== null) {
        gamesPlayed += 1
        if (own.points > opponent.points) {
          result = 'win'
          actualWins += 1
          actualWinShare = 1
        } else if (own.points < opponent.points) {
          result = 'loss'
          actualLosses += 1
        } else {
          result = 'tie'
          actualTies += 1
          actualWinShare = 0.5
        }
      }

      runningLuck += actualWinShare - (expectedWinShare ?? 0)

      return {
        week,
        points: round2(own.points),
        opponentPoints: opponent === null ? null : round2(opponent.points),
        result,
        expectedWinShare:
          expectedWinShare === null ? null : round3(expectedWinShare),
        actualWinShare,
        cumulativeLuck: round3(runningLuck),
        isFinal: own.isFinal,
      }
    })

    const actualWinEquivalent = actualWins + actualTies / 2
    const snapshotWins = standingsWins.get(rosterId) ?? null

    return {
      nativeRosterId: rosterId,
      teamName: names?.teamName ?? null,
      ownerDisplayName: names?.ownerDisplayName ?? null,
      actualWins,
      actualLosses,
      actualTies,
      actualWinEquivalent: round2(actualWinEquivalent),
      expectedWins: round2(expectedWins),
      expectedLosses: round2(Math.max(0, weeksRated - expectedWins)),
      luck: round2(actualWinEquivalent - expectedWins),
      gamesPlayed,
      weeksRated,
      hasRatingGap: weeksRated > gamesPlayed,
      standingsWins: snapshotWins,
      disagreesWithStandings:
        snapshotWins !== null && snapshotWins !== actualWins,
      weeks: weekEntries,
    }
  })

  // Luck desc → actual win-equivalent desc → roster id asc. DECLARED WIKI
  // SILENCE (2026-07-31): no wiki page covers ranking tie-breakers; the
  // standings ordering is itself a platform decision, and this follows its
  // shape (primary measure, then a real-record discriminator, then a stable
  // key so the order never depends on row arrival).
  const ranked = [...unranked].sort((a, b) => {
    if (a.luck !== b.luck) return b.luck - a.luck
    if (a.actualWinEquivalent !== b.actualWinEquivalent) {
      return b.actualWinEquivalent - a.actualWinEquivalent
    }
    return a.nativeRosterId - b.nativeRosterId
  })

  const teams: TeamLuck[] = ranked.map((team, index) => ({
    ...team,
    rank: index + 1,
  }))

  return {
    weeks,
    teams,
    weeksCounted,
    nonFinalWeeksCounted,
    lowConfidence: weeksCounted < LOW_CONFIDENCE_WEEKS,
    hasRatingGap: teams.some((team) => team.hasRatingGap),
    hasStandingsDisagreement: teams.some((team) => team.disagreesWithStandings),
    playoffWeekStart,
  }
}

/** The ~6-week floor the luck wiki page sets for a trustworthy reading. */
const LOW_CONFIDENCE_WEEKS = 6

/**
 * One team's all-play win share for a week: beaten + tied/2, over the number of
 * other teams that scored. Null when it has no opponents to be compared with —
 * a single-team week rates nobody, rather than crediting a free 1.000.
 */
function allPlayShare(own: LuckRow, scores: readonly LuckRow[]): number | null {
  let beaten = 0
  let tied = 0
  let opponents = 0
  for (const other of scores) {
    if (other.nativeRosterId === own.nativeRosterId) continue
    opponents += 1
    if (own.points > other.points) beaten += 1
    else if (own.points === other.points) tied += 1
  }
  if (opponents === 0) return null
  return (beaten + tied / 2) / opponents
}

/**
 * The head-to-head opponent for a roster-week, or null when there isn't one.
 *
 * Null `native_matchup_id` is a bye. A group that isn't exactly two rosters is
 * an anomaly (`getMatchups` already refuses to force those into pairs), and is
 * treated here as no game rather than an invented opponent — the same posture,
 * so the two surfaces can never disagree about who played whom.
 */
function findOpponent(own: LuckRow, scores: readonly LuckRow[]): LuckRow | null {
  if (own.nativeMatchupId === null) return null
  const group = scores.filter(
    (row) => row.nativeMatchupId === own.nativeMatchupId
  )
  if (group.length !== 2) return null
  const opponent = group.find(
    (row) => row.nativeRosterId !== own.nativeRosterId
  )
  return opponent ?? null
}

const round2 = (value: number): number => Math.round(value * 100) / 100
/** Win shares need a third place — a 1/9 all-play share is 0.111, not 0.11. */
const round3 = (value: number): number => Math.round(value * 1000) / 1000
