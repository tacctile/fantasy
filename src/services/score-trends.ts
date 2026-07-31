/**
 * Weekly team-score aggregation (Wave 5 — Score charts, item 1). Server-only.
 *
 * The one place a team's per-week scoring series is assembled. Every chart in
 * the Score Trends section reads this module's output; none of them re-derive a
 * total, an average, or a week range of their own.
 *
 * WHAT A WEEK'S POINTS ARE: the stored `matchups.effective_points` — the
 * commissioner-override-aware total, platform-scored at ingestion (wiki:
 * sleeper-api/matchup-endpoint; the precedence is realized once in schema and
 * read as-is by `dashboard.ts`). Scores are never recomputed here from
 * `player_scores`; summing starter rows would produce a second, drifting
 * definition of the same number the standings and matchup surfaces already
 * show. The build file's "joined from existing player_scores/matchup data" is
 * satisfied by the matchup side of that pair, which is where the authoritative
 * per-roster-week total actually lives.
 *
 * WEEK SCOPE (Nick's Clarify, 2026-07-31): regular season only — weeks at or
 * after `playoff_week_start` are excluded, reusing `getPowerRankings`'
 * already-shipped raw `roster_settings_raw` read rather than growing a second
 * week-scope rule. When that value is absent or unparseable the whole scored
 * season is plotted, exactly as power rankings already degrades. `derived_config`
 * does not carry playoff fields (the known gap `league-context.ts` documents),
 * so the raw read is the sanctioned escape hatch, not a shortcut.
 *
 * Season scoping is structural, as everywhere else: a `leagues` row is already
 * per-season, so league-scoped reads are inherently that league-season's data.
 *
 * NOT a not-found-resolving service: the page resolves league identity through
 * `getLeagueContext` (Wave 5's mandated resolver) before calling this, so
 * re-reading `leagues` here would mean two identity queries per render. A
 * genuine database fault throws and is caught by `settleQuery` at the page.
 *
 * Data-exposure boundary, same discipline as `dashboard.ts` and
 * `league-context.ts`: explicit columns only, never `share_token`, `owner_id`,
 * or a provider-native league ID.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import { fetchRosterNames, parsePlayoffWeekStart } from './dashboard'

/** One counted week of one team's series. `points` is null for a week the team has no scored row in. */
export type TeamScoreWeek = {
  week: number
  points: number | null
  /** False when the platform still reports the week as in-progress. */
  isFinal: boolean
}

export type TeamScoreTrend = {
  nativeRosterId: number
  teamName: string | null
  ownerDisplayName: string | null
  /**
   * Categorical colour slot, assigned by `native_roster_id` ascending — a
   * STABLE entity key, never rank, so re-sorting the page never repaints a
   * team (the rule `series.ts` states; enforced here at the data layer).
   */
  seriesIndex: number
  /** One entry per counted week, aligned index-for-index with `ScoreTrendsData.weeks`. */
  weeks: TeamScoreWeek[]
  /**
   * Running total through each counted week, aligned to `weeks`. Null before
   * the team's first scored week (the line starts where the data does); a
   * missed week afterwards carries the previous total forward rather than
   * dropping to zero, since a bye is missing data, not a zero-point week.
   */
  cumulative: (number | null)[]
  scoredWeeks: number
  totalPoints: number
  /** Mean of the team's scored weeks; null when it has none. */
  averagePoints: number | null
  /** Floor / midpoint / ceiling of the team's scored weeks — the spread band. */
  lowPoints: number | null
  medianPoints: number | null
  highPoints: number | null
}

export type ScoreTrendsData = {
  /** Counted regular-season weeks with at least one scored roster, ascending. */
  weeks: number[]
  /** Ordered total points desc → native_roster_id asc. */
  teams: TeamScoreTrend[]
  /** Mean of that week's scored teams, aligned to `weeks`. */
  leagueAveragePerWeek: number[]
  /** Mean of teams' cumulative totals at each week, aligned to `weeks`. */
  leagueAverageCumulative: number[]
  /** Median of every counted team-week score in the league; null when nothing is scored. */
  leagueMedianWeek: number | null
  weeksCounted: number
  /** Counted weeks carrying any non-final score — surfaced as provisional. */
  nonFinalWeeksCounted: number
  /**
   * Under ~6 counted weeks a VARIANCE read (the spread band) is sample-noise
   * dominated — wiki: in-season-management/points-for-against-luck-analysis
   * (flag any reading under ~6 weeks) and consistency-score-boom-bust-rate
   * (a minimum sample is required before a variance figure means anything).
   * Raw per-week bars are observations, not inferences, and carry no caveat.
   */
  lowConfidence: boolean
  /** Null when unparseable — the whole scored season was plotted. */
  playoffWeekStart: number | null
}

/** A matchup row reduced to what the aggregation needs. */
export type ScoreRow = {
  nativeRosterId: number
  week: number
  points: number
  isFinal: boolean
}

/**
 * Assemble one league's regular-season weekly-score series.
 *
 * An empty `weeks` array is the honest pre-season / unsynced state, not an
 * error — the section renders its empty copy rather than a failure notice.
 */
export async function getScoreTrends(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<ScoreTrendsData> {
  const { data: matchupRows, error: matchupsError } = await db
    .from('matchups')
    .select('native_roster_id, week, effective_points, is_final')
    .eq('league_id', leagueId)
  if (matchupsError) {
    throw new Error(`score-trends matchups query failed: ${matchupsError.message}`)
  }

  const { data: config, error: configError } = await db
    .from('league_config')
    .select('roster_settings_raw')
    .eq('league_id', leagueId)
    .maybeSingle()
  if (configError) {
    throw new Error(`score-trends config query failed: ${configError.message}`)
  }

  const rosterNames = await fetchRosterNames(db, leagueId)

  const rows: ScoreRow[] = []
  for (const row of matchupRows) {
    if (row.effective_points === null) continue
    rows.push({
      nativeRosterId: row.native_roster_id,
      week: row.week,
      points: Number(row.effective_points),
      isFinal: row.is_final,
    })
  }

  return computeScoreTrends(
    rows,
    rosterNames,
    parsePlayoffWeekStart(config?.roster_settings_raw)
  )
}

/**
 * The pure aggregation — no I/O, so every edge case below is unit-testable
 * without a database: a league mid-week, a team on bye, a season that never
 * started, a playoff boundary that doesn't parse.
 */
export function computeScoreTrends(
  rows: readonly ScoreRow[],
  rosterNames: ReadonlyMap<
    number,
    { teamName: string | null; ownerDisplayName: string | null }
  >,
  playoffWeekStart: number | null
): ScoreTrendsData {
  const counted = rows.filter(
    (row) =>
      Number.isFinite(row.points) &&
      (playoffWeekStart === null || row.week < playoffWeekStart)
  )

  const weeks = [...new Set(counted.map((row) => row.week))].sort((a, b) => a - b)

  // Roster ids come from the roster snapshot AND the score rows: a team whose
  // roster row hasn't synced still has scores worth plotting, and a team with
  // no scores yet still belongs on the list as an honest empty series.
  const rosterIds = [
    ...new Set([...rosterNames.keys(), ...counted.map((row) => row.nativeRosterId)]),
  ].sort((a, b) => a - b)

  const seriesIndexById = new Map(rosterIds.map((id, index) => [id, index]))
  const byRosterWeek = new Map<string, ScoreRow>()
  for (const row of counted) {
    // Duplicate roster-weeks are impossible under the matchups unique key; if
    // one ever appears, the last row wins rather than double-counting.
    byRosterWeek.set(`${row.nativeRosterId}:${row.week}`, row)
  }

  const unordered: TeamScoreTrend[] = rosterIds.map((rosterId) => {
    const names = rosterNames.get(rosterId)
    const weekEntries: TeamScoreWeek[] = weeks.map((week) => {
      const row = byRosterWeek.get(`${rosterId}:${week}`)
      return {
        week,
        points: row === undefined ? null : round2(row.points),
        isFinal: row === undefined ? true : row.isFinal,
      }
    })

    const scored = weekEntries
      .map((entry) => entry.points)
      .filter((points): points is number => points !== null)

    let running = 0
    let started = false
    const cumulative = weekEntries.map((entry) => {
      if (entry.points !== null) {
        running += entry.points
        started = true
      }
      return started ? round2(running) : null
    })

    return {
      nativeRosterId: rosterId,
      teamName: names?.teamName ?? null,
      ownerDisplayName: names?.ownerDisplayName ?? null,
      seriesIndex: seriesIndexById.get(rosterId) ?? 0,
      weeks: weekEntries,
      cumulative,
      scoredWeeks: scored.length,
      totalPoints: round2(scored.reduce((sum, points) => sum + points, 0)),
      averagePoints:
        scored.length === 0
          ? null
          : round2(scored.reduce((sum, points) => sum + points, 0) / scored.length),
      lowPoints: scored.length === 0 ? null : round2(Math.min(...scored)),
      medianPoints: median(scored),
      highPoints: scored.length === 0 ? null : round2(Math.max(...scored)),
    }
  })

  const teams = [...unordered].sort((a, b) => {
    if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints
    return a.nativeRosterId - b.nativeRosterId
  })

  const leagueAveragePerWeek = weeks.map((_, index) =>
    mean(teams.map((team) => team.weeks[index].points))
  )
  const leagueAverageCumulative = weeks.map((_, index) =>
    mean(teams.map((team) => team.cumulative[index]))
  )

  let nonFinalWeeksCounted = 0
  for (const week of weeks) {
    const anyProvisional = counted.some(
      (row) => row.week === week && !row.isFinal
    )
    if (anyProvisional) nonFinalWeeksCounted += 1
  }

  return {
    weeks,
    teams,
    leagueAveragePerWeek,
    leagueAverageCumulative,
    leagueMedianWeek: median(counted.map((row) => row.points)),
    weeksCounted: weeks.length,
    nonFinalWeeksCounted,
    lowConfidence: weeks.length < LOW_CONFIDENCE_WEEKS,
    playoffWeekStart,
  }
}

/** The ~6-week floor both wiki pages converge on for a variance/luck reading. */
const LOW_CONFIDENCE_WEEKS = 6

/**
 * The midpoint of a sample. Even counts average the two middle values; an
 * empty sample is null, never zero. Deliberately the true median rather than
 * an interpolated 10th/90th percentile pair: with ~14 weekly observations a
 * percentile interpolation is precision the sample can't support, while the
 * floor/median/ceiling framing is what the consistency wiki actually asks for
 * over a single dispersion number.
 */
function median(values: readonly number[]): number | null {
  const finite = values.filter((value) => Number.isFinite(value))
  if (finite.length === 0) return null
  const sorted = [...finite].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? round2(sorted[middle])
    : round2((sorted[middle - 1] + sorted[middle]) / 2)
}

/** Mean over the present values only — a bye week is absent, never a zero. */
function mean(values: readonly (number | null)[]): number {
  const present = values.filter(
    (value): value is number => value !== null && Number.isFinite(value)
  )
  if (present.length === 0) return 0
  return round2(present.reduce((sum, value) => sum + value, 0) / present.length)
}

const round2 = (value: number): number => Math.round(value * 100) / 100
