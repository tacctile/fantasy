import { NextResponse } from "next/server"

import { requireCronSecret } from "@/app/api/cron/auth"
import { createClient } from "@/lib/supabase/admin"
import { syncLeagueDraftState } from "@/services/sleeper/draft-state"
import { discoverConnectedSleeperLeagueIds } from "@/services/sleeper/sync-orchestrator"
import { recordSyncRunSafely } from "@/services/sync-runs"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * Manual/fallback draft-state sync path (Wave 2 cron sub-section): every
 * connected Sleeper league, per-league failure isolation, one sync_runs row
 * per league. Deliberately has NO vercel.json schedule entry — Wave 3b's
 * orchestration decision (Nick, 2026-07-22) made live-draft polling
 * client-driven: the open admin board triggers `pollActiveDraft` every 5s
 * while `draft_sessions.is_draft_active` is true (Hobby crons are daily-only,
 * so a scheduled elevated cadence was never possible). Normal cadence is the
 * daily league-state cron's orchestrator chain; this route remains the
 * Bearer-gated manual sweep. First-write-wins semantics live in the
 * draft-state service, so repeated invocations never rewrite recorded picks.
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
