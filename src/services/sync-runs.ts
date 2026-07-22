/**
 * Sync-run tracking (Wave 2 cron sub-section): the write/read surface for the
 * `sync_runs` table — one row per sync unit (a global players-catalog run, or
 * one league's slice of a league-state/draft-poll run) so sync health is
 * visible without digging through Vercel logs. Platform-agnostic by design:
 * the ESPN sync paths record through these same functions when the ESPN
 * sub-sections unblock.
 *
 * Recording failures must never mask a sync's own outcome — callers that
 * treat tracking as best-effort use `recordSyncRunSafely`, which logs and
 * swallows. The players-catalog guard is the deliberate exception: it reads
 * this table to enforce the once-per-day Sleeper rule and fails CLOSED on a
 * read error, because breaking that contract is worse than skipping a day.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

export type SyncRunSource = 'players_catalog' | 'league_state' | 'draft_poll'
export type SyncRunPlatform = Database['public']['Enums']['platform']
export type SyncRunTerminalStatus = 'success' | 'failure' | 'skipped'

export type SyncRunRecord = {
  source: SyncRunSource
  platform: SyncRunPlatform
  /** Null for global (non-league-scoped) runs — the players catalog. */
  leagueId?: string | null
  status: SyncRunTerminalStatus
  startedAt: string
  completedAt: string
  /** Per-job record counts; shapes differ per source. */
  counts?: Record<string, number> | null
  errorSummary?: string | null
}

/** Insert a `running` row up front; returns its id for the later finish. */
export async function startSyncRun(
  db: SupabaseClient<Database>,
  params: { source: SyncRunSource; platform: SyncRunPlatform; leagueId?: string | null }
): Promise<number> {
  const { data, error } = await db
    .from('sync_runs')
    .insert({
      source: params.source,
      platform: params.platform,
      league_id: params.leagueId ?? null,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) throw new Error(`sync-run start failed: ${error.message}`)
  return data.id
}

/** Move a `running` row to its terminal status. */
export async function finishSyncRun(
  db: SupabaseClient<Database>,
  id: number,
  params: {
    status: SyncRunTerminalStatus
    completedAt?: string
    counts?: Record<string, number> | null
    errorSummary?: string | null
  }
): Promise<void> {
  const { error } = await db
    .from('sync_runs')
    .update({
      status: params.status,
      completed_at: params.completedAt ?? new Date().toISOString(),
      counts: params.counts ?? null,
      error_summary: params.errorSummary ?? null,
    })
    .eq('id', id)
  if (error) throw new Error(`sync-run finish failed: ${error.message}`)
}

/** One-shot terminal row, written after the fact (per-league run slices). */
export async function recordSyncRun(
  db: SupabaseClient<Database>,
  record: SyncRunRecord
): Promise<void> {
  const { error } = await db.from('sync_runs').insert({
    source: record.source,
    platform: record.platform,
    league_id: record.leagueId ?? null,
    status: record.status,
    started_at: record.startedAt,
    completed_at: record.completedAt,
    counts: record.counts ?? null,
    error_summary: record.errorSummary ?? null,
  })
  if (error) throw new Error(`sync-run record failed: ${error.message}`)
}

/** Best-effort variant: tracking must never mask the sync's own outcome. */
export async function recordSyncRunSafely(
  db: SupabaseClient<Database>,
  record: SyncRunRecord
): Promise<void> {
  try {
    await recordSyncRun(db, record)
  } catch (error) {
    console.error('sync-run tracking write failed (sync outcome unaffected):', error)
  }
}

/**
 * The players-catalog once-per-day guard: true when any catalog run started
 * within the window is `running` or `success`. `failure` rows don't block (a
 * genuine failure retry is the rule's one sanctioned exception) and `skipped`
 * rows never count as runs. Throws on read error — the caller fails closed.
 */
export async function hasRecentCatalogRun(
  db: SupabaseClient<Database>,
  windowHours = 24
): Promise<boolean> {
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()
  const { data, error } = await db
    .from('sync_runs')
    .select('id')
    .eq('source', 'players_catalog')
    .in('status', ['running', 'success'])
    .gte('started_at', cutoff)
    .limit(1)
  if (error) throw new Error(`catalog-guard read failed: ${error.message}`)
  return data.length > 0
}
