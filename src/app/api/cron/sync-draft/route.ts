import { NextResponse } from "next/server"

import { requireCronSecret } from "@/app/api/cron/auth"
import { createClient } from "@/lib/supabase/admin"
import { syncLeagueDraftState } from "@/services/sleeper/draft-state"
import { discoverConnectedSleeperLeagueIds } from "@/services/sleeper/sync-orchestrator"
import { recordSyncRunSafely } from "@/services/sync-runs"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * Active-draft polling path (Wave 2 cron sub-section): draft-state sync only,
 * for every connected Sleeper league, with per-league failure isolation and
 * one sync_runs row per league. Deliberately has NO vercel.json schedule
 * entry — Wave 2 wires the mechanism; Wave 3b decides the live-draft polling
 * cadence and trigger once the draft board consumes it (Nick's 2026-07-22
 * Clarify decision). First-write-wins semantics live in the draft-state
 * service, so repeated invocations never rewrite recorded picks.
 */
export async function GET(request: Request) {
  const rejection = requireCronSecret(request)
  if (rejection !== null) return rejection

  try {
    const db = createClient()
    const leagueIds = await discoverConnectedSleeperLeagueIds(db)

    let okCount = 0
    let failedCount = 0
    let picksWritten = 0
    for (const nativeLeagueId of leagueIds) {
      const sliceStartedAt = new Date().toISOString()
      try {
        const result = await syncLeagueDraftState(db, nativeLeagueId)
        okCount += 1
        picksWritten += result.picksWritten
        await recordSyncRunSafely(db, {
          source: "draft_poll",
          platform: "sleeper",
          leagueId: result.leagueUuid,
          status: "success",
          startedAt: result.startedAt,
          completedAt: result.completedAt,
          counts: {
            picks_fetched: result.picksFetched,
            picks_written: result.picksWritten,
            picks_already_recorded: result.picksAlreadyRecorded,
          },
        })
      } catch (error) {
        failedCount += 1
        console.error(`cron/sync-draft: FAIL ${nativeLeagueId} —`, error)
        await recordSyncRunSafely(db, {
          source: "draft_poll",
          platform: "sleeper",
          leagueId: null,
          status: "failure",
          startedAt: sliceStartedAt,
          completedAt: new Date().toISOString(),
          errorSummary:
            `league ${nativeLeagueId}: ` +
            (error instanceof Error ? error.message : String(error)),
        })
      }
    }
    console.log(
      `cron/sync-draft: ${okCount} ok, ${failedCount} failed, ${picksWritten} new picks`
    )

    const body = { ok: failedCount === 0, leagueCount: leagueIds.length, okCount, failedCount, picksWritten }
    return NextResponse.json(body, { status: body.ok ? 200 : 500 })
  } catch (error) {
    console.error("cron/sync-draft failed:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
