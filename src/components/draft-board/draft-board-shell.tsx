'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { toast } from 'sonner'

import {
  submitManualPick,
  undoManualPick,
} from '@/app/(admin)/leagues/[leagueId]/draft/actions'
import { detectPositionalRuns } from '@/services/bpa/runs'
import type { PositionTierSummary } from '@/services/bpa/tiers'
import type {
  ConnectedLeague,
  DraftablePlayer,
  DraftBoardLeagueContext,
  DraftBoardPlayer,
  LeagueRoster,
} from '@/services/draft-board'
import type { RecordedPick } from '@/services/draft-picks'
import type { DraftSessionState } from '@/services/draft-sessions'
import type { DraftOrderMeta } from '@/services/sleeper/draft-state'

import BpaRecommendationsPanel from './bpa-recommendations-panel'
import DraftBoardHeader from './draft-board-header'
import DraftQueuePanel from './draft-queue-panel'
import {
  getQueueServerSnapshot,
  getQueueSnapshot,
  moveInQueue,
  pruneDraftedFromQueue,
  removeFromQueue,
  selectAutoPickCandidate,
  setLeagueQueue,
  subscribeQueue,
  toggleQueue,
} from './draft-queue'
import LiveDraftStrip from './live-draft-strip'
import DraftPollTicker, { type DraftPollTickReport } from './draft-poll-ticker'
import {
  computeNextPickNumber,
  mergePicksIntoPlayers,
  picksFingerprint,
  projectOnClock,
} from './live-picks'
import {
  applyTickReport,
  INITIAL_POLL_HEALTH,
  type LivePollHealth,
} from './live-status'
import PlayerBoard from './player-board'
import RecentPicksFeed from './recent-picks-feed'
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
 * Local dwell before auto-pick fires while Nick sits on the clock with the tab
 * focused — a proxy for "the clock is expiring" (this tool never ingests the
 * real Sleeper clock; on-clock is a display-only projection). A hidden tab
 * ("away") fires immediately instead. Declared wiki silence on the trigger
 * mechanism — a conservative local constant, tunable.
 */
const AUTO_PICK_DWELL_MS = 12_000

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

  // Top-tier depth lifted from the BPA panel's own fetch (positional-run item 3
  // — Nick's Clarify: pair the run flag with the tier counter to convey whether
  // a run is draining the best available tier). The SAME context.tiers the panel
  // already computes — no second tier compute here; null until it first lands
  // and whenever the panel is unmounted (sidebar hidden below `lg`).
  const [panelTiers, setPanelTiers] = useState<Record<
    string,
    PositionTierSummary
  > | null>(null)
  const handleTiers = useCallback(
    (tiers: Record<string, PositionTierSummary> | null) => {
      setPanelTiers(tiers)
    },
    []
  )

  // "My team" roster — lifted here from the BPA panel (draft-queue sub-section,
  // Nick's Clarify) so ONE picker feeds both the panel's need signal and the
  // roster-aware auto-pick caps. No persisted marker; re-pick each session.
  const [selfRosterId, setSelfRosterId] = useState<number | null>(null)

  // The user-ordered draft queue (item 1) — client-side, per league, read
  // through an external store (localStorage-backed) so the load is hydration-
  // safe without a setState-in-effect: the server/hydration snapshot is empty,
  // the client adopts the stored queue immediately after. Every mutation routes
  // through the ONE writer, setLeagueQueue.
  const subscribeToQueue = useCallback(
    (onChange: () => void) => subscribeQueue(context.leagueId, onChange),
    [context.leagueId]
  )
  const readQueue = useCallback(
    () => getQueueSnapshot(context.leagueId),
    [context.leagueId]
  )
  const queue = useSyncExternalStore(
    subscribeToQueue,
    readQueue,
    getQueueServerSnapshot
  )

  // Auto-pick arm toggle (item 3) — off by default; only fires while armed AND
  // a self roster is set AND the draft is live.
  const [autoPickArmed, setAutoPickArmed] = useState(false)

  // Queue mutations read the live store snapshot (closure-safe against rapid
  // clicks) and write through the one path; the store notifies the subscription.
  const handleToggleQueue = useCallback(
    (playerId: string) =>
      setLeagueQueue(
        context.leagueId,
        toggleQueue(getQueueSnapshot(context.leagueId), playerId)
      ),
    [context.leagueId]
  )
  const handleRemoveFromQueue = useCallback(
    (playerId: string) =>
      setLeagueQueue(
        context.leagueId,
        removeFromQueue(getQueueSnapshot(context.leagueId), playerId)
      ),
    [context.leagueId]
  )
  const handleMoveInQueue = useCallback(
    (playerId: string, direction: 'up' | 'down') =>
      setLeagueQueue(
        context.leagueId,
        moveInQueue(getQueueSnapshot(context.leagueId), playerId, direction)
      ),
    [context.leagueId]
  )

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
    async (player: DraftablePlayer, nativeRosterId: number) => {
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

  // Undo the latest manual pick (UI extensions item 4 — the feed's Undo
  // button, shell-owned like every pick write). The snapshot heals locally on
  // success; the next poll tick would self-heal it anyway (full-snapshot rule).
  const [undoInFlight, setUndoInFlight] = useState(false)
  const handleUndo = useCallback(async () => {
    setUndoInFlight(true)
    try {
      const result = await undoManualPick(context.leagueId)
      if (result.outcome === 'undone') {
        const name =
          result.pick.playerFullName ?? `Player ${result.pick.sleeperPlayerId}`
        setLivePicks((previous) =>
          previous.filter((pick) => pick.pickNumber !== result.pick.pickNumber)
        )
        toast(`Undid pick ${result.pick.pickNumber} — ${name} is available again.`)
      } else if (result.outcome === 'no_manual_picks') {
        toast('No manual picks left to undo.')
      } else if (result.outcome === 'validation_error') {
        toast(`Could not undo: ${result.message}`)
      } else {
        toast('Not authorized — sign in again to undo.')
      }
    } catch {
      toast('Undo failed — check the connection and try again.')
    } finally {
      setUndoInFlight(false)
    }
  }, [context.leagueId])

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
  // Positional-run detection (item 3) — the ONE run-detection source: the pure
  // detectPositionalRuns over the confirmed snapshot, recomputed as picks land
  // (an undo drops its row from the next call's window). Not routed through the
  // recommendations query — run detection stays decoupled from the value path
  // (item 4). Confirmed picks only, deliberately: a pending optimistic pick has
  // no catalog position and isn't yet a market fact.
  const runBoard = useMemo(
    () =>
      detectPositionalRuns(
        livePicks.map((pick) => ({
          pickNumber: pick.pickNumber,
          position: pick.playerPosition,
        }))
      ),
    [livePicks]
  )

  // Honest absence: no known league size means no derivable round, and no
  // rosters means no pick target — the Draft action simply doesn't render.
  const draftEnabled =
    session.isDraftActive && context.leagueSize !== null && rosters.length > 0

  // Catalog lookup for queued ids (name/position) — the base pool carries both.
  const playerIndex = useMemo(() => {
    const index = new Map<string, DraftBoardPlayer>()
    for (const player of players) index.set(player.sleeperPlayerId, player)
    return index
  }, [players])
  const queuedIds = useMemo(() => new Set(queue), [queue])
  // Still-draftable ids from the ONE client merge (item 4 — queue/auto-pick
  // read the same merged snapshot every other region reads, never a second
  // availability source): available, i.e. not rostered/drafted/pending.
  const availableIds = useMemo(() => {
    const ids = new Set<string>()
    for (const player of mergedPlayers) {
      if (player.availability === 'available') ids.add(player.sleeperPlayerId)
    }
    return ids
  }, [mergedPlayers])
  // My roster's drafted positions so far (confirmed picks only) — the roster
  // shape the auto-pick caps evaluate against.
  const selfRosterPositions = useMemo(() => {
    if (selfRosterId === null) return []
    return livePicks
      .filter(
        (pick) =>
          pick.nativeRosterId === selfRosterId && pick.playerPosition !== null
      )
      .map((pick) => pick.playerPosition as string)
  }, [livePicks, selfRosterId])

  // Item 2 — auto-remove drafted players from the queue and promote the next.
  // The confirmed snapshot (livePicks) is the ONE source; a queued player
  // drafted by ANY path (manual, Sleeper poll, our own auto-pick) drops off and
  // the rest slide up. Silent on the first pass (players already off the board
  // when the queue loaded), a brief toast on every pick after that.
  const draftedIds = useMemo(
    () => new Set(livePicks.map((pick) => pick.sleeperPlayerId)),
    [livePicks]
  )
  const prunePrimedRef = useRef(false)
  useEffect(() => {
    const { queue: kept, removed } = pruneDraftedFromQueue(queue, (id) =>
      draftedIds.has(id)
    )
    if (removed.length === 0) return
    if (prunePrimedRef.current) {
      for (const id of removed) {
        const name = playerIndex.get(id)?.fullName ?? `Player ${id}`
        toast(`${name} was drafted — removed from your queue.`)
      }
    }
    // setLeagueQueue notifies the external store (re-render via
    // useSyncExternalStore) — NOT a React setState, so no cascading-render lint
    // and no second queue source.
    setLeagueQueue(context.leagueId, kept)
  }, [draftedIds, queue, playerIndex, context.leagueId])
  useEffect(() => {
    prunePrimedRef.current = true
  }, [])

  // Item 3 — roster-construction-aware auto-pick. Whether it's my pick right
  // now, projected from the draft order (display-only projection; first-write-
  // wins is the real arbiter, so acting on it can never desync a live Sleeper
  // draft — a poller-won pick makes our attempt conflict and roll back).
  const onClockMine = useMemo(() => {
    if (selfRosterId === null) return false
    const projection = projectOnClock(nextPickNumber, draftOrder)
    return projection.kind === 'team' && projection.nativeRosterId === selfRosterId
  }, [selfRosterId, nextPickNumber, draftOrder])

  // One auto-pick attempt per pick number (never a retry loop): walk the queue
  // with the roster-aware skip, then draft through the SAME handleDraft →
  // recordManualPick path (source='manual', undoable, never a Sleeper write —
  // build-file mandate).
  const autoPickAttemptRef = useRef<number | null>(null)
  const fireAutoPick = useCallback(() => {
    if (selfRosterId === null) return
    if (autoPickAttemptRef.current === nextPickNumber) return
    const selection = selectAutoPickCandidate({
      queue,
      isDraftable: (id) => availableIds.has(id) && !pendingPlayerIds.has(id),
      positionOf: (id) => playerIndex.get(id)?.position ?? null,
      rosterPositions: selfRosterPositions,
      layout: context.slotLayout,
    })
    if (selection === null) return
    const player = playerIndex.get(selection.candidateId)
    if (player === undefined) return
    autoPickAttemptRef.current = nextPickNumber
    const name = player.fullName ?? player.sleeperPlayerId
    toast(
      `Auto-pick: drafting ${name}` +
        (selection.overCapFallThrough
          ? ' (roster caps relaxed — nothing else eligible in the queue).'
          : '.')
    )
    void handleDraft(player, selfRosterId)
  }, [
    selfRosterId,
    nextPickNumber,
    queue,
    availableIds,
    pendingPlayerIds,
    playerIndex,
    selfRosterPositions,
    context.slotLayout,
    handleDraft,
  ])

  // Fire when armed + on the clock + away: a hidden tab fires immediately,
  // otherwise a dwell timer stands in for the clock winding down, with a
  // visibility change to hidden firing early. Re-arms per pick via the attempt
  // ref, so advancing to the next pick allows a fresh attempt.
  useEffect(() => {
    if (!autoPickArmed || !draftEnabled || !onClockMine) return
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      fireAutoPick()
      return
    }
    const timer = setTimeout(fireAutoPick, AUTO_PICK_DWELL_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') fireAutoPick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [autoPickArmed, draftEnabled, onClockMine, fireAutoPick])

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
            runBoard={runBoard}
            runTiers={panelTiers}
            queuedIds={queuedIds}
            onToggleQueue={handleToggleQueue}
          />
        </section>
        <aside
          aria-label="Roster panel"
          className="hidden w-80 shrink-0 flex-col border-l lg:flex"
        >
          <BpaRecommendationsPanel
            leagueId={context.leagueId}
            livePicks={livePicks}
            rosters={rosters}
            draftEnabled={draftEnabled}
            pendingPlayerIds={pendingPlayerIds}
            onDraft={handleDraft}
            onTiers={handleTiers}
            selfRosterId={selfRosterId}
            onSelfRosterIdChange={setSelfRosterId}
            queuedIds={queuedIds}
            onToggleQueue={handleToggleQueue}
          />
          <DraftQueuePanel
            queue={queue}
            playerIndex={playerIndex}
            autoPickArmed={autoPickArmed}
            onToggleArm={() => setAutoPickArmed((armed) => !armed)}
            selfRosterChosen={selfRosterId !== null}
            draftEnabled={draftEnabled}
            onRemove={handleRemoveFromQueue}
            onMove={handleMoveInQueue}
          />
          <div className="min-h-0 flex-1 p-4">
            <RosterPanel
              players={mergedPlayers}
              context={context}
              livePicks={livePicks}
              rosters={rosters}
            />
          </div>
          <RecentPicksFeed
            picks={livePicks}
            rosters={rosters}
            session={session}
            undoInFlight={undoInFlight}
            onUndo={handleUndo}
          />
        </aside>
      </div>
    </div>
  )
}
