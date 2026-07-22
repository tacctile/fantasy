/**
 * Manual runner for the Sleeper league-metadata sync (Wave 2).
 *
 * Usage: `npm run sync:league -- <sleeper_league_id>` — loads env from
 * `.env.local` via `--env-file`. The native league ID is passed per run; the
 * Wave 2 per-league orchestrator will later iterate rows already in
 * `leagues`, with this runner remaining for connecting a league manually.
 */
import { createClient } from '@/lib/supabase/admin'
import { syncLeagueConfig } from '@/services/sleeper/league-config'

async function main(): Promise<void> {
  // League IDs are opaque strings — required non-empty, never format-checked.
  const nativeLeagueId = process.argv[2]
  if (!nativeLeagueId) {
    console.error('Usage: npm run sync:league -- <sleeper_league_id>')
    process.exitCode = 1
    return
  }

  const result = await syncLeagueConfig(createClient(), nativeLeagueId)
  const chain =
    result.previousChainResolved === null
      ? 'no previous_league_id'
      : result.previousChainResolved
        ? 'previous season resolved'
        : 'previous season not held (chain column null)'
  console.log(
    `Sleeper league synced: "${result.leagueName}" (${result.nativeLeagueId}, ` +
      `season ${result.seasonYear}, status ${result.leagueStatus}) -> ${result.leagueUuid}; ` +
      `${chain}; derived ${JSON.stringify(result.derivedConfig)} ` +
      `(${result.startedAt} -> ${result.completedAt})`
  )
}

main().catch((error: unknown) => {
  console.error('sync:league failed:', error)
  process.exitCode = 1
})
