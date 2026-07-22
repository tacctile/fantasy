import { NextResponse } from "next/server"

import { requireCronSecret } from "@/app/api/cron/auth"
import { createClient } from "@/lib/supabase/admin"
import { runTrackedAdpIngestion } from "@/services/adp/ingestion"
import { getNflState, resolveMatchupSyncWeek } from "@/services/sleeper/nfl-state"
import { syncAllSleeperLeagues } from "@/services/sleeper/sync-orchestrator"
import type { LeagueSyncOutcome } from "@/services/sleeper/sync-orchestrator"
import { recordSyncRunSafely } from "@/services/sync-runs"

export const dynamic = "force-dynamic"
export const maxDuration = 300

/**
 * Scheduled league-state sync (Wave 2 cron sub-section): config + rosters/
 * standings + draft for every connected Sleeper league, plus only the
 * current NFL week's matchups (Nick's 2026-07-22 Clarify decision) — the
 * week resolved from /state/nfl, never from date arithmetic. Outside the
 * regular season there is no scoreable week, so the matchups step is skipped
 * entirely; the full-season sweep remains the manual `npm run sync:sleeper`.
 * Per-league failures are isolated by the orchestrator, recorded to
 * sync_runs (one row per league), and server-logged; the run reports failure
 * status so a bad invocation is visible in the cron dashboard.
 */
export async function GET(request: Request) {
  const rejection = requireCronSecret(request)
  if (rejection !== null) return rejection

  try {
    const db = createClient()
    const state = await getNflState()
    const matchupWeek = resolveMatchupSyncWeek(state)

    const run = await syncAllSleeperLeagues(db, {
      week: matchupWeek ?? undefined,
      skipMatchups: matchupWeek === null,
    })

    // Native-ID → uuid map so failed slices (whose outcome carries no uuid)
    // still attribute to their league row where one exists.
    const { data: leagueRows } = await db
      .from("leagues")
      .select("native_league_id, platform_league_uuid")
      .eq("platform", "sleeper")
    const uuidByNativeId = new Map(
      (leagueRows ?? []).map((row) => [row.native_league_id, row.platform_league_uuid])
    )

    for (const outcome of run.leagues) {
      if (!outcome.ok) {
        console.error(
          `cron/sync-leagues: FAIL ${outcome.nativeLeagueId} at step ${outcome.failedStep} — ` +
            `${outcome.error} (skipped: ${outcome.skippedSteps.join(", ") || "none"})`
        )
      }
      await recordSyncRunSafely(db, {
        source: "league_state",
        platform: "sleeper",
        leagueId: outcome.config?.leagueUuid ?? uuidByNativeId.get(outcome.nativeLeagueId) ?? null,
        status: outcome.ok ? "success" : "failure",
        startedAt: outcome.config?.startedAt ?? run.startedAt,
        completedAt: lastStepCompletedAt(outcome) ?? run.completedAt,
        counts: outcomeCounts(outcome),
        errorSummary: outcome.ok
          ? null
          : `league ${outcome.nativeLeagueId}, step ${outcome.failedStep}: ${outcome.error}`,
      })
    }
    console.log(
      `cron/sync-leagues: ${run.okCount} ok, ${run.failedCount} failed; ` +
        `season_type=${state.season_type}, matchup week ${matchupWeek ?? "skipped"} ` +
        `(${run.startedAt} -> ${run.completedAt})`
    )

    // ADP piggyback (Wave 3a, Nick's 2026-07-22 Clarify decision): both
    // Hobby cron slots are taken, so the daily league-state run also
    // triggers ADP ingestion — in its own containment boundary with its own
    // sync_runs row. Its failure is logged and reported in the body but
    // never affects this run's league-state outcome or status code, and the
    // reverse ordering (ADP last) means it can never delay league sync.
    const adp = await runTrackedAdpIngestion(db)
    if (adp.ok) {
      console.log(
        `cron/sync-leagues: ADP piggyback ok — season ${adp.result.seasonYear}, ` +
          `${adp.result.upsertedRowCount} rows upserted, ${adp.result.staleRowsDeletedCount} stale removed`
      )
    } else {
      console.error(
        `cron/sync-leagues: ADP piggyback failed (league-state outcome unaffected): ${adp.error}`
      )
    }

    const body = {
      ok: run.failedCount === 0,
      leagueCount: run.leagues.length,
      okCount: run.okCount,
      failedCount: run.failedCount,
      seasonType: state.season_type ?? null,
      matchupWeek,
      adpOk: adp.ok,
    }
    return NextResponse.json(body, { status: body.ok ? 200 : 500 })
  } catch (error) {
    console.error("cron/sync-leagues failed:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

/** The league slice's real end: the last step that actually completed. */
function lastStepCompletedAt(outcome: LeagueSyncOutcome): string | null {
  return (
    outcome.draft?.completedAt ??
    outcome.matchups?.completedAt ??
    outcome.rosters?.completedAt ??
    outcome.config?.completedAt ??
    null
  )
}

/** Flat per-step record counts; keys absent for steps that didn't run. */
function outcomeCounts(outcome: LeagueSyncOutcome): Record<string, number> | null {
  const counts: Record<string, number> = {}
  if (outcome.rosters !== undefined) {
    counts.rosters = outcome.rosters.rosterCount
    counts.roster_memberships = outcome.rosters.membershipCount
    counts.standings = outcome.rosters.standingsCount
  }
  if (outcome.matchups !== undefined) {
    counts.matchup_rows = outcome.matchups.matchupRowCount
    counts.player_score_rows = outcome.matchups.playerScoreRowCount
  }
  if (outcome.draft !== undefined) {
    counts.picks_written = outcome.draft.picksWritten
    counts.picks_already_recorded = outcome.draft.picksAlreadyRecorded
  }
  return Object.keys(counts).length > 0 ? counts : null
}
