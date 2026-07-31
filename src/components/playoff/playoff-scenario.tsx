'use client'

import { useMemo, useState } from 'react'

import { teamLabel } from '@/components/score-trends/team-label'
import { cn } from '@/lib/utils'
import {
  applyHypotheticalResults,
  computePlayoffPicture,
  type PlayoffPictureData,
  type RemainingGame,
} from '@/services/playoff-picture'

import PlayoffTable from './playoff-table'

interface PlayoffScenarioProps {
  /** The real picture, as computed on the server. */
  data: PlayoffPictureData
  basePath: string
  selectedRosterId: number | null
}

/**
 * The what-if layer (Wave 5 — Playoff picture, item 5).
 *
 * Each remaining game gets a three-state control — undecided, this side wins,
 * that side wins — and the table above recomputes the moment one is set.
 *
 * THE RECOMPUTE IS THE SAME FUNCTION, NOT A CLIENT COPY. It calls
 * `applyHypotheticalResults` and then `computePlayoffPicture` — the identical
 * deterministic bounding the server ran, imported directly. `playoff-picture.ts`
 * carries only type-level imports, so it runs in the browser unchanged and this
 * section still touches no database from the client. There is exactly one status
 * function in this codebase, which is what makes the build file's "no new
 * probabilistic logic" requirement structurally true rather than merely
 * observed: a probability could not enter here without entering the real
 * picture too.
 *
 * The rosters and the standings snapshot are rebuilt from `data.teams` rather
 * than shipped a second time — every field either is already on the wire.
 *
 * WHAT A HYPOTHETICAL DOES NOT DO: move points-for. `applyHypotheticalResults`
 * marks its rows, and the calculation keeps them out of the points total, so a
 * seed decided on the points tiebreaker still turns on the real season. That is
 * disclosed on the surface rather than left for a reader to infer from a column
 * that did not move.
 */
export default function PlayoffScenario({
  data,
  basePath,
  selectedRosterId,
}: PlayoffScenarioProps) {
  const [winners, setWinners] = useState<ReadonlyMap<string, number>>(
    () => new Map()
  )

  const rosterNames = useMemo(
    () =>
      new Map(
        data.teams.map((team) => [
          team.nativeRosterId,
          {
            teamName: team.teamName,
            ownerDisplayName: team.ownerDisplayName,
          },
        ])
      ),
    [data.teams]
  )

  const standingsWins = useMemo(
    () =>
      new Map(
        data.teams
          .filter((team) => team.standingsWins !== null)
          .map((team) => [team.nativeRosterId, team.standingsWins as number])
      ),
    [data.teams]
  )

  const effective = useMemo(() => {
    if (winners.size === 0) return data
    return computePlayoffPicture(
      applyHypotheticalResults(data.scheduleRows, winners),
      rosterNames,
      data.rules,
      standingsWins
    )
  }, [data, winners, rosterNames, standingsWins])

  // Which teams the hypothetical actually moved. Marked on the table so a
  // what-if verdict can never be mistaken for a settled one — the single
  // biggest risk this interactive layer introduces.
  const changedRosterIds = useMemo(() => {
    if (winners.size === 0) return new Set<number>()
    const before = new Map(
      data.teams.map((team) => [team.nativeRosterId, team.status])
    )
    return new Set(
      effective.teams
        .filter((team) => before.get(team.nativeRosterId) !== team.status)
        .map((team) => team.nativeRosterId)
    )
  }, [data.teams, effective.teams, winners])

  const label = (rosterId: number): string => {
    const team = data.teams.find((row) => row.nativeRosterId === rosterId)
    return team === undefined ? `Roster ${rosterId}` : teamLabel(team)
  }

  function setWinner(game: RemainingGame, rosterId: number | null): void {
    setWinners((current) => {
      const next = new Map(current)
      if (rosterId === null) next.delete(game.key)
      else next.set(game.key, rosterId)
      return next
    })
  }

  const byWeek = new Map<number, RemainingGame[]>()
  for (const game of data.remainingGames) {
    const week = byWeek.get(game.week)
    if (week === undefined) byWeek.set(game.week, [game])
    else week.push(game)
  }

  const active = winners.size > 0

  return (
    <div className="flex flex-col gap-6">
      {active && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5">
          <p className="text-xs text-warning">
            Hypothetical view —{' '}
            <span className="tabular-nums">{winners.size}</span> of{' '}
            <span className="tabular-nums">{data.remainingGames.length}</span>{' '}
            remaining {data.remainingGames.length === 1 ? 'game' : 'games'} set
            by hand. Marked rows changed status. Points for is unchanged by a
            hypothetical result, so a tiebreaker that turns on points is still
            decided by the real season.
          </p>
          <button
            type="button"
            onClick={() => setWinners(new Map())}
            className="ml-auto rounded-md border border-warning/40 px-2.5 py-1 text-xs font-medium text-warning transition-colors hover:bg-warning/15"
          >
            Reset to actual
          </button>
        </div>
      )}

      <PlayoffTable
        data={effective}
        basePath={basePath}
        selectedRosterId={selectedRosterId}
        changedRosterIds={changedRosterIds}
      />

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold tracking-tight">
            Remaining games
          </h2>
          <p className="text-xs text-muted-foreground">
            Pick a winner to see the table above recompute
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-card px-3 py-3">
          {[...byWeek.entries()].map(([week, games]) => (
            <div key={week} className="flex flex-col gap-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Week <span className="tabular-nums">{week}</span>
              </p>
              <ul className="flex flex-col gap-1.5">
                {games.map((game) => {
                  const chosen = winners.get(game.key)
                  return (
                    <li
                      key={game.key}
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      <SideButton
                        label={label(game.rosterIdA)}
                        selected={chosen === game.rosterIdA}
                        onClick={() =>
                          setWinner(
                            game,
                            chosen === game.rosterIdA ? null : game.rosterIdA
                          )
                        }
                      />
                      <span className="text-xs text-muted-foreground">v</span>
                      <SideButton
                        label={label(game.rosterIdB)}
                        selected={chosen === game.rosterIdB}
                        onClick={() =>
                          setWinner(
                            game,
                            chosen === game.rosterIdB ? null : game.rosterIdB
                          )
                        }
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/**
 * One side of one remaining game. Pressing the selected side clears it, so the
 * control is genuinely three-state and a scenario can always be walked back
 * without resetting the whole board.
 */
function SideButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'max-w-52 truncate rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
        selected
          ? 'border-warning/40 bg-warning/15 text-warning'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {label}
    </button>
  )
}
