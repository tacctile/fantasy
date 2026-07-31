/**
 * Playoff picture (Wave 5 — items 1 and 2). Server-only.
 *
 * Two things live here, in the shape `luck.ts` established: a rules resolver
 * that answers "what does THIS league's playoff structure actually look like",
 * and a pure, I/O-free calculation that turns current standings plus the
 * remaining schedule into clinched/eliminated/in-contention status and a magic
 * number. The calculation never reads a database, so every edge case the
 * picture has to survive is unit-testable.
 *
 * THE PLAYOFF FIELDS COME FROM RAW SETTINGS, NOT `derived_config`. This is the
 * standing gap `league-context.ts` documented and deliberately left to this
 * item. `derived_config` carries no playoff fields, and the
 * league-configuration-data-model ADR's explicit escape hatch is that "any
 * application feature needing a setting not yet present in `derived_config`
 * reads the relevant raw column directly rather than the platform inventing a
 * placeholder or guessed value in the normalized layer". So `playoff_teams`
 * joins `playoff_week_start` as a raw-column read — the same key family, from
 * the same wiki-documented settings object (sleeper-api/league-endpoint:
 * "Playoff structure is controlled by `playoff_week_start`, `playoff_teams`,
 * `playoff_type`, and `playoff_round_type`"), through the same posture.
 *
 * NOTHING HERE IS EVER DEFAULTED (Nick's Clarify, 2026-07-31). An absent or
 * unparseable `playoff_teams` resolves to null and the picture reports itself
 * undeterminable, rather than assuming a conventional six-team field. A guessed
 * field size doesn't produce a slightly-wrong picture — it produces confident
 * "CLINCHED" badges that are simply false, which is worse than an honest blank.
 *
 * DECLARED WIKI SILENCE (2026-07-31, at decision time — searched
 * `wiki/ROUTING.md` + `wiki/index.md` + the league-mechanics and
 * in-season-management category indexes before writing):
 *
 *   1. Seeding order and tiebreakers. No wiki page covers how a fantasy league
 *      orders teams into seeds. `league-mechanics/playoff-schedule-strength` is
 *      about NFL weeks 15-17 as a player-evaluation tiebreaker, not league
 *      seeding. Resolved by Nick's Clarify: seeds come from the RECOMPUTED
 *      record (luck.ts's precedent), points-for as the discriminator.
 *   2. Clinch / elimination / magic-number methodology. Genuinely uncovered.
 *      Resolved here by pure deterministic bounding — see `computePlayoffPicture`.
 *   3. Fantasy-league division seeding. The league-endpoint settings inventory
 *      never names a divisions key, and no page describes division-winner
 *      seeding. Resolved by Nick's Clarify: DETECT AND DISCLOSE, never reorder.
 *   4. The numeric VALUE semantics of `playoff_type` / `playoff_round_type`.
 *      The wiki names both keys but never enumerates what their integers mean.
 *      They are therefore stored raw and uninterpreted — this module never
 *      branches on them. They exist in the type so the surface can disclose
 *      that a non-default structure is configured without pretending to know
 *      what it is.
 *
 * SEEDS ARE RECOMPUTED, NOT READ FROM `standings` (Nick's Clarify,
 * 2026-07-31) — the same ruling `getLuck` already carries, for the same reason:
 * the standings snapshot is season-to-date and absorbs playoff results and
 * commissioner adjustments, while this picture is a regular-season question.
 * Mixing the two would make a seed an artifact of two week scopes. The snapshot
 * is carried alongside as a cross-check and any disagreement is surfaced, never
 * silently resolved in favour of one.
 *
 * Season scoping is structural: a `leagues` row is already per-season, so a
 * league-scoped read is inherently that league-season's data.
 *
 * Data-exposure boundary, same discipline as `dashboard.ts`, `luck.ts` and
 * `league-context.ts`: explicit columns only, never `share_token`, `owner_id`,
 * or a provider-native league ID. Nothing here touches `draft_state`, which is
 * what will let the spectator playoff-status component read this service's
 * output when its own item ships.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import { fetchRosterNames, parsePlayoffWeekStart } from './dashboard'

/**
 * One league's playoff structure, as far as its stored settings actually say.
 *
 * Every field is nullable on purpose. A league whose config hasn't synced, or
 * an ESPN league before its settings shape is known, must degrade to an honest
 * "not known" rather than to a conventional default.
 */
export type PlayoffRules = {
  /** `settings.playoff_teams` — the field size. Null when absent/unparseable. */
  playoffTeams: number | null
  /** The regular-season boundary, through the one shared parser. */
  playoffWeekStart: number | null
  /**
   * `settings.playoff_type` as-received, UNINTERPRETED (declared wiki silence
   * 4 above). Present so the surface can say "a non-default playoff structure
   * is configured" without this module pretending to know which one.
   */
  playoffTypeRaw: number | null
  /** `settings.playoff_round_type` as-received, uninterpreted. Same reason. */
  playoffRoundTypeRaw: number | null
  /** `settings.divisions` when present — detected, never acted on. */
  divisionCount: number | null
  /**
   * True when the league configures more than one division. The surface
   * discloses that division rules are NOT applied to seeding; this module
   * never reorders seeds because of it (Nick's Clarify — Sleeper doesn't
   * document how it seeds divisions, so implementing it would be invention).
   */
  hasDivisions: boolean
  /**
   * First-round byes, INFERRED arithmetically as `nextPowerOfTwo(N) − N`.
   *
   * This is not a stored field. `sleeper-api/playoff-bracket-endpoint` records
   * that "a bye is not a distinct, explicitly labeled concept anywhere in the
   * schema" — it is inferred by comparing seed count against round-1 match
   * count. This platform does not ingest bracket resources at all (there is no
   * bracket table), so the comparison is done against the structural bracket
   * size instead. Disclosed as inferred wherever it is displayed; null when
   * the field size isn't known.
   */
  firstRoundByes: number | null
  /** Fixed, and stated in the type so a reader never has to guess the basis. */
  seedingBasis: 'recomputed_record'
}

/** Status vocabulary — exactly the four the build file names, no fifth. */
export type PlayoffStatus =
  | 'clinched'
  | 'controls_own_path'
  | 'needs_help'
  | 'eliminated'
  /** The rules or the schedule aren't known well enough to say. Not a verdict. */
  | 'undetermined'

export type PlayoffTeam = {
  nativeRosterId: number
  teamName: string | null
  ownerDisplayName: string | null
  /** 1-based seed: win% desc → points-for desc → roster id asc. */
  seed: number
  wins: number
  losses: number
  ties: number
  /** wins + ties/2 — the figure every bound below is expressed in. */
  winEquivalent: number
  pointsFor: number
  /** Head-to-head games actually played and scored. */
  gamesPlayed: number
  /** Scheduled, not-yet-scored games remaining in the regular season. */
  gamesRemaining: number
  /** Best possible finish: current win-equivalent + every remaining game won. */
  maxWinEquivalent: number
  status: PlayoffStatus
  /**
   * Wins still needed to mathematically guarantee a berth, regardless of other
   * results. Null when already clinched, eliminated, or undeterminable. Capped
   * at `gamesRemaining` — a magic number larger than that is elimination.
   */
  magicNumber: number | null
  /** The `standings` snapshot's wins, for cross-checking the recomputed record. */
  standingsWins: number | null
  /** True when snapshot and recomputed record disagree — surfaced, not resolved. */
  disagreesWithStandings: boolean
}

export type PlayoffPictureData = {
  rules: PlayoffRules
  /** Seeded, best first. Includes teams below the cut — this is the full table. */
  teams: PlayoffTeam[]
  /** Regular-season weeks with at least one scored roster. */
  weeksCounted: number
  /** Counted weeks carrying any non-final score — the picture is provisional. */
  nonFinalWeeksCounted: number
  /** Scheduled unscored regular-season roster-weeks found, across all teams. */
  gamesRemainingTotal: number
  /**
   * True when the field size is known but no remaining schedule is visible.
   * Either the regular season is over, or future weeks haven't synced — this
   * module cannot tell those apart, so it reports the fact and the surface says
   * so instead of presenting a settled picture that might just be unsynced.
   */
  scheduleExhausted: boolean
  /**
   * The field size exceeded the number of teams and was clamped. A league
   * configured this way would otherwise show everyone as clinched.
   */
  fieldSizeClamped: boolean
  /** True when any team's recomputed record differs from its standings row. */
  hasStandingsDisagreement: boolean
}

/** A matchup row reduced to what the picture needs — scored or not. */
export type PlayoffScheduleRow = {
  nativeRosterId: number
  /** Null is a bye/no-opponent week (wiki: sleeper-api/matchup-endpoint). */
  nativeMatchupId: number | null
  week: number
  /** Null means scheduled but not yet scored — a remaining game. */
  points: number | null
  isFinal: boolean
}

/**
 * Resolve one league's playoff rules from its stored raw settings.
 *
 * Platform-agnostic by construction: nothing branches on Sleeper vs. ESPN. An
 * ESPN league whose settings don't carry these keys resolves to nulls and the
 * picture reports itself undeterminable, exactly as an unsynced Sleeper league
 * does today — no platform special-casing, no invented equivalence.
 */
export async function getPlayoffRules(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<PlayoffRules> {
  const { data: config, error } = await db
    .from('league_config')
    .select('roster_settings_raw')
    .eq('league_id', leagueId)
    .maybeSingle()
  if (error) {
    throw new Error(`playoff-rules config query failed: ${error.message}`)
  }
  return parsePlayoffRules(config?.roster_settings_raw)
}

/**
 * Parse a `roster_settings_raw` payload into the league's playoff rules.
 *
 * Shape-tolerant and never throws, matching `parseRosterSlotLayout` and
 * `parsePlayoffWeekStart`: the wiki's standing instruction for this object is
 * to treat `settings` as an open map and tolerate unrecognized keys rather than
 * assume a fixed schema. Anything that isn't a usable value becomes null.
 *
 * Booleans are not read here at all, which sidesteps the documented 0/1-instead
 * -of-true/false hazard on this object — every field this module reads is
 * genuinely numeric.
 */
export function parsePlayoffRules(raw: unknown): PlayoffRules {
  const record = asRecord(raw)
  const settings = record === null ? null : asRecord(record.settings)
  const playoffTeams = asPositiveInteger(settings?.playoff_teams, 2)
  const divisionCount = asPositiveInteger(settings?.divisions, 1)

  return {
    playoffTeams,
    playoffWeekStart: parsePlayoffWeekStart(raw),
    playoffTypeRaw: asInteger(settings?.playoff_type),
    playoffRoundTypeRaw: asInteger(settings?.playoff_round_type),
    divisionCount,
    hasDivisions: divisionCount !== null && divisionCount > 1,
    firstRoundByes:
      playoffTeams === null ? null : nextPowerOfTwo(playoffTeams) - playoffTeams,
    seedingBasis: 'recomputed_record',
  }
}

/**
 * Assemble one league's playoff picture.
 *
 * An empty schedule is the honest pre-season / unsynced state, not an error —
 * the section renders its empty copy rather than a failure notice. Like
 * `getLuck` and `getScoreTrends`, this is not a not-found-resolving service:
 * the page resolves identity through `getLeagueContext` first, so a genuine
 * database fault throws and is caught by `settleQuery` at the page.
 */
export async function getPlayoffPicture(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<PlayoffPictureData> {
  const { data: matchupRows, error: matchupsError } = await db
    .from('matchups')
    .select('native_roster_id, native_matchup_id, week, effective_points, is_final')
    .eq('league_id', leagueId)
  if (matchupsError) {
    throw new Error(`playoff-picture matchups query failed: ${matchupsError.message}`)
  }

  const { data: standingsRows, error: standingsError } = await db
    .from('standings')
    .select('native_roster_id, wins')
    .eq('league_id', leagueId)
  if (standingsError) {
    throw new Error(`playoff-picture standings query failed: ${standingsError.message}`)
  }

  const rules = await getPlayoffRules(db, leagueId)
  const rosterNames = await fetchRosterNames(db, leagueId)

  // Unscored rows are kept here, unlike every other Wave 5 service — they ARE
  // the remaining schedule. A row with a matchup id and no points is a game
  // that is going to be played.
  const rows: PlayoffScheduleRow[] = matchupRows.map((row) => ({
    nativeRosterId: row.native_roster_id,
    nativeMatchupId: row.native_matchup_id,
    week: row.week,
    points: row.effective_points === null ? null : Number(row.effective_points),
    isFinal: row.is_final,
  }))

  const standingsWins = new Map(
    standingsRows.map((row) => [row.native_roster_id, row.wins])
  )

  return computePlayoffPicture(rows, rosterNames, rules, standingsWins)
}

/**
 * The pure playoff-picture calculation — no I/O.
 *
 * DETERMINISTIC BOUNDING, NOT SIMULATION. This platform's playoff mechanism is
 * a deterministic clinch/eliminate question, and the build file explicitly bars
 * any probability-shaped output, so nothing here samples, weights, or estimates
 * anything. Every status follows from two bounds that are facts about the
 * schedule, not guesses about it:
 *
 *   floor(team)   = its current win-equivalent (it can lose out)
 *   ceiling(team) = current win-equivalent + all its remaining games
 *
 * With a field size of N, and counting how many OTHER teams could still finish
 * at or above a given team:
 *
 *   CLINCHED   — fewer than N other teams have a ceiling that REACHES this
 *                team's floor. Nobody who could pass it can fill the field.
 *   ELIMINATED — at least N other teams have a floor STRICTLY ABOVE this
 *                team's ceiling. Even winning out, the field is full above it.
 *   otherwise  — still alive; CONTROLS OWN PATH when winning out is by itself
 *                sufficient (fewer than N others could reach that ceiling),
 *                NEEDS HELP when winning out can still leave it short.
 *
 * NOTE THE ASYMMETRY IN THE TIE COMPARISON — it is the crux of the whole
 * module, not an inconsistency (Nick's Clarify: strict, true under any
 * tiebreaker). A tie in win-equivalent counts AGAINST the team in the clinch
 * test (a level rival could pass it on a tiebreaker) and FOR the team in the
 * elimination test (it could win that same tiebreaker). Both verdicts are
 * therefore unfalsifiable regardless of how points-for moves. Using `>=` in
 * both directions would print "eliminated" on a team merely tied for the last
 * spot, which is a status that is simply false. A status this module prints is
 * one that cannot be wrong, which is the whole point of not shipping a
 * probability bar.
 *
 * A team with no games played AND none remaining is UNDETERMINED rather than
 * given a verdict: that is the preseason/unsynced shape, and there is no
 * evidence to reason from. Real information, not a default, is what turns a
 * team's status into a claim.
 *
 * The MAGIC NUMBER is the smallest number of additional wins that makes the
 * clinch condition true against every other team's ceiling. It is searched, not
 * formulated, precisely because the field size and the remaining schedule are
 * both arbitrary — a closed-form magic number would encode an assumed league
 * shape, which is the thing this whole wave is built not to do.
 */
export function computePlayoffPicture(
  rows: readonly PlayoffScheduleRow[],
  rosterNames: ReadonlyMap<
    number,
    { teamName: string | null; ownerDisplayName: string | null }
  >,
  rules: PlayoffRules,
  standingsWins: ReadonlyMap<number, number> = new Map()
): PlayoffPictureData {
  const { playoffWeekStart } = rules
  const regularSeason = rows.filter(
    (row) => playoffWeekStart === null || row.week < playoffWeekStart
  )

  const rosterIds = [
    ...new Set([
      ...rosterNames.keys(),
      ...regularSeason.map((row) => row.nativeRosterId),
    ]),
  ].sort((a, b) => a - b)

  const byWeek = new Map<number, PlayoffScheduleRow[]>()
  for (const row of regularSeason) {
    const week = byWeek.get(row.week)
    if (week === undefined) byWeek.set(row.week, [row])
    else week.push(row)
  }

  let weeksCounted = 0
  let nonFinalWeeksCounted = 0
  for (const scores of byWeek.values()) {
    const scored = scores.filter((row) => row.points !== null)
    if (scored.length === 0) continue
    weeksCounted += 1
    if (scored.some((row) => !row.isFinal)) nonFinalWeeksCounted += 1
  }

  type Tally = {
    wins: number
    losses: number
    ties: number
    pointsFor: number
    gamesPlayed: number
    gamesRemaining: number
  }
  const tallies = new Map<number, Tally>(
    rosterIds.map((rosterId) => [
      rosterId,
      { wins: 0, losses: 0, ties: 0, pointsFor: 0, gamesPlayed: 0, gamesRemaining: 0 },
    ])
  )

  for (const row of regularSeason) {
    const tally = tallies.get(row.nativeRosterId)
    if (tally === undefined) continue
    const opponent = findOpponent(row, byWeek.get(row.week) ?? [])
    if (opponent === null) continue

    if (row.points === null || opponent.points === null) {
      // Scheduled, at least one side unscored: a game still to be played.
      // Counted for the team whose own row is unscored only, so a half-scored
      // week (one side in, one side pending) isn't double-counted as remaining
      // for a team that already has its result.
      if (row.points === null) tally.gamesRemaining += 1
      continue
    }

    tally.gamesPlayed += 1
    tally.pointsFor += row.points
    if (row.points > opponent.points) tally.wins += 1
    else if (row.points < opponent.points) tally.losses += 1
    else tally.ties += 1
  }

  const emptyTally: Tally = {
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    gamesPlayed: 0,
    gamesRemaining: 0,
  }
  const seeded = rosterIds
    .map((rosterId) => {
      const tally = tallies.get(rosterId) ?? emptyTally
      const winEquivalent = tally.wins + tally.ties / 2
      return {
        nativeRosterId: rosterId,
        teamName: rosterNames.get(rosterId)?.teamName ?? null,
        ownerDisplayName: rosterNames.get(rosterId)?.ownerDisplayName ?? null,
        wins: tally.wins,
        losses: tally.losses,
        ties: tally.ties,
        winEquivalent,
        pointsFor: round2(tally.pointsFor),
        gamesPlayed: tally.gamesPlayed,
        gamesRemaining: tally.gamesRemaining,
        maxWinEquivalent: winEquivalent + tally.gamesRemaining,
      }
    })
    // Win PERCENTAGE, not win count — an odd schedule or an unsynced week can
    // leave teams with different games played, and ordering on raw wins would
    // rank a team that has simply played more above one that has lost less.
    .sort((a, b) => {
      const aPct = a.gamesPlayed === 0 ? 0 : a.winEquivalent / a.gamesPlayed
      const bPct = b.gamesPlayed === 0 ? 0 : b.winEquivalent / b.gamesPlayed
      if (aPct !== bPct) return bPct - aPct
      if (a.pointsFor !== b.pointsFor) return b.pointsFor - a.pointsFor
      return a.nativeRosterId - b.nativeRosterId
    })

  // Clamp rather than trust: a field size at or above the team count would make
  // every team trivially clinched. Reported, never silently applied.
  const rawField = rules.playoffTeams
  const fieldSizeClamped = rawField !== null && rawField > seeded.length
  const fieldSize =
    rawField === null ? null : Math.max(1, Math.min(rawField, seeded.length))

  const teams: PlayoffTeam[] = seeded.map((team, index) => {
    const others = seeded.filter((other) => other.nativeRosterId !== team.nativeRosterId)
    const snapshotWins = standingsWins.get(team.nativeRosterId) ?? null
    const status = resolveStatus(team, others, fieldSize)

    return {
      ...team,
      seed: index + 1,
      status,
      magicNumber: resolveMagicNumber(team, others, fieldSize, status),
      standingsWins: snapshotWins,
      disagreesWithStandings: snapshotWins !== null && snapshotWins !== team.wins,
    }
  })

  const gamesRemainingTotal = seeded.reduce(
    (total, team) => total + team.gamesRemaining,
    0
  )

  return {
    rules,
    teams,
    weeksCounted,
    nonFinalWeeksCounted,
    gamesRemainingTotal,
    scheduleExhausted: fieldSize !== null && gamesRemainingTotal === 0,
    fieldSizeClamped,
    hasStandingsDisagreement: teams.some((team) => team.disagreesWithStandings),
  }
}

/** The bounds the status and magic-number logic both reason over. */
type Bounded = {
  winEquivalent: number
  maxWinEquivalent: number
  gamesPlayed: number
  gamesRemaining: number
}

/**
 * How many other teams could still finish AT OR ABOVE `threshold` — a tie
 * counts as "could pass". The generous-to-the-rival reading that makes a
 * clinch safe under any tiebreaker.
 */
const couldReach = (others: readonly Bounded[], threshold: number): number =>
  others.filter((other) => other.maxWinEquivalent >= threshold).length

/**
 * How many other teams are already guaranteed to finish STRICTLY ABOVE
 * `threshold` — a tie does NOT count, since the team could win that
 * tiebreaker. The generous-to-the-team reading that makes an elimination
 * unfalsifiable.
 */
const guaranteedAbove = (others: readonly Bounded[], threshold: number): number =>
  others.filter((other) => other.winEquivalent > threshold).length

function resolveStatus(
  team: Bounded,
  others: readonly Bounded[],
  fieldSize: number | null
): PlayoffStatus {
  // No known field size means no honest verdict is available. This is the
  // single most important branch in the module: it is what stops an unsynced
  // league from being told it has clinched anything.
  if (fieldSize === null) return 'undetermined'
  // Nothing played, nothing scheduled: no evidence, so no claim.
  if (team.gamesPlayed === 0 && team.gamesRemaining === 0) return 'undetermined'

  if (couldReach(others, team.winEquivalent) < fieldSize) return 'clinched'
  if (guaranteedAbove(others, team.maxWinEquivalent) >= fieldSize) return 'eliminated'
  return couldReach(others, team.maxWinEquivalent) < fieldSize
    ? 'controls_own_path'
    : 'needs_help'
}

/**
 * The fewest additional wins that would guarantee a berth outright.
 *
 * Searched upward over the games actually remaining, using the same clinch
 * predicate `resolveStatus` uses — and gated on that function's own verdict, so
 * the number and the badge can never disagree. Null when already clinched
 * (nothing to add), eliminated or undetermined (nothing would help), or when no
 * achievable number of wins is sufficient on its own — that last case IS "needs
 * help", and printing a magic number there would promise something the team
 * cannot deliver by winning.
 *
 * Counts down to a BERTH only, never to a seed or a first-round bye (Nick's
 * Clarify): the bye count is inferred arithmetically rather than read from an
 * ingested bracket, and a second number resting on that weaker footing would
 * read as equally authoritative next to this one.
 */
function resolveMagicNumber(
  team: Bounded,
  others: readonly Bounded[],
  fieldSize: number | null,
  status: PlayoffStatus
): number | null {
  if (fieldSize === null) return null
  if (status !== 'controls_own_path' && status !== 'needs_help') return null

  for (let wins = 1; wins <= team.gamesRemaining; wins += 1) {
    if (couldReach(others, team.winEquivalent + wins) < fieldSize) return wins
  }
  return null
}

/**
 * The head-to-head opponent for a roster-week, or null when there isn't one.
 *
 * Identical posture to `luck.ts`: a null matchup id is a bye, and a group that
 * isn't exactly two rosters is an anomaly treated as no game rather than an
 * invented opponent — so the two surfaces can never disagree about who played
 * whom. Unlike `luck.ts`, unscored rows participate, since an unscored pair is
 * exactly what a remaining game looks like.
 */
function findOpponent(
  own: PlayoffScheduleRow,
  week: readonly PlayoffScheduleRow[]
): PlayoffScheduleRow | null {
  if (own.nativeMatchupId === null) return null
  const group = week.filter((row) => row.nativeMatchupId === own.nativeMatchupId)
  if (group.length !== 2) return null
  return group.find((row) => row.nativeRosterId !== own.nativeRosterId) ?? null
}

/** Bracket size for N seeds — the basis for the inferred first-round byes. */
function nextPowerOfTwo(value: number): number {
  let size = 1
  while (size < value) size *= 2
  return size
}

// Raw settings is JSONB and an open map (wiki: sleeper-api/league-endpoint) —
// parsed defensively throughout; a malformed value degrades to null, never a
// throw and never an invented default.

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function asPositiveInteger(value: unknown, minimum: number): number | null {
  const parsed = asInteger(value)
  return parsed !== null && parsed >= minimum ? parsed : null
}

const round2 = (value: number): number => Math.round(value * 100) / 100
