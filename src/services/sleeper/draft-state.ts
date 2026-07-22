/**
 * Sleeper draft-state sync (Wave 2): walks `/league/{league_id}/drafts` (the
 * league object's single `draft_id` is never trusted as exhaustive — a league
 * can carry aborted/restarted drafts that are never deleted), selects the
 * season's draft by status preference (`drafting` > `complete`; a tie within
 * the preferred status or no candidate in either → explicit error naming the
 * candidates; a season whose drafts are all still `pre_draft` is a valid
 * zero-pick state), then ingests `/draft/{draft_id}/picks` into the shared
 * `draft_state` table with `source='sleeper_poll'`.
 *
 * First-write-wins: the (league_id, pick_number) primary key is the
 * guarantee — writes use ON CONFLICT DO NOTHING and an existing row is never
 * updated (a recorded pick is immutable; manual entry and ESPN polling share
 * the same semantic in Wave 3). Re-runs are therefore always safe, and
 * skipped picks self-heal on a later run.
 *
 * Ownership is the pick's `roster_id` — never `draft_slot` (original board
 * column, wrong for traded picks) or `picked_by` (the clicking human, wrong
 * for commissioner/autopicks). `pick_no`/`round` are persisted as-received;
 * snake arithmetic is never used to reconstruct them. Auction value is
 * `metadata.amount` (a string on the wire, coerced here) and stays null for
 * snake/linear picks.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import { sleeperGet } from './client'
import type { SleeperDraft, SleeperDraftPick } from './types'

const UPSERT_CHUNK_SIZE = 500

type DraftStateInsert = Database['public']['Tables']['draft_state']['Insert']

export type LeagueDraftSyncResult = {
  startedAt: string
  completedAt: string
  leagueUuid: string
  seasonYear: number
  /** Selected draft's ID — null only in the pre-draft zero-pick state. */
  nativeDraftId: string | null
  /** Selected draft's lifecycle status (`pre_draft` in the zero-pick state). */
  draftStatus: string | null
  /** Selected draft's format (`snake` | `linear` | `auction`), null pre-draft. */
  draftType: string | null
  picksFetched: number
  /** Rows newly inserted this run (first-write-wins: conflicts never rewrite). */
  picksWritten: number
  /** Picks already recorded by an earlier run (fetched − skipped − written). */
  picksAlreadyRecorded: number
  /**
   * Player IDs on picks absent from our catalog — those pick rows are skipped
   * and reported (Nick's 2026-07-22 ruling, same as matchups), self-healing
   * after the next daily catalog run + re-sync.
   */
  skippedMissingPlayerIds: string[]
  /** Auction picks whose `metadata.amount` failed numeric coercion (drift). */
  nonNumericAmounts: number
}

/**
 * Sync one Sleeper league's draft picks into the shared `draft_state` table.
 * Requires the league to be connected (league-config sync) and its rosters
 * synced (the picks' roster FK) — both are explicit precondition errors, not
 * silent skips.
 */
export async function syncLeagueDraftState(
  db: SupabaseClient<Database>,
  nativeLeagueId: string
): Promise<LeagueDraftSyncResult> {
  const startedAt = new Date().toISOString()

  const { data: leagueRow, error: leagueError } = await db
    .from('leagues')
    .select('platform_league_uuid, season_year')
    .eq('platform', 'sleeper')
    .eq('native_league_id', nativeLeagueId)
    .maybeSingle()
  if (leagueError) {
    throw new Error(`league lookup failed: ${leagueError.message}`)
  }
  if (leagueRow === null) {
    throw new Error(
      `league ${nativeLeagueId} is not connected — run the league-config sync first`
    )
  }
  const leagueUuid = leagueRow.platform_league_uuid
  const seasonYear = leagueRow.season_year

  const drafts = await sleeperGet<SleeperDraft[]>(
    `/league/${nativeLeagueId}/drafts`
  )
  if (!Array.isArray(drafts)) {
    throw new Error('drafts validation failed: response is not an array')
  }
  const seasonDrafts = drafts.filter(
    (draft) => asString(draft?.season) === String(seasonYear)
  )
  if (seasonDrafts.length === 0) {
    throw new Error(
      `no drafts found for league ${nativeLeagueId} season ${seasonYear} ` +
        `(the endpoint returned ${drafts.length} draft(s) for other seasons)`
    )
  }

  const selected = selectDraft(seasonDrafts)
  if (selected === null) {
    // Every season candidate is still pre_draft — a valid offseason state
    // (Nick's 2026-07-22 ruling): succeed with zero picks written.
    return {
      startedAt,
      completedAt: new Date().toISOString(),
      leagueUuid,
      seasonYear,
      nativeDraftId: null,
      draftStatus: 'pre_draft',
      draftType: null,
      picksFetched: 0,
      picksWritten: 0,
      picksAlreadyRecorded: 0,
      skippedMissingPlayerIds: [],
      nonNumericAmounts: 0,
    }
  }
  const nativeDraftId = selected.draftId
  const isAuction = selected.type === 'auction'

  const picks = await sleeperGet<SleeperDraftPick[]>(
    `/draft/${nativeDraftId}/picks`
  )
  const validated = validatePicks(picks)

  // Rosters precondition: the picks' (league_id, native_roster_id) FK needs
  // the rosters sync to have run. A pick pointing at a roster outside the
  // synced set is structural breakage (roster IDs are stable 1..N), distinct
  // from the missing-player skip ruling — it hard-fails.
  const { data: rosterRows, error: rosterError } = await db
    .from('rosters')
    .select('native_roster_id')
    .eq('league_id', leagueUuid)
  if (rosterError) {
    throw new Error(`rosters lookup failed: ${rosterError.message}`)
  }
  if (validated.length > 0 && rosterRows.length === 0) {
    throw new Error(
      `league ${nativeLeagueId} has no synced rosters — run the rosters sync first`
    )
  }
  const knownRosterIds = new Set(rosterRows.map((row) => row.native_roster_id))
  for (const pick of validated) {
    if (!knownRosterIds.has(pick.roster_id)) {
      throw new Error(
        `pick ${pick.pick_no} references roster_id ${pick.roster_id}, ` +
          'which is not in the synced rosters for this league'
      )
    }
  }

  // Skip-and-record for picks whose player our catalog doesn't hold.
  const skippedMissingPlayerIds = await findMissingPlayerIds(
    db,
    validated.map((pick) => pick.player_id)
  )
  const missing = new Set(skippedMissingPlayerIds)

  let nonNumericAmounts = 0
  const rows: DraftStateInsert[] = []
  for (const pick of validated) {
    if (missing.has(pick.player_id)) continue
    let amount: number | null = null
    if (isAuction) {
      amount = asAmount(asPlainObject(pick.metadata)?.amount)
      if (amount === null) nonNumericAmounts += 1
    }
    rows.push({
      league_id: leagueUuid,
      pick_number: pick.pick_no,
      round: pick.round,
      sleeper_player_id: pick.player_id,
      native_roster_id: pick.roster_id,
      source: 'sleeper_poll',
      platform: 'sleeper',
      season_year: seasonYear,
      native_draft_id: nativeDraftId,
      amount,
    })
  }

  // ON CONFLICT DO NOTHING (ignoreDuplicates) is the first-write-wins write:
  // the returned representation contains only the rows actually inserted.
  let picksWritten = 0
  for (let offset = 0; offset < rows.length; offset += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(offset, offset + UPSERT_CHUNK_SIZE)
    const { data, error } = await db
      .from('draft_state')
      .upsert(chunk, {
        onConflict: 'league_id,pick_number',
        ignoreDuplicates: true,
      })
      .select('pick_number')
    if (error) {
      throw new Error(
        `draft_state insert failed at rows ${offset}–${offset + chunk.length - 1}: ${error.message}`
      )
    }
    picksWritten += data.length
  }

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    leagueUuid,
    seasonYear,
    nativeDraftId,
    draftStatus: selected.status,
    draftType: selected.type,
    picksFetched: validated.length,
    picksWritten,
    picksAlreadyRecorded: rows.length - picksWritten,
    skippedMissingPlayerIds,
    nonNumericAmounts,
  }
}

type SelectedDraft = {
  draftId: string
  status: string
  type: string | null
}

/**
 * Status-preference selection over the season's drafts (Nick's 2026-07-22
 * ruling): prefer `drafting`, then `complete`. More than one draft in the
 * preferred status, or none in either status with any non-pre_draft candidate
 * present (e.g. `paused`), is an explicit error naming the candidates — never
 * a guess. Returns null only when every candidate is `pre_draft`.
 */
function selectDraft(seasonDrafts: SleeperDraft[]): SelectedDraft | null {
  for (const preferredStatus of ['drafting', 'complete']) {
    const candidates = seasonDrafts.filter(
      (draft) => asString(draft?.status) === preferredStatus
    )
    if (candidates.length === 1) {
      const draftId = asString(candidates[0].draft_id)
      if (draftId === null) {
        throw new Error(
          `draft selection failed: the ${preferredStatus} draft has no draft_id`
        )
      }
      return {
        draftId,
        status: preferredStatus,
        type: asString(candidates[0].type),
      }
    }
    if (candidates.length > 1) {
      throw new Error(
        `draft selection is ambiguous: ${candidates.length} drafts with ` +
          `status ${preferredStatus} — ${describeDrafts(candidates)}`
      )
    }
  }
  if (
    seasonDrafts.every((draft) => asString(draft?.status) === 'pre_draft')
  ) {
    return null
  }
  throw new Error(
    'draft selection failed: no draft with status drafting or complete — ' +
      describeDrafts(seasonDrafts)
  )
}

function describeDrafts(drafts: SleeperDraft[]): string {
  return drafts
    .map(
      (draft) =>
        `${asString(draft?.draft_id) ?? '<no id>'} ` +
        `(status=${asString(draft?.status) ?? '<none>'}, type=${asString(draft?.type) ?? '<none>'})`
    )
    .join(', ')
}

type ValidatedPick = SleeperDraftPick & {
  pick_no: number
  round: number
  player_id: string
  roster_id: number
}

/**
 * Validate the picks response before anything is persisted: an array (empty
 * is valid for a just-started draft) in which every entry carries the four
 * fields the row needs — positive integer `pick_no` and `round`, a usable
 * `player_id`, and an integer `roster_id` (the ownership field). Any entry
 * missing one is wire drift and hard-fails the sync.
 */
function validatePicks(picks: SleeperDraftPick[]): ValidatedPick[] {
  if (!Array.isArray(picks)) {
    throw new Error('picks validation failed: response is not an array')
  }
  return picks.map((pick, index) => {
    if (
      typeof pick !== 'object' ||
      pick === null ||
      typeof pick.pick_no !== 'number' ||
      !Number.isInteger(pick.pick_no) ||
      pick.pick_no < 1 ||
      typeof pick.round !== 'number' ||
      !Number.isInteger(pick.round) ||
      pick.round < 1 ||
      asPlayerId(pick.player_id) === null ||
      typeof pick.roster_id !== 'number' ||
      !Number.isInteger(pick.roster_id)
    ) {
      throw new Error(
        `picks validation failed: entry ${index} lacks a usable ` +
          'pick_no/round/player_id/roster_id'
      )
    }
    return pick as ValidatedPick
  })
}

/** Query which of the given player IDs are absent from our catalog. */
async function findMissingPlayerIds(
  db: SupabaseClient<Database>,
  playerIds: string[]
): Promise<string[]> {
  const unique = Array.from(new Set(playerIds))
  if (unique.length === 0) return []
  const { data, error } = await db
    .from('players')
    .select('sleeper_player_id')
    .in('sleeper_player_id', unique)
  if (error) {
    throw new Error(`players existence check failed: ${error.message}`)
  }
  const existing = new Set(data.map((row) => row.sleeper_player_id))
  return unique.filter((id) => !existing.has(id))
}

// Wire-value coercers (drift guards, same posture as the sibling services).

/**
 * A usable player-ID entry: non-empty string, excluding the "0" empty-slot
 * sentinel. D/ST team-abbreviation IDs pass through — IDs are opaque
 * strings, never numerically parsed.
 */
function asPlayerId(value: unknown): string | null {
  const id = asString(value)
  return id !== null && id !== '0' ? id : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

/**
 * Auction winning bid: a string on the wire per the draft-endpoint page,
 * coerced to a finite non-negative number; a numeric wire value is accepted
 * as drift tolerance. Anything else is null (counted as non-numeric).
 */
function asAmount(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  }
  return null
}

function asPlainObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}
