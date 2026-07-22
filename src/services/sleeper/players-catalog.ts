/**
 * Sleeper player-catalog sync (Wave 2): fetches the full `/players/nfl` dump
 * and reconciles the local `players` table against it.
 *
 * Per wiki/topics/sleeper-api/players-endpoint.md and rate-limits.md, this
 * must run at most once per day, from a single centrally scheduled job —
 * never per-request. Scheduling lands with the Wave 2 cron items; until then
 * the only caller is the manual `npm run sync:players` runner.
 *
 * Order of operations is the safety property: validate the response first
 * (a fetch/validation failure leaves the last known-good rows untouched),
 * upsert everything present, and only after every chunk has succeeded — a
 * completed catalog response — mark the players it omitted as inactive.
 * Absent players are never deleted: historical roster/draft references must
 * keep resolving.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, Json } from '@/lib/supabase/database.types'

import { sleeperGet } from './client'
import type { SleeperPlayerRecord, SleeperPlayersCatalog } from './types'

const CATALOG_PATH = '/players/nfl'
// The dump is 5MB+ and slow to serve — far beyond the client's 10s default.
const CATALOG_TIMEOUT_MS = 60_000
const UPSERT_CHUNK_SIZE = 500
// Truncation floors: Sleeper tracks ~11,000+ entries including inactive and
// historical players. A completed response far below that — or far below
// what we already hold — is a truncated/malformed body, not a real shrink.
const MIN_PLAUSIBLE_RECORD_COUNT = 5_000
const MIN_PLAUSIBLE_RATIO_OF_EXISTING = 0.8
const VALIDATION_SAMPLE_SIZE = 50

type PlayersInsert = Database['public']['Tables']['players']['Insert']

export type PlayersCatalogSyncResult = {
  startedAt: string
  completedAt: string
  fetchedCount: number
  upsertedCount: number
  markedInactiveCount: number
}

/** Sync the full Sleeper player catalog into `players`. At most once per day. */
export async function syncPlayersCatalog(
  db: SupabaseClient<Database>
): Promise<PlayersCatalogSyncResult> {
  const startedAt = new Date().toISOString()

  const { count: existingCount, error: countError } = await db
    .from('players')
    .select('*', { count: 'exact', head: true })
  if (countError) {
    throw new Error(`players count query failed: ${countError.message}`)
  }

  const catalog = await sleeperGet<SleeperPlayersCatalog>(CATALOG_PATH, {
    timeoutMs: CATALOG_TIMEOUT_MS,
  })

  validateCatalog(catalog, existingCount ?? 0)

  const rows: PlayersInsert[] = []
  for (const [playerId, record] of Object.entries(catalog)) {
    if (!playerId) continue
    rows.push(toPlayerRow(playerId, record, startedAt))
  }

  for (let offset = 0; offset < rows.length; offset += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(offset, offset + UPSERT_CHUNK_SIZE)
    const { error } = await db
      .from('players')
      .upsert(chunk, { onConflict: 'sleeper_player_id' })
    if (error) {
      throw new Error(
        `players upsert failed at rows ${offset}–${offset + chunk.length - 1}: ${error.message}`
      )
    }
  }

  // Every chunk succeeded — the response is fully persisted, so anything not
  // stamped by this run was genuinely absent from a completed response.
  const { count: markedInactiveCount, error: markError } = await db
    .from('players')
    .update({ is_active_in_catalog: false }, { count: 'exact' })
    .eq('is_active_in_catalog', true)
    .or(`catalog_last_seen_at.is.null,catalog_last_seen_at.lt.${startedAt}`)
  if (markError) {
    throw new Error(`mark-inactive pass failed: ${markError.message}`)
  }

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    fetchedCount: rows.length,
    upsertedCount: rows.length,
    markedInactiveCount: markedInactiveCount ?? 0,
  }
}

/**
 * Validate a catalog response before anything is persisted, per the
 * players-endpoint page: a plain object (not a truncated body or an HTML
 * error page), a plausible record count relative to the pool size and to
 * what we already hold, and core fields present across a sample.
 */
function validateCatalog(catalog: SleeperPlayersCatalog, existingCount: number): void {
  if (typeof catalog !== 'object' || catalog === null || Array.isArray(catalog)) {
    throw new Error('catalog validation failed: response is not a plain object')
  }

  const values = Object.values(catalog)
  if (values.length < MIN_PLAUSIBLE_RECORD_COUNT) {
    throw new Error(
      `catalog validation failed: ${values.length} records is below the plausibility floor of ${MIN_PLAUSIBLE_RECORD_COUNT}`
    )
  }
  if (existingCount > 0 && values.length < existingCount * MIN_PLAUSIBLE_RATIO_OF_EXISTING) {
    throw new Error(
      `catalog validation failed: ${values.length} records is implausibly low against ${existingCount} existing rows`
    )
  }

  const sample = values.slice(0, VALIDATION_SAMPLE_SIZE)
  const withCoreFields = sample.filter(
    (record) =>
      typeof record === 'object' &&
      record !== null &&
      ('position' in record || 'status' in record || 'team' in record || 'full_name' in record)
  )
  if (withCoreFields.length <= sample.length / 2) {
    throw new Error(
      `catalog validation failed: only ${withCoreFields.length} of ${sample.length} sampled records carry core fields`
    )
  }
}

// Drift guards: Sleeper's field inventory is unversioned and field presence
// is uneven, so unexpected wire types null out rather than crash the sync
// (the full raw record is preserved in metadata regardless). Empty strings
// normalize to null — one absence representation at ingestion.

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const strings = value.filter((item): item is string => typeof item === 'string')
  return strings.length > 0 ? strings : null
}

function asDateString(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function toPlayerRow(
  playerId: string,
  record: SleeperPlayerRecord,
  seenAt: string
): PlayersInsert {
  return {
    sleeper_player_id: playerId,
    full_name: asString(record.full_name),
    first_name: asString(record.first_name),
    last_name: asString(record.last_name),
    position: asString(record.position),
    team: asString(record.team),
    status: asString(record.status),
    injury_status: asString(record.injury_status),
    search_full_name: asString(record.search_full_name),
    search_rank: asInteger(record.search_rank),
    fantasy_positions: asStringArray(record.fantasy_positions),
    birth_date: asDateString(record.birth_date),
    // Full raw record — preserves fields normalization drops, including the
    // cross-provider ID block the Wave 2 crosswalk item will read.
    metadata: record as unknown as Json,
    is_active_in_catalog: true,
    catalog_last_seen_at: seenAt,
  }
}
