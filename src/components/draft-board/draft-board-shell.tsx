'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { submitManualPick } from '@/app/(admin)/leagues/[leagueId]/draft/actions'
import type {
  ConnectedLeague,
  DraftBoardLeagueContext,
  DraftBoardPlayer,
  LeagueRoster,
} from '@/services/draft-board'
import type { RecordedPick } from '@/services/draft-picks'
import type { DraftSessionState } from '@/services/draft-sessions'
import type { DraftOrderMeta } from '@/services/sleeper/draft-state'

import DraftBoardHeader from './draft-board-header'
import LiveDraftStrip from './live-draft-strip'
import DraftPollTicker, { type DraftPollTickReport } from './draft-poll-ticker'
import {
  computeNextPickNumber,
  mergePicksIntoPlayers,
  picksFingerprint,
} from './live-picks'
import {
  applyTickReport,
  INITIAL_POLL_HEALTH,
  type LivePollHealth,
} from './live-status'
import PlayerBoard from './player-board'
import RosterPanel from './roster-panel'

interface DraftBoardShellProps {
  context: DraftBoardLeagueContext
  players: DraftBoardPlayer[]
  leagues: ConnectedLeague[]
  session: DraftSessionState
  /** Server-rendered draft_state snapshot — live state until the first tick. */
  initialPicks: RecordedPick[]
  /** Manual-pick target list (per-click roster picker, Nick-signed). */
  rosters: LeagueRoster[]
}

/** An optimistic manual pick awaiting its server response. */
type PendingPick = {
  sleeperPlayerId: string
  pickNumber: number
}

/**
 * Client shell for the admin draft board — tablet/PC-first per MASTER_CONTEXT
 * UX Architecture (mobile may be rough here; the spectator surface is the
 * mobile-first build, and it is a separate rendering path). Three regions:
 * header/toolbar, the player-list board (toolbar + sortable table), and the
 * detail/roster sidebar (its panel is the player-list sub-section's final
 * item).
 *
 * Live-pick custody (Wave 3b client-side live sync items 1–4): the shell owns
 * the league's current draft_state snapshot — seeded by the server render,
 * replaced by each executed poll tick the DraftPollTicker delivers — plus the
 * optimistic pending overlay for manual picks. A fingerprint bail-out keeps
 * identical snapshots from updating state at all (React skips the re-render
 * on same-reference state), and the merge overlay (live-picks.ts) recomputes
 * only when the snapshot, pending set, or pool genuinely changed. Both board
 * regions read the merged pool — one source of truth; the roster panel
 * additionally reads the confirmed snapshot directly for pick→team
 * attribution (UI extensions item 3 — the merge deliberately carries no
 * roster attribution; pending picks stay panel-invisible, Nick-signed).
 *
 * Optimistic flow (items 3–4): clicking Draft claims the next pick number
 * locally (pending → the row reads "Drafting…" and leaves the available set
 * immediately), then reconciles on the server response — accepted adopts the
 * confirmed row, conflict adopts the AUTHORITATIVE winning row (first-write-
 * wins; non-blocking toast, no retry loop), and every other outcome rolls the
 * row back to available with a toast. Pick numbers are computed from the
 * latest snapshot + pending overlay; the server's (league_id, pick_number)
 * constraint stays the real arbiter if a poll lands in the compute window.
 */
export default function DraftBoardShell({
  context,
  players,
  leagues,
  session,
  initialPicks,
  rosters,
}: DraftBoardShellProps) {
  const [livePicks, setLivePicks] = useState<RecordedPick[]>(initialPicks)
  const [pendingPicks, setPendingPicks] = useState<PendingPick[]>([])
  // Refs mirror both pick sets so rapid successive Draft clicks (inside one
  // render window) each claim a distinct pick number synchronously.
  const livePicksRef = useRef(livePicks)
  const pendingRef = useRef(pendingPicks)
  useEffect(() => {
    livePicksRef.current = livePicks
  }, [livePicks])

  const handlePicks = useCallback((picks: RecordedPick[]) => {
    setLivePicks((previous) =>
      picksFingerprint(previous) === picksFingerprint(picks) ? previous : picks
    )
  }, [])

  // Poll health for the toolbar status indicator (live sync item 5) —
  // aggregated here, rendered in the header. Reset when the session (re)arms
  // so a past session's failures never bleed into a new one — render-time
  // state adjustment, not an effect (react-hooks/set-state-in-effect).
  const [pollHealth, setPollHealth] =
    useState<LivePollHealth>(INITIAL_POLL_HEALTH)
  const handleStatus = useCallback((report: DraftPollTickReport) => {
    setPollHealth((previous) => applyTickReport(previous, report))
  }, [])
  const sessionEpoch = `${session.isDraftActive}:${session.activatedAt ?? ''}`
  const [healthEpoch, setHealthEpoch] = useState(sessionEpoch)
  if (healthEpoch !== sessionEpoch) {
    setHealthEpoch(sessionEpoch)
    setPollHealth(INITIAL_POLL_HEALTH)
  }

  // Selected draft's order metadata (UI extensions item 2) — delivered by
  // successful poll ticks; a stringify bail-out keeps identical payloads
  // (the common case, every 5s) from causing state updates.
  const [draftOrder, setDraftOrder] = useState<DraftOrderMeta | null>(null)
  const handleDraftOrder = useCallback((order: DraftOrderMeta | null) => {
    setDraftOrder((previous) =>
      JSON.stringify(previous) === JSON.stringify(order) ? previous : order
    )
  }, [])

  /** Adopt one authoritative draft_state row (accepted or conflict-winning)
   *  into the snapshot without waiting for the next poll tick. */
  const adoptPick = useCallback((pick: RecordedPick) => {
    setLivePicks((previous) =>
      previous.some((existing) => existing.pickNumber === pick.pickNumber)
        ? previous
        : [...previous, pick].sort((a, b) => a.pickNumber - b.pickNumber)
    )
  }, [])

  const updatePending = useCallback((next: PendingPick[]) => {
    pendingRef.current = next
    setPendingPicks(next)
  }, [])

  const handleDraft = useCallback(
    async (player: DraftBoardPlayer, nativeRosterId: number) => {
      // Draft actions only render with a known league size (no invented
      // round) and never for a player already pending.
      const leagueSize = context.leagueSize
      if (leagueSize === null) return
      if (
        pendingRef.current.some(
          (pending) => pending.sleeperPlayerId === player.sleeperPlayerId
        )
      ) {
        return
      }

      const pickNumber = computeNextPickNumber(
        livePicksRef.current,
        pendingRef.current.map((pending) => pending.pickNumber)
      )
      const round = Math.ceil(pickNumber / leagueSize)
      updatePending([
        ...pendingRef.current,
        { sleeperPlayerId: player.sleeperPlayerId, pickNumber },
      ])

      const playerName = player.fullName ?? player.sleeperPlayerId
      try {
        const result = await submitManualPick({
          leagueId: context.leagueId,
          pickNumber,
          round,
          sleeperPlayerId: player.sleeperPlayerId,
          nativeRosterId,
        })
        if (result.outcome === 'accepted') {
          adoptPick(result.pick)
        } else if (result.outcome === 'conflict') {
          // First-write-wins: adopt the authoritative row, no retry loop.
          adoptPick(result.existing)
          const winnerName =
            players.find(
              (candidate) =>
                candidate.sleeperPlayerId === result.existing.sleeperPlayerId
            )?.fullName ?? null
          toast(
            `Pick ${pickNumber} was already recorded` +
              `${winnerName === null ? '' : ` (${winnerName})`} — ` +
              `${playerName} was rolled back.`
          )
        } else if (result.outcome === 'validation_error') {
          toast(`Could not draft ${playerName}: ${result.message}`)
        } else {
          toast('Not authorized — sign in again to draft.')
        }
      } catch {
        toast(`Drafting ${playerName} failed — check the connection and try again.`)
      } finally {
        updatePending(
          pendingRef.current.filter(
            (pending) => pending.sleeperPlayerId !== player.sleeperPlayerId
          )
        )
      }
    },
    [adoptPick, context.leagueId, context.leagueSize, players, updatePending]
  )

  const pendingPlayerIds = useMemo(
    () => new Set(pendingPicks.map((pending) => pending.sleeperPlayerId)),
    [pendingPicks]
  )
  // The strip's current pick — the same number the next Draft click claims.
  const nextPickNumber = useMemo(
    () =>
      computeNextPickNumber(
        livePicks,
        pendingPicks.map((pending) => pending.pickNumber)
      ),
    [livePicks, pendingPicks]
  )
  const mergedPlayers = useMemo(
    () => mergePicksIntoPlayers(players, livePicks, pendingPlayerIds),
    [players, livePicks, pendingPlayerIds]
  )

  // Honest absence: no known league size means no derivable round, and no
  // rosters means no pick target — the Draft action simply doesn't render.
  const draftEnabled =
    session.isDraftActive && context.leagueSize !== null && rosters.length > 0

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <DraftPollTicker
        session={session}
        onPicks={handlePicks}
        onStatus={handleStatus}
        onDraftOrder={handleDraftOrder}
      />
      <DraftBoardHeader
        context={context}
        leagues={leagues}
        session={session}
        pollHealth={pollHealth}
      />
      <LiveDraftStrip
        session={session}
        nextPickNumber={nextPickNumber}
        leagueSize={context.leagueSize}
        draftOrder={draftOrder}
        rosters={rosters}
      />
      <div className="flex min-h-0 flex-1">
        <section aria-label="Player board" className="min-w-0 flex-1 p-4">
          <PlayerBoard
            players={mergedPlayers}
            context={context}
            draftEnabled={draftEnabled}
            rosters={rosters}
            onDraft={handleDraft}
          />
        </section>
        <aside
          aria-label="Roster panel"
          className="hidden w-80 shrink-0 border-l p-4 lg:block"
        >
          <RosterPanel
            players={mergedPlayers}
            context={context}
            livePicks={livePicks}
            rosters={rosters}
          />
        </aside>
      </div>
    </div>
  )
}
