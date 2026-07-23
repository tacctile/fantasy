/**
 * ADP ingestion (Wave 3a): fetches Sleeper's undocumented projections
 * endpoint, extracts the per-format `adp_*` fields by pattern, and reconciles
 * `adp_rankings` as a current snapshot — per
 * wiki/topics/sleeper-api/projections-endpoint.md, the source of record for
 * this surface's shape and required defensive posture.
 *
 * Order of operations is the safety property (validate-before-swap, same as
 * the players catalog): structural validation and plausibility gates run
 * before any write, so a failed, truncated, or shape-changed response leaves
 * the last good snapshot untouched — a days-old ADP snapshot is still
 * overwhelmingly useful for a draft; a wiped table is not. Only after every
 * upsert chunk has succeeded does the stale-row cleanup remove entries the
 * validated response no longer carries (current-snapshot semantics,
 * mirroring the catalog's complete-response-then-reconcile ordering).
 *
 * Fused projections persist (Wave 3b BPA prerequisite, Nick-signed
 * 2026-07-22): the same validated response additionally lands one
 * `player_projections` row per fetched player — the full stats object
 * as-received plus vendor/timestamp provenance — so the contractless host
 * still sees exactly one request per run. Each table keeps its own
 * plausibility gates and current-snapshot cleanup; the ADP swap completes
 * first, so a projections failure after that point leaves the fresh ADP
 * snapshot valid and the projections last-good snapshot untouched.
 *
 * Isolation: this module (and the adp/ directory generally) is the same
 * fault-containment boundary the platform applies to ESPN — a failure here
 * must degrade only the ADP feature. It is never part of the Sleeper
 * orchestrator's league chain, shares no code path with services/sleeper/,
 * and every caller (cron route, manual runner) contains its errors rather
 * than letting them cascade.
 *
 * Extraction rules (all wiki-decided):
 * - `adp_*` fields are captured by pattern from `stats` — the inventory is
 *   demonstrably open (12+ observed), so unrecognized variants ingest as
 *   rows rather than failing.
 * - 999.0 (and anything >= 999) is the "no ADP in this format" sentinel —
 *   never ingested; non-numeric and <= 0 values are likewise excluded.
 * - Positional rank is the platform's own derivation (the source provides
 *   no positional ADP): within each format, players rank by ADP ascending
 *   within their `players.position`, tie-broken by `sleeper_player_id` for
 *   deterministic ordering. Players without a catalog position get null.
 * - Players absent from the `players` catalog are recorded as unmapped and
 *   skipped — never silently dropped, never used to mint an identity row
 *   (Schema Rule #4). Self-heals after the next daily catalog sync.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, Json } from '@/lib/supabase/database.types'
import { getNflState } from '@/services/sleeper/nfl-state'
import { finishSyncRun, startSyncRun } from '@/services/sync-runs'

import { fetchSeasonProjections } from './client'
import type {
  AdpEntry,
  AdpIngestionResult,
  AdpProjectionRecord,
  AdpRow,
  PlayerProjectionRow,
} from './types'

const ADP_SOURCE = 'sleeper' as const
const PROJECTION_SOURCE = 'sleeper' as const
const ADP_FIELD_PREFIX = 'adp_'
// Values >= this are the "no ADP in this format" sentinel (observed 999.0).
const ADP_SENTINEL_MIN = 999
const CHUNK_SIZE = 500
// Plausibility floors: six positions of fantasy-relevant players should be
// several hundred records; far fewer is a truncated/malformed body. A
// validated refresh materially smaller than the standing snapshot is treated
// as implausible rather than accepted as a real shrink.
const MIN_PLAUSIBLE_RECORD_COUNT = 200
const MIN_PLAUSIBLE_RATIO_OF_EXISTING = 0.5
const VALIDATION_SAMPLE_SIZE = 50

/**
 * Ingest the current ADP snapshot for one season into `adp_rankings`.
 * Idempotent — safe to re-run; a fetch/validation failure writes nothing.
 * When `seasonYear` is omitted it derives from `/state/nfl`'s
 * `league_season` (the wiki-decided season-selection field; the raw `season`
 * field lags during the winter rollover window).
 */
export async function syncAdpRankings(
  db: SupabaseClient<Database>,
  options?: { seasonYear?: number }
): Promise<AdpIngestionResult> {
  const startedAt = new Date().toISOString()
  const seasonYear = options?.seasonYear ?? (await resolveAdpSeasonYear())

  const { count: existingRowCount, error: countError } = await db
    .from('adp_rankings')
    .select('*', { count: 'exact', head: true })
    .eq('adp_source', ADP_SOURCE)
    .eq('season_year', seasonYear)
  if (countError) {
    throw new Error(`adp_rankings count query failed: ${countError.message}`)
  }

  const { count: existingProjectionRowCount, error: projectionCountError } = await db
    .from('player_projections')
    .select('*', { count: 'exact', head: true })
    .eq('projection_source', PROJECTION_SOURCE)
    .eq('season_year', seasonYear)
  if (projectionCountError) {
    throw new Error(`player_projections count query failed: ${projectionCountError.message}`)
  }

  const raw = await fetchSeasonProjections(seasonYear)
  const records = validateProjectionsResponse(raw)

  const extraction = extractAdpEntries(records)

  // Projection candidates (fused persist): one per distinct fetched player
  // with a usable record — valid player_id plus a stats object, the same
  // structural bar validation sampled for. First occurrence wins on a
  // duplicated player_id (dedup is required for a single-statement upsert;
  // duplicates are unobserved, but this surface has no contract).
  const projectionCandidates = new Map<string, AdpProjectionRecord>()
  for (const record of records) {
    if (typeof record !== 'object' || record === null) continue
    const playerId = record.player_id
    if (typeof playerId !== 'string' || playerId.length === 0) continue
    if (typeof record.stats !== 'object' || record.stats === null) continue
    if (!projectionCandidates.has(playerId)) projectionCandidates.set(playerId, record)
  }

  // Resolve entries against the canonical catalog: unmapped players are
  // reported, never inserted (their FK target doesn't exist) and never
  // identity-created here.
  const uniquePlayerIds = [
    ...new Set([
      ...extraction.entries.map((e) => e.sleeperPlayerId),
      ...projectionCandidates.keys(),
    ]),
  ]
  const positionByPlayerId = await fetchCatalogPositions(db, uniquePlayerIds)
  const unmappedPlayerIds = uniquePlayerIds.filter((id) => !positionByPlayerId.has(id))
  const unmappedSet = new Set(unmappedPlayerIds)
  const mappedEntries = extraction.entries.filter((e) => !unmappedSet.has(e.sleeperPlayerId))

  // Final plausibility gate before any write: an insertable set materially
  // smaller than the standing snapshot means a degraded response, not a real
  // shrink — keep the last good snapshot instead.
  if (mappedEntries.length === 0) {
    throw new Error('adp ingestion aborted: response yielded zero insertable ADP entries')
  }
  if (
    (existingRowCount ?? 0) > 0 &&
    mappedEntries.length < (existingRowCount ?? 0) * MIN_PLAUSIBLE_RATIO_OF_EXISTING
  ) {
    throw new Error(
      `adp ingestion aborted: ${mappedEntries.length} insertable entries is implausibly low ` +
        `against ${existingRowCount} existing rows — last good snapshot preserved`
    )
  }

  // The projections snapshot gates independently against its own table —
  // both gates must pass before EITHER table is written (one fetch, one
  // accept/reject decision per table, no partial acceptance of a degraded
  // response).
  const mappedProjectionRecords = [...projectionCandidates.entries()].filter(([playerId]) =>
    positionByPlayerId.has(playerId)
  )
  if (mappedProjectionRecords.length === 0) {
    throw new Error('adp ingestion aborted: response yielded zero insertable projection records')
  }
  if (
    (existingProjectionRowCount ?? 0) > 0 &&
    mappedProjectionRecords.length <
      (existingProjectionRowCount ?? 0) * MIN_PLAUSIBLE_RATIO_OF_EXISTING
  ) {
    throw new Error(
      `adp ingestion aborted: ${mappedProjectionRecords.length} insertable projection records ` +
        `is implausibly low against ${existingProjectionRowCount} existing rows — last good ` +
        `snapshot preserved`
    )
  }

  const positionalRanks = derivePositionalRanks(mappedEntries, positionByPlayerId)

  const rows: AdpRow[] = mappedEntries.map((entry) => ({
    sleeper_player_id: entry.sleeperPlayerId,
    adp_source: ADP_SOURCE,
    season_year: seasonYear,
    scoring_format: entry.scoringFormat,
    adp_overall: entry.adpOverall,
    positional_rank: positionalRanks.get(rankKey(entry)) ?? null,
    ingested_at: startedAt,
  }))

  for (let offset = 0; offset < rows.length; offset += CHUNK_SIZE) {
    const chunk = rows.slice(offset, offset + CHUNK_SIZE)
    const { error } = await db.from('adp_rankings').upsert(chunk, {
      onConflict: 'sleeper_player_id,adp_source,season_year,scoring_format',
    })
    if (error) {
      throw new Error(
        `adp_rankings upsert failed at rows ${offset}–${offset + chunk.length - 1}: ${error.message}`
      )
    }
  }

  // Every chunk succeeded — the validated snapshot is fully persisted, so
  // rows this run didn't stamp were genuinely absent from it (a player gone
  // sentinel or dropped by the source). Remove them: this table is a current
  // snapshot, and a vanished ADP left in place would read as fresh forever.
  const { count: staleRowsDeletedCount, error: deleteError } = await db
    .from('adp_rankings')
    .delete({ count: 'exact' })
    .eq('adp_source', ADP_SOURCE)
    .eq('season_year', seasonYear)
    .lt('ingested_at', startedAt)
  if (deleteError) {
    throw new Error(`adp_rankings stale-row cleanup failed: ${deleteError.message}`)
  }

  // Projections persist (fused): the ADP swap above is already complete, so
  // a failure from here degrades only the projections snapshot — which keeps
  // its own last good rows (nothing below deletes until every chunk lands).
  const projectionRows: PlayerProjectionRow[] = mappedProjectionRecords.map(
    ([playerId, record]) => ({
      sleeper_player_id: playerId,
      projection_source: PROJECTION_SOURCE,
      season_year: seasonYear,
      // Candidate selection guarantees a JSON-parsed object here.
      stats: record.stats as Json,
      company: typeof record.company === 'string' ? record.company : null,
      source_last_modified: epochMsToIso(record.last_modified),
      source_updated_at: epochMsToIso(record.updated_at),
      ingested_at: startedAt,
    })
  )

  for (let offset = 0; offset < projectionRows.length; offset += CHUNK_SIZE) {
    const chunk = projectionRows.slice(offset, offset + CHUNK_SIZE)
    const { error } = await db.from('player_projections').upsert(chunk, {
      onConflict: 'sleeper_player_id,projection_source,season_year',
    })
    if (error) {
      throw new Error(
        `player_projections upsert failed at rows ${offset}–${offset + chunk.length - 1}: ${error.message}`
      )
    }
  }

  const { count: projectionStaleRowsDeletedCount, error: projectionDeleteError } = await db
    .from('player_projections')
    .delete({ count: 'exact' })
    .eq('projection_source', PROJECTION_SOURCE)
    .eq('season_year', seasonYear)
    .lt('ingested_at', startedAt)
  if (projectionDeleteError) {
    throw new Error(`player_projections stale-row cleanup failed: ${projectionDeleteError.message}`)
  }

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    seasonYear,
    adpSource: ADP_SOURCE,
    fetchedRecordCount: records.length,
    recordsWithAdpCount: extraction.recordsWithAdpCount,
    extractedEntryCount: extraction.entries.length,
    sentinelSkippedCount: extraction.sentinelSkippedCount,
    implausibleValueCount: extraction.implausibleValueCount,
    unmappedPlayerCount: unmappedPlayerIds.length,
    unmappedPlayerIds,
    upsertedRowCount: rows.length,
    staleRowsDeletedCount: staleRowsDeletedCount ?? 0,
    formatsSeen: [...new Set(mappedEntries.map((e) => e.scoringFormat))].sort(),
    projectionRowsPersistedCount: projectionRows.length,
    projectionStaleRowsDeletedCount: projectionStaleRowsDeletedCount ?? 0,
  }
}

/** Outcome of a tracked ingestion run. Never throws — the containment
 * contract both callers rely on (the dedicated cron route maps `ok: false`
 * to a 500; the sync-leagues piggyback logs and moves on, so an ADP failure
 * can never affect the league-state outcome). */
export type TrackedAdpIngestionOutcome =
  | { ok: true; result: AdpIngestionResult }
  | { ok: false; error: string }

/**
 * Run ADP ingestion wrapped in `sync_runs` telemetry (source
 * `'adp_ingestion'`, platform `'sleeper'`, `league_id` null — a global run,
 * like the players catalog). Every failure — including a tracking-write
 * failure — is contained and returned, never thrown.
 */
export async function runTrackedAdpIngestion(
  db: SupabaseClient<Database>
): Promise<TrackedAdpIngestionOutcome> {
  try {
    const runId = await startSyncRun(db, { source: 'adp_ingestion', platform: 'sleeper' })
    try {
      const result = await syncAdpRankings(db)
      await finishSyncRun(db, runId, {
        status: 'success',
        completedAt: result.completedAt,
        counts: {
          fetched: result.fetchedRecordCount,
          records_with_adp: result.recordsWithAdpCount,
          entries: result.extractedEntryCount,
          upserted: result.upsertedRowCount,
          stale_deleted: result.staleRowsDeletedCount,
          sentinel_skipped: result.sentinelSkippedCount,
          implausible_skipped: result.implausibleValueCount,
          unmapped_players: result.unmappedPlayerCount,
          projections_persisted: result.projectionRowsPersistedCount,
          projections_stale_deleted: result.projectionStaleRowsDeletedCount,
        },
      })
      return { ok: true, result }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await finishSyncRun(db, runId, { status: 'failure', errorSummary: message }).catch(
        (trackingError: unknown) => {
          console.error('adp ingestion: failure-tracking write also failed:', trackingError)
        }
      )
      return { ok: false, error: message }
    }
  } catch (error) {
    // startSyncRun itself failed — the ingestion never began.
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/** Season the connected leagues are operating in, per the nfl-state page's
 * season-selection decision: `league_season` first (it leads correctly
 * through the winter rollover), raw `season` as fallback. */
async function resolveAdpSeasonYear(): Promise<number> {
  const state = await getNflState()
  const rawSeason = state.league_season ?? state.season
  const year = typeof rawSeason === 'string' ? Number.parseInt(rawSeason, 10) : NaN
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    throw new Error(`could not resolve a plausible ADP season year from /state/nfl (${rawSeason})`)
  }
  return year
}

/**
 * Structural validation before anything is persisted: the response must be
 * an array (NOT the documented dump's ID-keyed map — a shape change here is
 * exactly the kind of unannounced drift this surface can undergo), of
 * plausible size, whose sampled records carry `player_id` and a `stats`
 * object.
 */
function validateProjectionsResponse(raw: unknown): AdpProjectionRecord[] {
  if (!Array.isArray(raw)) {
    throw new Error('adp validation failed: response is not a JSON array')
  }
  if (raw.length < MIN_PLAUSIBLE_RECORD_COUNT) {
    throw new Error(
      `adp validation failed: ${raw.length} records is below the plausibility floor of ${MIN_PLAUSIBLE_RECORD_COUNT}`
    )
  }

  const sample = raw.slice(0, VALIDATION_SAMPLE_SIZE)
  const structurallySound = sample.filter(
    (record) =>
      typeof record === 'object' &&
      record !== null &&
      typeof (record as AdpProjectionRecord).player_id === 'string' &&
      typeof (record as AdpProjectionRecord).stats === 'object' &&
      (record as AdpProjectionRecord).stats !== null
  )
  if (structurallySound.length <= sample.length / 2) {
    throw new Error(
      `adp validation failed: only ${structurallySound.length} of ${sample.length} sampled records carry player_id + stats`
    )
  }

  return raw as AdpProjectionRecord[]
}

/** Pattern-extract every real ADP value; field presence is never assumed
 * uniform across records (tolerate absent keys, preserve unrecognized
 * `adp_*` variants as first-class entries). */
function extractAdpEntries(records: AdpProjectionRecord[]): {
  entries: AdpEntry[]
  recordsWithAdpCount: number
  sentinelSkippedCount: number
  implausibleValueCount: number
} {
  const entries: AdpEntry[] = []
  let recordsWithAdpCount = 0
  let sentinelSkippedCount = 0
  let implausibleValueCount = 0

  for (const record of records) {
    if (typeof record !== 'object' || record === null) continue
    const playerId = record.player_id
    const stats = record.stats
    if (typeof playerId !== 'string' || playerId.length === 0) continue
    if (typeof stats !== 'object' || stats === null) continue

    let recordHadAdp = false
    for (const [key, value] of Object.entries(stats)) {
      if (!key.startsWith(ADP_FIELD_PREFIX)) continue
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        implausibleValueCount++
        continue
      }
      if (value >= ADP_SENTINEL_MIN) {
        sentinelSkippedCount++
        continue
      }
      if (value <= 0) {
        implausibleValueCount++
        continue
      }
      entries.push({
        sleeperPlayerId: playerId,
        scoringFormat: key.slice(ADP_FIELD_PREFIX.length),
        adpOverall: value,
      })
      recordHadAdp = true
    }
    if (recordHadAdp) recordsWithAdpCount++
  }

  return { entries, recordsWithAdpCount, sentinelSkippedCount, implausibleValueCount }
}

/** Chunked catalog lookup: `sleeper_player_id` → `position` for every
 * fetched ID that exists in `players`. */
async function fetchCatalogPositions(
  db: SupabaseClient<Database>,
  playerIds: string[]
): Promise<Map<string, string | null>> {
  const positions = new Map<string, string | null>()
  for (let offset = 0; offset < playerIds.length; offset += CHUNK_SIZE) {
    const chunk = playerIds.slice(offset, offset + CHUNK_SIZE)
    const { data, error } = await db
      .from('players')
      .select('sleeper_player_id, position')
      .in('sleeper_player_id', chunk)
    if (error) {
      throw new Error(`players position lookup failed: ${error.message}`)
    }
    for (const row of data) positions.set(row.sleeper_player_id, row.position)
  }
  return positions
}

/** Epoch-millisecond wire timestamp → ISO string; anything implausible
 * (non-numeric, non-positive) lands as null (permissive parsing — the
 * provenance columns are nullable by design). */
function epochMsToIso(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return new Date(value).toISOString()
}

function rankKey(entry: AdpEntry): string {
  return `${entry.scoringFormat} ${entry.sleeperPlayerId}`
}

/** Rank within (format, position) by ADP ascending, `sleeper_player_id` as
 * the deterministic tie-breaker. Null-position players stay unranked. */
function derivePositionalRanks(
  entries: AdpEntry[],
  positionByPlayerId: Map<string, string | null>
): Map<string, number> {
  const groups = new Map<string, AdpEntry[]>()
  for (const entry of entries) {
    const position = positionByPlayerId.get(entry.sleeperPlayerId)
    if (position === null || position === undefined) continue
    const groupKey = `${entry.scoringFormat} ${position}`
    const group = groups.get(groupKey)
    if (group) group.push(entry)
    else groups.set(groupKey, [entry])
  }

  const ranks = new Map<string, number>()
  for (const group of groups.values()) {
    group.sort(
      (a, b) =>
        a.adpOverall - b.adpOverall ||
        (a.sleeperPlayerId < b.sleeperPlayerId ? -1 : a.sleeperPlayerId > b.sleeperPlayerId ? 1 : 0)
    )
    group.forEach((entry, index) => ranks.set(rankKey(entry), index + 1))
  }
  return ranks
}
