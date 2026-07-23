/**
 * Manual runner for ADP ingestion (Wave 3a).
 *
 * Usage: `npm run sync:adp [-- <season_year>]` — loads env from `.env.local`
 * via `--env-file`. With no argument the season derives from `/state/nfl`'s
 * `league_season`. The cron route invokes the same service function; this
 * runner exists for on-demand local ingestion independent of it.
 */
import { createClient } from '@/lib/supabase/admin'
import { syncAdpRankings } from '@/services/adp/ingestion'

async function main(): Promise<void> {
  const yearArg = process.argv[2]
  let seasonYear: number | undefined
  if (yearArg !== undefined) {
    seasonYear = Number.parseInt(yearArg, 10)
    if (!Number.isInteger(seasonYear)) {
      throw new Error(`invalid season year argument: ${yearArg}`)
    }
  }

  const result = await syncAdpRankings(createClient(), { seasonYear })
  console.log(
    `ADP ingested for ${result.seasonYear} (source: ${result.adpSource}): ` +
      `${result.fetchedRecordCount} records fetched, ${result.recordsWithAdpCount} with ADP, ` +
      `${result.extractedEntryCount} entries across formats [${result.formatsSeen.join(', ')}], ` +
      `${result.upsertedRowCount} rows upserted, ${result.staleRowsDeletedCount} stale removed, ` +
      `${result.sentinelSkippedCount} sentinel-skipped, ${result.implausibleValueCount} implausible-skipped, ` +
      `${result.unmappedPlayerCount} unmapped players` +
      (result.unmappedPlayerCount > 0 ? ` (${result.unmappedPlayerIds.join(', ')})` : '') +
      `; projections: ${result.projectionRowsPersistedCount} rows persisted, ` +
      `${result.projectionStaleRowsDeletedCount} stale removed` +
      ` (${result.startedAt} -> ${result.completedAt})`
  )
}

main().catch((error: unknown) => {
  console.error('sync:adp failed:', error)
  process.exitCode = 1
})
