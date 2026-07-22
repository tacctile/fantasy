import { NextResponse } from "next/server"

import { requireCronSecret } from "@/app/api/cron/auth"
import { createClient } from "@/lib/supabase/admin"
import { syncPlayersCatalog } from "@/services/sleeper/players-catalog"
import {
  finishSyncRun,
  hasRecentCatalogRun,
  recordSyncRunSafely,
  startSyncRun,
} from "@/services/sync-runs"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * Daily player-catalog refresh (Wave 2 cron sub-section): the single
 * centrally-scheduled caller of syncPlayersCatalog. The once-per-day Sleeper
 * players-dump rule is enforced twice over — by the vercel.json daily
 * schedule, and by the sync_runs guard here, which skips any invocation
 * (scheduled or manual) within 24h of a running/success catalog run and
 * fails CLOSED if the guard itself can't be read. Failure runs don't block a
 * retry (the rule's one sanctioned exception). Secret-gated; never publicly
 * invokable.
 */
export async function GET(request: Request) {
  const rejection = requireCronSecret(request)
  if (rejection !== null) return rejection

  const db = createClient()
  try {
    if (await hasRecentCatalogRun(db)) {
      const now = new Date().toISOString()
      await recordSyncRunSafely(db, {
        source: "players_catalog",
        platform: "sleeper",
        status: "skipped",
        startedAt: now,
        completedAt: now,
        errorSummary: "once-per-day guard: a catalog run already started within 24h",
      })
      console.log("cron/sync-players: skipped — catalog already ran within 24h")
      return NextResponse.json({ ok: true, skipped: true })
    }

    const runId = await startSyncRun(db, { source: "players_catalog", platform: "sleeper" })
    try {
      const result = await syncPlayersCatalog(db)
      await finishSyncRun(db, runId, {
        status: "success",
        completedAt: result.completedAt,
        counts: {
          fetched: result.fetchedCount,
          upserted: result.upsertedCount,
          marked_inactive: result.markedInactiveCount,
        },
      })
      console.log(
        `cron/sync-players: ${result.fetchedCount} fetched, ${result.upsertedCount} upserted, ` +
          `${result.markedInactiveCount} marked inactive (${result.startedAt} -> ${result.completedAt})`
      )
      return NextResponse.json({
        ok: true,
        skipped: false,
        fetchedCount: result.fetchedCount,
        upsertedCount: result.upsertedCount,
        markedInactiveCount: result.markedInactiveCount,
      })
    } catch (error) {
      await finishSyncRun(db, runId, {
        status: "failure",
        errorSummary: error instanceof Error ? error.message : String(error),
      }).catch((trackingError: unknown) => {
        console.error("cron/sync-players: failure-tracking write also failed:", trackingError)
      })
      throw error
    }
  } catch (error) {
    console.error("cron/sync-players failed:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
