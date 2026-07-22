/**
 * Manual runner for the Sleeper matchups + player-scores sync (Wave 2).
 *
 * Usage: `npm run sync:matchups -- <sleeper_league_id> [week]` — loads env
 * from `.env.local` via `--env-file`. Omitting `week` sweeps the full season
 * (weeks 1–18, empty weeks skipped); passing one syncs that single week (the
 * in-season cadence). Requires the league to be connected first
 * (`npm run sync:league`).
 */
import { createClient } from '@/lib/supabase/admin'
import { syncLeagueMatchups } from '@/services/sleeper/league-matchups'

async function main(): Promise<void> {
  // League IDs are opaque strings — required non-empty, never format-checked.
  const nativeLeagueId = process.argv[2]
  if (!nativeLeagueId) {
    console.error('Usage: npm run sync:matchups -- <sleeper_league_id> [week]')
    process.exitCode = 1
    return
  }
  let week: number | undefined
  if (process.argv[3] !== undefined) {
    week = Number.parseInt(process.argv[3], 10)
    if (!Number.isInteger(week) || week < 1) {
      console.error('week must be a positive integer')
      process.exitCode = 1
      return
    }
  }

  const result = await syncLeagueMatchups(createClient(), nativeLeagueId, { week })
  const skipped =
    result.skippedMissingPlayerIds.length === 0
      ? 'no players skipped'
      : `SKIPPED ${result.skippedMissingPlayerIds.length} players missing from catalog: ${result.skippedMissingPlayerIds.join(', ')} — re-sync after the next daily catalog run`
  console.log(
    `Sleeper matchups synced for league ${nativeLeagueId} (season ${result.seasonYear}): ` +
      `weeks [${result.weeksSynced.join(',')}] synced, [${result.weeksEmpty.join(',')}] empty; ` +
      `${result.matchupRowCount} matchup rows, ${result.playerScoreRowCount} player-score rows, ` +
      `final=${result.markedFinal}; ${skipped}; ` +
      `${result.skippedNonNumericScores} non-numeric score entries skipped ` +
      `(${result.startedAt} -> ${result.completedAt})`
  )
}

main().catch((error: unknown) => {
  console.error('sync:matchups failed:', error)
  process.exitCode = 1
})
