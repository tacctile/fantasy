/**
 * Manual runner for the Sleeper player-catalog sync (Wave 2).
 *
 * Usage: `npm run sync:players` — loads env from `.env.local` via
 * `--env-file`. Per sleeper-api guidance the catalog is fetched at most once
 * per day; the Wave 2 cron route will invoke the same service function on a
 * daily schedule, with this runner remaining for one-off manual syncs.
 */
import { createClient } from '@/lib/supabase/admin'
import { syncPlayersCatalog } from '@/services/sleeper/players-catalog'

async function main(): Promise<void> {
  const result = await syncPlayersCatalog(createClient())
  console.log(
    `Sleeper player catalog synced: ${result.fetchedCount} fetched, ` +
      `${result.upsertedCount} upserted, ${result.markedInactiveCount} marked inactive ` +
      `(${result.startedAt} -> ${result.completedAt})`
  )
}

main().catch((error: unknown) => {
  console.error('sync:players failed:', error)
  process.exitCode = 1
})
