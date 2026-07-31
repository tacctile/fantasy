/**
 * Positional scoring aggregation (Wave 5 — Positional breakdowns, item 1).
 * Server-only.
 *
 * The one place "how much did this team get from each position" is defined.
 * Every visualization in the Positional section reads this module's output; none
 * of them re-derives a total, a rank, a share, or a week range of their own.
 *
 * WHAT COUNTS: STARTED rows only — `player_scores.was_starter` (Nick's Clarify,
 * 2026-07-31). Positional strength here means what a team actually STARTED, not
 * what it owned: bench points are unrealized, and counting them would flatter a
 * deep bench while diverging from the `matchups.effective_points` lineup total
 * every other Wave 5 surface shows. This is also the one place in the wave that
 * legitimately reads `player_scores` rather than the matchup total — the
 * question is per-position composition, which the matchup row cannot answer.
 *
 * SLOT ATTRIBUTION IS INFERRED, NOT OBSERVED — the single most important caveat
 * in this module, and one the surface must state rather than bury. `player_scores`
 * records THAT a player started, never WHICH slot he filled: no per-week lineup
 * slot exists anywhere in the schema (`roster_players.slot` is a current
 * starter/bench/reserve/taxi snapshot, not a per-week positional assignment).
 * So each team-week is reconstructed against the league's own slot layout
 * (Nick's Clarify, 2026-07-31): dedicated slots are filled first, highest scorer
 * per position, and a started player at a flex-eligible position with no
 * dedicated slot left lands in the flex bucket. This honours the item's
 * "flex/superflex attributed via `league_config` roster slots — no hardcoded
 * standard roster shape" literally: every slot count and label comes from the
 * league's parsed layout, and a league with no layout degrades to canonical
 * position attribution with `layoutResolved: false` rather than to an invented
 * standard roster.
 *
 * WIKI SILENCE, DECLARED AT DECISION TIME (2026-07-31): which POSITIONS each
 * flex label admits is not specified anywhere in the wiki.
 * `sleeper-api/league-endpoint` names the labels that appear in
 * `roster_positions` (`FLEX`, `SUPER_FLEX`, `REC_FLEX`, …) and explicitly
 * records that the label set is not exhaustively documented;
 * `league-mechanics/flex-spot-configuration` covers which position TENDS TO WIN
 * a flex slot (RB/WR-dominant, TE elite-only, QB near-universal in superflex)
 * but that is predictive draft-value guidance, not an eligibility table, and it
 * explicitly declines to adopt numeric allocations. A retrospective attribution
 * of an already-played week needs eligibility, not tendency. `FLEX_ELIGIBILITY`
 * below therefore encodes the corroborated conventional meanings, and — the
 * part that matters — an UNRECOGNISED flex label is treated as open to every
 * position rather than dropping those points on the floor. Nothing is silently
 * invented: unknown labels degrade toward inclusion, and the count of inferred
 * assignments is reported so the surface can disclose it.
 *
 * WEEK SCOPE: regular season only, through the SAME `parsePlayoffWeekStart`
 * power rankings, score trends, and the luck tracker already share (exported
 * from `dashboard.ts`, never copied) — so this section's week count can never
 * silently disagree with theirs on the same league. When the boundary is absent
 * or unparseable every scored week counts, exactly as those surfaces degrade.
 *
 * Season scoping is structural: a `leagues` row is already per-season, so a
 * league-scoped read is inherently that league-season's data.
 *
 * NOT a not-found-resolving service, matching `score-trends.ts` and `luck.ts`:
 * the page resolves identity through `getLeagueContext` first. A genuine
 * database fault throws and is caught by `settleQuery` at the page.
 *
 * Data-exposure boundary, same discipline as `dashboard.ts` and
 * `league-context.ts`: explicit columns only, never `share_token`, `owner_id`,
 * or a provider-native league ID. Nothing here touches `draft_state`.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import { fetchRosterNames, parsePlayoffWeekStart } from './dashboard'
import type { RosterSlotLayout } from './league-context'

/** The bucket key for scores whose player position could not be resolved. */
export const UNMAPPED_BUCKET = 'UNMAPPED'

/**
 * Conventional flex eligibility by label. See the module note above: this
 * encodes corroborated convention, NOT a wiki-specified table, because the wiki
 * is genuinely silent on flex eligibility. An unrecognised `*FLEX*` label is
 * deliberately absent from this map — `flexEligibility` returns null for it,
 * meaning "open to any position", so an unknown league shape never loses points.
 */
const FLEX_ELIGIBILITY: Record<string, readonly string[]> = {
  FLEX: ['RB', 'WR', 'TE'],
  WRRB_FLEX: ['RB', 'WR'],
  REC_FLEX: ['WR', 'TE'],
  SUPER_FLEX: ['QB', 'RB', 'WR', 'TE'],
}

/**
 * The positions a flex label admits, or null for "any position" — the honest
 * degradation for a label whose eligibility nobody has documented.
 */
export function flexEligibility(label: string): readonly string[] | null {
  return FLEX_ELIGIBILITY[label.toUpperCase()] ?? null
}

/** One started player-week, reduced to what the aggregation needs. */
export type PositionalScoreRow = {
  nativeRosterId: number
  week: number
  sleeperPlayerId: string
  points: number
  /** Canonical catalog position — 'DEF' for team defenses (wiki:
   *  sleeper-api/dst-and-free-agents). Null when the player is unmapped. */
  position: string | null
  isFinal: boolean
}

/** What kind of slot a bucket represents — drives colour and grouping. */
export type BucketKind = 'dedicated' | 'flex' | 'unmapped'

/** A column of the breakdown: one lineup slot family, league-wide. */
export type PositionalBucket = {
  /** Slot label for dedicated/flex buckets ('RB', 'SUPER_FLEX'), or UNMAPPED. */
  key: string
  kind: BucketKind
  /** Starting slots of this kind per team, from the league's own layout. */
  slotCount: number
  /** Mean of every team's total in this bucket — the bars' anchor line. */
  leagueAverage: number
  leagueTotal: number
  /** Positions this flex label admits; null = any (or not a flex bucket). */
  eligiblePositions: readonly string[] | null
}

/** One team's reading in one bucket. */
export type TeamBucketTotal = {
  key: string
  points: number
  /** Started player-weeks attributed here — the sample behind `points`. */
  starts: number
  /** Share of this team's own started points, 0–100. */
  sharePct: number
  /** points − bucket league average; the diverging bar's value. */
  deltaVsAverage: number
  /** 1-based, points desc → native_roster_id asc (stable, documented). */
  rank: number
  /** 0–100, 100 = best in league. Null in a one-team league. */
  percentile: number | null
}

export type PositionalTeam = {
  nativeRosterId: number
  teamName: string | null
  ownerDisplayName: string | null
  /** Categorical colour slot by native_roster_id ascending — a STABLE entity
   *  key, never rank, so re-sorting the page never repaints a team. */
  seriesIndex: number
  /** One entry per bucket, aligned index-for-index with `buckets`. */
  buckets: TeamBucketTotal[]
  /** Total started points across every bucket, unmapped included. */
  totalPoints: number
  totalStarts: number
}

export type PositionalBreakdownData = {
  /** Counted regular-season weeks with at least one started score, ascending. */
  weeks: number[]
  /** Column order: dedicated slots in layout order, then flex, then unmapped. */
  buckets: PositionalBucket[]
  /** Ordered by total started points desc → native_roster_id asc. */
  teams: PositionalTeam[]
  weeksCounted: number
  /** Counted weeks carrying any non-final score — surfaced as provisional. */
  nonFinalWeeksCounted: number
  /**
   * Under ~6 counted weeks a positional reading is sample-noise dominated —
   * the same floor score trends and luck already apply (wiki:
   * in-season-management/points-for-against-luck-analysis, and
   * consistency-score-boom-bust-rate on minimum sample before a per-position
   * split means anything).
   */
  lowConfidence: boolean
  /** Null when unparseable — the whole scored season was counted. */
  playoffWeekStart: number | null
  /** False when the league's slot layout didn't parse: canonical-position
   *  attribution only, no flex buckets. The surface says so. */
  layoutResolved: boolean
  /** Started scores whose player position is unknown — never dropped. */
  unmappedStarts: number
  unmappedPoints: number
  /** Distinct unmapped player ids — the count worth naming to a reader. */
  unmappedPlayerCount: number
  /** Starts assigned to a flex bucket. Inferred, not observed; disclosed. */
  flexAttributedStarts: number
  /** Starts that fit no slot at all (more starters than the layout allows) and
   *  fell back to canonical position. A layout/data mismatch worth surfacing. */
  overflowStarts: number
}

/**
 * Assemble one league's regular-season positional breakdown.
 *
 * An empty `weeks` array is the honest pre-season / unsynced state, not an
 * error — the section renders its empty copy rather than a failure notice.
 */
export async function getPositionalBreakdown(
  db: SupabaseClient<Database>,
  leagueId: string,
  slotLayout: RosterSlotLayout | null
): Promise<PositionalBreakdownData> {
  // The catalog position rides along the score row through the existing
  // player_scores → players foreign key, so this stays one round trip and the
  // Sleeper-anchored player identity is never re-joined by name.
  const { data: scoreRows, error: scoresError } = await db
    .from('player_scores')
    .select('native_roster_id, week, sleeper_player_id, points, is_final, players(position)')
    .eq('league_id', leagueId)
    .eq('was_starter', true)
  if (scoresError) {
    throw new Error(`positional scores query failed: ${scoresError.message}`)
  }

  const { data: config, error: configError } = await db
    .from('league_config')
    .select('roster_settings_raw')
    .eq('league_id', leagueId)
    .maybeSingle()
  if (configError) {
    throw new Error(`positional config query failed: ${configError.message}`)
  }

  const rosterNames = await fetchRosterNames(db, leagueId)

  const rows: PositionalScoreRow[] = []
  for (const row of scoreRows) {
    if (row.points === null) continue
    rows.push({
      nativeRosterId: row.native_roster_id,
      week: row.week,
      sleeperPlayerId: row.sleeper_player_id,
      points: Number(row.points),
      position: normalizePosition(embeddedPosition(row.players)),
      isFinal: row.is_final,
    })
  }

  return computePositionalBreakdown(
    rows,
    rosterNames,
    slotLayout,
    parsePlayoffWeekStart(config?.roster_settings_raw)
  )
}

/**
 * The pure aggregation — no I/O, so every edge case the section has to survive
 * is unit-testable without a database: a bye week, an unmapped player, a league
 * whose layout never parsed, a team that started more players than its layout
 * allows, a season that never started.
 */
export function computePositionalBreakdown(
  rows: readonly PositionalScoreRow[],
  rosterNames: ReadonlyMap<
    number,
    { teamName: string | null; ownerDisplayName: string | null }
  >,
  slotLayout: RosterSlotLayout | null,
  playoffWeekStart: number | null
): PositionalBreakdownData {
  const counted = rows.filter(
    (row) =>
      Number.isFinite(row.points) &&
      (playoffWeekStart === null || row.week < playoffWeekStart)
  )

  const weeks = [...new Set(counted.map((row) => row.week))].sort((a, b) => a - b)

  // Roster ids come from the roster snapshot AND the score rows, mirroring
  // score-trends and luck: a team whose roster row hasn't synced still belongs
  // in the table, and so does a team with no starts yet (as an honest zero row).
  const rosterIds = [
    ...new Set([...rosterNames.keys(), ...counted.map((row) => row.nativeRosterId)]),
  ].sort((a, b) => a - b)
  const seriesIndexById = new Map(rosterIds.map((id, index) => [id, index]))

  const dedicatedLabels = Object.keys(slotLayout?.dedicated ?? {})
  const flexLabels = Object.keys(slotLayout?.flex ?? {})

  // Attribute every team-week independently, then fold the per-bucket totals up.
  const totals = new Map<string, { points: number; starts: number }>()
  const bump = (rosterId: number, key: string, points: number) => {
    const id = `${rosterId} ${key}`
    const entry = totals.get(id)
    if (entry === undefined) totals.set(id, { points, starts: 1 })
    else {
      entry.points += points
      entry.starts += 1
    }
  }

  const byTeamWeek = new Map<string, PositionalScoreRow[]>()
  for (const row of counted) {
    const id = `${row.nativeRosterId} ${row.week}`
    const bucket = byTeamWeek.get(id)
    if (bucket === undefined) byTeamWeek.set(id, [row])
    else bucket.push(row)
  }

  const usedKeys = new Set<string>()
  let unmappedStarts = 0
  let unmappedPoints = 0
  let flexAttributedStarts = 0
  let overflowStarts = 0
  const unmappedPlayers = new Set<string>()

  for (const [id, lineup] of byTeamWeek) {
    const rosterId = Number(id.split(' ')[0])
    const assignment = attributeLineup(lineup, dedicatedLabels, flexLabels, slotLayout)
    for (const { row, key, kind } of assignment) {
      bump(rosterId, key, row.points)
      usedKeys.add(key)
      if (kind === 'flex') flexAttributedStarts += 1
      if (kind === 'overflow') overflowStarts += 1
      if (key === UNMAPPED_BUCKET) {
        unmappedStarts += 1
        unmappedPoints += row.points
        unmappedPlayers.add(row.sleeperPlayerId)
      }
    }
  }

  // Column set: every layout slot (so an unused slot still shows as a real zero
  // rather than vanishing), plus any position that actually scored outside the
  // layout, plus unmapped when it occurred.
  const bucketKeys: string[] = []
  const pushKey = (key: string) => {
    if (!bucketKeys.includes(key)) bucketKeys.push(key)
  }
  for (const label of dedicatedLabels) pushKey(label)
  for (const label of flexLabels) pushKey(label)
  for (const key of [...usedKeys].sort()) {
    if (key !== UNMAPPED_BUCKET) pushKey(key)
  }
  if (usedKeys.has(UNMAPPED_BUCKET)) pushKey(UNMAPPED_BUCKET)

  const bucketPoints = (rosterId: number, key: string): number =>
    round2(totals.get(`${rosterId} ${key}`)?.points ?? 0)
  const bucketStarts = (rosterId: number, key: string): number =>
    totals.get(`${rosterId} ${key}`)?.starts ?? 0

  const buckets: PositionalBucket[] = bucketKeys.map((key) => {
    const values = rosterIds.map((rosterId) => bucketPoints(rosterId, key))
    const total = values.reduce((sum, value) => sum + value, 0)
    const kind: BucketKind =
      key === UNMAPPED_BUCKET
        ? 'unmapped'
        : flexLabels.includes(key)
          ? 'flex'
          : 'dedicated'
    return {
      key,
      kind,
      slotCount:
        slotLayout === null
          ? 0
          : (slotLayout.dedicated[key] ?? slotLayout.flex[key] ?? 0),
      leagueAverage: values.length === 0 ? 0 : round2(total / values.length),
      leagueTotal: round2(total),
      eligiblePositions: kind === 'flex' ? flexEligibility(key) : null,
    }
  })

  // Ranks are computed per bucket across the whole league before team rows are
  // assembled, so a team's rank never depends on the order teams are listed in.
  const rankByBucket = new Map<string, Map<number, number>>()
  for (const bucket of buckets) {
    const ordered = [...rosterIds].sort((a, b) => {
      const delta = bucketPoints(b, bucket.key) - bucketPoints(a, bucket.key)
      if (delta !== 0) return delta
      return a - b
    })
    rankByBucket.set(
      bucket.key,
      new Map(ordered.map((rosterId, index) => [rosterId, index + 1]))
    )
  }

  const teamCount = rosterIds.length
  const unordered: PositionalTeam[] = rosterIds.map((rosterId) => {
    const names = rosterNames.get(rosterId)
    const totalPoints = round2(
      buckets.reduce((sum, bucket) => sum + bucketPoints(rosterId, bucket.key), 0)
    )
    const totalStarts = buckets.reduce(
      (sum, bucket) => sum + bucketStarts(rosterId, bucket.key),
      0
    )

    return {
      nativeRosterId: rosterId,
      teamName: names?.teamName ?? null,
      ownerDisplayName: names?.ownerDisplayName ?? null,
      seriesIndex: seriesIndexById.get(rosterId) ?? 0,
      buckets: buckets.map((bucket) => {
        const points = bucketPoints(rosterId, bucket.key)
        const rank = rankByBucket.get(bucket.key)?.get(rosterId) ?? 1
        return {
          key: bucket.key,
          points,
          starts: bucketStarts(rosterId, bucket.key),
          sharePct: totalPoints === 0 ? 0 : round2((points / totalPoints) * 100),
          deltaVsAverage: round2(points - bucket.leagueAverage),
          rank,
          percentile:
            teamCount < 2
              ? null
              : round2(((teamCount - rank) / (teamCount - 1)) * 100),
        }
      }),
      totalPoints,
      totalStarts,
    }
  })

  const teams = [...unordered].sort((a, b) => {
    if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints
    return a.nativeRosterId - b.nativeRosterId
  })

  let nonFinalWeeksCounted = 0
  for (const week of weeks) {
    if (counted.some((row) => row.week === week && !row.isFinal)) {
      nonFinalWeeksCounted += 1
    }
  }

  return {
    weeks,
    buckets,
    teams,
    weeksCounted: weeks.length,
    nonFinalWeeksCounted,
    lowConfidence: weeks.length < LOW_CONFIDENCE_WEEKS,
    playoffWeekStart,
    layoutResolved: slotLayout !== null,
    unmappedStarts,
    unmappedPoints: round2(unmappedPoints),
    unmappedPlayerCount: unmappedPlayers.size,
    flexAttributedStarts,
    overflowStarts,
  }
}

/** Where one started player-week landed, and by which rule. */
type Assignment = {
  row: PositionalScoreRow
  key: string
  kind: 'dedicated' | 'flex' | 'overflow' | 'unmapped'
}

/**
 * Reconstruct one team-week's lineup against the league's slot layout.
 *
 * Dedicated slots fill first, highest scorer per position, because a team's
 * best RB occupies an RB slot before its third RB reaches the flex — the
 * reading any manager would give the same lineup. Whatever remains competes for
 * the flex slots in layout order. Anything still unplaced is overflow: the
 * layout says it shouldn't exist, so it falls back to canonical position and is
 * COUNTED, never dropped, because a silent discard here would make a team's
 * totals quietly disagree with its matchup score.
 *
 * With no layout at all, every start is attributed to its canonical position —
 * honest, flexless, and flagged upstream by `layoutResolved: false`.
 */
function attributeLineup(
  lineup: readonly PositionalScoreRow[],
  dedicatedLabels: readonly string[],
  flexLabels: readonly string[],
  slotLayout: RosterSlotLayout | null
): Assignment[] {
  const assignments: Assignment[] = []
  const pending: PositionalScoreRow[] = []

  for (const row of lineup) {
    if (row.position === null) {
      assignments.push({ row, key: UNMAPPED_BUCKET, kind: 'unmapped' })
    } else {
      pending.push(row)
    }
  }

  // Highest first, so every greedy take below is the best remaining candidate.
  pending.sort((a, b) => b.points - a.points || a.sleeperPlayerId.localeCompare(b.sleeperPlayerId))

  if (slotLayout === null) {
    for (const row of pending) {
      assignments.push({ row, key: row.position as string, kind: 'dedicated' })
    }
    return assignments
  }

  const placed = new Set<PositionalScoreRow>()

  for (const label of dedicatedLabels) {
    let remaining = slotLayout.dedicated[label] ?? 0
    for (const row of pending) {
      if (remaining === 0) break
      if (placed.has(row) || row.position !== label) continue
      assignments.push({ row, key: label, kind: 'dedicated' })
      placed.add(row)
      remaining -= 1
    }
  }

  for (const label of flexLabels) {
    let remaining = slotLayout.flex[label] ?? 0
    const eligible = flexEligibility(label)
    for (const row of pending) {
      if (remaining === 0) break
      if (placed.has(row)) continue
      // A null eligibility list means "any position" — the declared-silence
      // degradation for an undocumented flex label.
      if (eligible !== null && !eligible.includes(row.position as string)) continue
      assignments.push({ row, key: label, kind: 'flex' })
      placed.add(row)
      remaining -= 1
    }
  }

  for (const row of pending) {
    if (placed.has(row)) continue
    assignments.push({ row, key: row.position as string, kind: 'overflow' })
  }

  return assignments
}

/** The ~6-week floor score trends and luck already apply to a derived reading. */
const LOW_CONFIDENCE_WEEKS = 6

/**
 * The embedded `players` relation, which PostgREST types as either an object or
 * an array depending on how it infers the relationship. Read defensively so a
 * type-level surprise degrades to "unmapped" rather than throwing mid-render.
 */
function embeddedPosition(embedded: unknown): unknown {
  if (Array.isArray(embedded)) {
    return embedded.length === 0 ? null : embeddedPosition(embedded[0])
  }
  if (typeof embedded === 'object' && embedded !== null) {
    return (embedded as { position?: unknown }).position
  }
  return null
}

/** Upper-cased catalog position, or null for anything unusable. */
function normalizePosition(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toUpperCase()
  return trimmed === '' ? null : trimmed
}

const round2 = (value: number): number => Math.round(value * 100) / 100
