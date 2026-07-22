import { NextResponse } from "next/server"

import { requireCronSecret } from "@/app/api/cron/auth"
import { createClient } from "@/lib/supabase/admin"
import { runTrackedAdpIngestion } from "@/services/adp/ingestion"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * On-demand ADP ingestion (Wave 3a): secret-gated like every cron route,
 * but deliberately carries NO vercel.json schedule entry — both Hobby cron
 * slots are taken, so scheduled ADP ingestion piggybacks on the daily
 * sync-leagues run instead (Nick's 2026-07-22 Clarify decision). This route
 * exists for authenticated on-demand refreshes and as the mount point if a
 * dedicated schedule slot ever opens (e.g. a season-start Pro upgrade).
 */
export async function GET(request: Request) {
  const rejection = requireCronSecret(request)
  if (rejection !== null) return rejection

  const outcome = await runTrackedAdpIngestion(createClient())
  if (!outcome.ok) {
    console.error("cron/sync-adp failed:", outcome.error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const { result } = outcome
  console.log(
    `cron/sync-adp: season ${result.seasonYear} — ${result.upsertedRowCount} rows upserted ` +
      `across formats [${result.formatsSeen.join(", ")}], ${result.staleRowsDeletedCount} stale removed, ` +
      `${result.unmappedPlayerCount} unmapped (${result.startedAt} -> ${result.completedAt})`
  )
  return NextResponse.json({
    ok: true,
    seasonYear: result.seasonYear,
    fetchedRecordCount: result.fetchedRecordCount,
    upsertedRowCount: result.upsertedRowCount,
    staleRowsDeletedCount: result.staleRowsDeletedCount,
    unmappedPlayerCount: result.unmappedPlayerCount,
  })
}
