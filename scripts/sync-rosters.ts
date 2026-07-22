/**
 * Manual runner for the Sleeper rosters + users + standings sync (Wave 2).
 *
 * Usage: `npm run sync:rosters -- <sleeper_league_id>` — loads env from
 * `.env.local` via `--env-file`. Requires the league to be connected first
 * (`npm run sync:league`); the Wave 2 per-league orchestrator will later
 * chain both in dependency order.
 */
import { createClient } from '@/lib/supabase/admin'
import { syncLeagueRosters } from '@/services/sleeper/league-rosters'

async function main(): Promise<void> {
  // League IDs are opaque strings — required non-empty, never format-checked.
  const nativeLeagueId = process.argv[2]
  if (!nativeLeagueId) {
    console.error('Usage: npm run sync:rosters -- <sleeper_league_id>')
    process.exitCode = 1
    return
  }

  const result = await syncLeagueRosters(createClient(), nativeLeagueId)
  const skipped =
    result.skippedMissingPlayerIds.length === 0
      ? 'no players skipped'
      : `SKIPPED ${result.skippedMissingPlayerIds.length} players missing from catalog: ${result.skippedMissingPlayerIds.join(', ')} — re-sync after the next daily catalog run`
  console.log(
    `Sleeper rosters synced for league ${nativeLeagueId} (season ${result.seasonYear}): ` +
      `${result.rosterCount} rosters, ${result.membershipCount} membership rows, ` +
      `${result.standingsCount} standings rows; ${skipped} ` +
      `(${result.startedAt} -> ${result.completedAt})`
  )
}

main().catch((error: unknown) => {
  console.error('sync:rosters failed:', error)
  process.exitCode = 1
})
