/**
 * Manual runner for the per-league Sleeper sync orchestrator (Wave 2).
 *
 * Usage: `npm run sync:sleeper` syncs every connected Sleeper league
 * (config → rosters → matchups → draft, full-season matchup sweep);
 * `npm run sync:sleeper -- <league_id> [<league_id> ...]` syncs only those.
 * A league's failure is isolated — the run continues to the next league and
 * exits nonzero if any league failed.
 */
import { createClient } from '@/lib/supabase/admin'
import { syncAllSleeperLeagues } from '@/services/sleeper/sync-orchestrator'

async function main(): Promise<void> {
  // League IDs are opaque strings — passed through, never format-checked.
  const leagueIds = process.argv.slice(2)

  const run = await syncAllSleeperLeagues(createClient(), { leagueIds })
  if (run.leagues.length === 0) {
    console.log('No connected Sleeper leagues to sync — run sync:league first.')
    return
  }

  for (const outcome of run.leagues) {
    if (outcome.ok) {
      const draft =
        outcome.draft?.nativeDraftId === null
          ? 'draft pre_draft (0 picks)'
          : `draft ${outcome.draft?.picksWritten} new/${outcome.draft?.picksAlreadyRecorded} existing picks`
      console.log(
        `OK   ${outcome.nativeLeagueId} (season ${outcome.config?.seasonYear}): ` +
          `${outcome.rosters?.rosterCount} rosters, ` +
          `${outcome.matchups?.matchupRowCount} matchup rows, ` +
          `${outcome.matchups?.playerScoreRowCount} player-score rows, ${draft}`
      )
    } else {
      console.error(
        `FAIL ${outcome.nativeLeagueId}: step ${outcome.failedStep} — ${outcome.error} ` +
          `(skipped: ${outcome.skippedSteps.join(', ') || 'none'})`
      )
    }
  }
  console.log(
    `Sleeper sync run: ${run.okCount} ok, ${run.failedCount} failed ` +
      `(${run.startedAt} -> ${run.completedAt})`
  )
  if (run.failedCount > 0) process.exitCode = 1
}

main().catch((error: unknown) => {
  console.error('sync:sleeper failed:', error)
  process.exitCode = 1
})
