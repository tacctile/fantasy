/**
 * Manual runner for the Sleeper draft-state sync (Wave 2).
 *
 * Usage: `npm run sync:draft -- <sleeper_league_id>` — loads env from
 * `.env.local` via `--env-file`. Requires the league to be connected
 * (`npm run sync:league`) and its rosters synced (`npm run sync:rosters`).
 * Re-runs are always safe: first-write-wins means existing picks are never
 * rewritten and gaps fill in on later runs.
 */
import { createClient } from '@/lib/supabase/admin'
import { syncLeagueDraftState } from '@/services/sleeper/draft-state'

async function main(): Promise<void> {
  // League IDs are opaque strings — required non-empty, never format-checked.
  const nativeLeagueId = process.argv[2]
  if (!nativeLeagueId) {
    console.error('Usage: npm run sync:draft -- <sleeper_league_id>')
    process.exitCode = 1
    return
  }

  const result = await syncLeagueDraftState(createClient(), nativeLeagueId)
  if (result.nativeDraftId === null) {
    console.log(
      `Sleeper draft sync for league ${nativeLeagueId} (season ${result.seasonYear}): ` +
        `draft is still pre_draft — nothing to ingest yet ` +
        `(${result.startedAt} -> ${result.completedAt})`
    )
    return
  }
  const skipped =
    result.skippedMissingPlayerIds.length === 0
      ? 'no picks skipped'
      : `SKIPPED ${result.skippedMissingPlayerIds.length} picks with players missing from catalog: ${result.skippedMissingPlayerIds.join(', ')} — re-sync after the next daily catalog run`
  console.log(
    `Sleeper draft synced for league ${nativeLeagueId} (season ${result.seasonYear}): ` +
      `draft ${result.nativeDraftId} (status=${result.draftStatus}, type=${result.draftType}); ` +
      `${result.picksFetched} picks fetched, ${result.picksWritten} written, ` +
      `${result.picksAlreadyRecorded} already recorded; ${skipped}; ` +
      `${result.nonNumericAmounts} non-numeric auction amounts ` +
      `(${result.startedAt} -> ${result.completedAt})`
  )
}

main().catch((error: unknown) => {
  console.error('sync:draft failed:', error)
  process.exitCode = 1
})
