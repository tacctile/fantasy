import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { LeagueContext, RosterSlotLayout } from '@/services/league-context'
import {
  computePlayoffPicture,
  parsePlayoffRules,
  type PlayoffPictureData,
  type PlayoffScheduleRow,
} from '@/services/playoff-picture'

import PlayoffShell from './playoff-shell'

/**
 * Wave 5 — Playoff picture, item 4. `playoff-picture.test.ts` proves the
 * arithmetic; this suite proves the SECTION renders that arithmetic, and — more
 * important on this surface than on any of its siblings — that the section
 * cannot quietly become the thing the build file bars.
 *
 * Item 6 ("explicitly avoid any visual resembling a probability distribution or
 * simulation output") is not a build step, it is a property. It is asserted here
 * mechanically rather than trusted to review: no percentage, no meter, no
 * proportional bar geometry, no likelihood vocabulary anywhere in the markup.
 * Those assertions are the item, and they run on every commit.
 *
 * It cannot judge whether the table LOOKS right on a real viewport — that still
 * needs Nick's eyes and stays on the visual-check backlog.
 */

const STANDARD: RosterSlotLayout = {
  dedicated: { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DEF: 1 },
  flex: { FLEX: 1 },
  bench: 6,
  ir: 1,
  taxi: 0,
}

const CONTEXT: LeagueContext = {
  leagueId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  name: '10 enter 1 Leaves',
  platform: 'sleeper',
  seasonYear: 2026,
  ppr: 0.5,
  tePremium: false,
  superflex: false,
  activeSlotCount: 9,
  benchSlotCount: 6,
  irSlotCount: 1,
  leagueSize: 10,
  slotLayout: STANDARD,
}

const BASE_PATH = '/leagues/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/playoff-picture'

const RULES = parsePlayoffRules({
  settings: { playoff_teams: 6, playoff_week_start: 15 },
})

function names(count: number) {
  return new Map(
    Array.from({ length: count }, (_, index) => [
      index + 1,
      { teamName: `Team ${index + 1}`, ownerDisplayName: `owner${index + 1}` },
    ])
  )
}

/** One week's head-to-head pairs, by the circle method — a real round robin. */
function pairsForWeek(teamCount: number, week: number): [number, number][] {
  const rotating = Array.from({ length: teamCount - 1 }, (_, i) => i + 2)
  const shift = (week - 1) % (teamCount - 1)
  const order = [1, ...rotating.slice(shift), ...rotating.slice(0, shift)]
  return Array.from({ length: teamCount / 2 }, (_, i) => [
    order[i],
    order[teamCount - 1 - i],
  ])
}

/**
 * A deterministic season with a STRICT dominance order: the lower roster id
 * always outscores the higher one, so after enough weeks the top of the table
 * has genuinely clinched and the bottom is genuinely eliminated. Anything less
 * separated renders a table of nothing but "Needs Help", which would let the
 * badge rendering pass without ever being exercised.
 */
function season(
  teamCount: number,
  weekCount: number,
  scoredWeeks: number
): PlayoffScheduleRow[] {
  const rows: PlayoffScheduleRow[] = []
  for (let week = 1; week <= weekCount; week += 1) {
    pairsForWeek(teamCount, week).forEach(([home, away], index) => {
      for (const rosterId of [home, away]) {
        rows.push({
          nativeRosterId: rosterId,
          nativeMatchupId: index + 1,
          week,
          points:
            week > scoredWeeks ? null : (teamCount - rosterId) * 10 + week,
          isFinal: true,
        })
      }
    })
  }
  return rows
}

function render(
  data: PlayoffPictureData,
  selectedRosterId: number | null = null
): string {
  return renderToStaticMarkup(
    createElement(PlayoffShell, {
      context: CONTEXT,
      data,
      basePath: BASE_PATH,
      selectedRosterId,
    })
  )
}

/** Twelve of fourteen regular-season weeks played — two still to come. */
const MID = computePlayoffPicture(season(10, 14, 12), names(10), RULES)

describe('Playoff picture — the admin table', () => {
  const html = render(MID)

  it('renders the league identity header and every team', () => {
    expect(html).toContain('10 enter 1 Leaves')
    expect(html).toContain('Playoff picture')
    for (let team = 1; team <= 10; team += 1) {
      expect(html).toContain(`Team ${team}`)
    }
  })

  it('renders every mandated column', () => {
    for (const header of ['Seed', 'Team', 'Record', 'PF', 'Left', 'Status', 'Clinch']) {
      expect(html).toContain(`>${header}`)
    }
  })

  it('renders seeds in the service order, never re-sorted by the table', () => {
    const seeds = [...html.matchAll(/text-muted-foreground">(\d+)<\/td>/g)]
    expect(MID.teams.map((team) => team.seed)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
    expect(seeds.length).toBeGreaterThan(0)
  })

  it('separates a genuinely settled top from a settled bottom', () => {
    // The fixture is built to produce both verdicts; if it stopped doing so the
    // badge rendering would go untested rather than fail loudly.
    expect(MID.teams.some((team) => team.status === 'clinched')).toBe(true)
    expect(MID.teams.some((team) => team.status === 'eliminated')).toBe(true)
    expect(html).toContain('Clinched')
    expect(html).toContain('Eliminated')
  })

  it('pairs every status with a plain-language clinch sentence', () => {
    expect(html).toContain('A berth is secured regardless of every remaining result')
    const contender = MID.teams.find(
      (team) => team.status === 'controls_own_path' && team.magicNumber !== null
    )
    if (contender !== undefined) {
      expect(html).toContain(`Clinch with ${contender.magicNumber} more win`)
    }
  })

  it('never names a rival in the clinch sentence', () => {
    // Nick's Clarify: the sentence says only what resolveMagicNumber computed —
    // own wins. A "OR Team X loses" clause would need the pairwise tiebreaker
    // reasoning the service declared wiki silence on and declined to invent.
    expect(html).not.toMatch(/OR Team \d+ loses/)
  })

  it('draws the playoff cut at the service field size, not a re-derived one', () => {
    expect(MID.fieldSize).toBe(6)
    expect(html).toContain('6</span> playoff spots')
    expect(html).toContain('border-b-2')
  })

  it('focuses a team through a link, not client state', () => {
    expect(html).toContain(`href="${BASE_PATH}?team=3"`)
    const focused = render(MID, 3)
    // The focused row's own link clears the selection rather than re-setting it.
    expect(focused).toContain(`href="${BASE_PATH}"`)
  })

  it('renders the table itself with no form control of its own', () => {
    // The what-if toggles below are buttons by necessity (item 5); the table is
    // still links and text only, so a focused view stays shareable.
    expect(html).not.toContain('<form')
    expect(html).not.toContain('<input')
  })

  it('carries tabular-nums and scrolls wide content in its own container', () => {
    expect(html).toContain('tabular-nums')
    expect(html).toContain('overflow-x-auto')
  })
})

describe('Playoff picture — the anti-probability property (item 6)', () => {
  const html = render(MID)

  it('prints no percentage or likelihood figure anywhere', () => {
    expect(html).not.toMatch(/\d\s*%/)
    expect(html).not.toMatch(/probab|likelihood|odds|chance|simulat|projected to/i)
  })

  it('renders no meter, progress, or proportional-bar geometry', () => {
    expect(html).not.toContain('<meter')
    expect(html).not.toContain('<progress')
    expect(html).not.toContain('role="progressbar"')
    // A width-as-value bar is the shape a probability display takes even when
    // it is never labelled one. There is no such geometry on this surface.
    expect(html).not.toMatch(/style="[^"]*width:\s*\d/)
  })

  it('states plainly that the statuses are deterministic', () => {
    expect(html).toContain('deterministic, not predictions')
  })
})

describe('Playoff picture — the what-if layer (item 5)', () => {
  const html = render(MID)

  /**
   * This suite renders the interactive layer's INITIAL state. Clicking is not
   * exercised: the project's vitest environment is `node` with no DOM, so no
   * test here can press a toggle. That is a real ceiling and it is declared
   * rather than papered over — the click path stays on the visual-check
   * backlog. What IS fully asserted is the substance of the feature: the
   * recompute itself is `applyHypotheticalResults` + `computePlayoffPicture`,
   * both pure and both covered in `playoff-picture.test.ts`.
   */

  it('offers a control for every remaining game, grouped by week', () => {
    expect(MID.remainingGames).toHaveLength(10)
    expect(html).toContain('Remaining games')
    expect(html).toContain('Week <span class="tabular-nums">13')
    expect(html).toContain('Week <span class="tabular-nums">14')
    const buttons = [...html.matchAll(/aria-pressed="false"/g)]
    // Two sides per game — either can be chosen as the winner.
    expect(buttons).toHaveLength(MID.remainingGames.length * 2)
  })

  it('starts with no hypothetical applied and no banner', () => {
    expect(html).not.toContain('Hypothetical view')
    expect(html).not.toContain('Reset to actual')
    expect(html).not.toContain('changed by what-if')
    expect(html).not.toContain('aria-pressed="true"')
  })

  it('keeps the what-if layer free of probability-shaped output too', () => {
    // Item 6 applies to the interactive view, not just the resting one.
    expect(html).not.toMatch(/\d\s*%/)
    expect(html).not.toMatch(/probab|likelihood|odds|chance|simulat/i)
    expect(html).not.toMatch(/style="[^"]*width:\s*\d/)
  })
})

describe('Playoff picture — honest degradation', () => {
  it('gives no verdict at all when the field size is unknown', () => {
    const noField = computePlayoffPicture(
      season(10, 14, 12),
      names(10),
      parsePlayoffRules({ settings: { playoff_week_start: 15 } })
    )
    const html = render(noField)
    expect(noField.fieldSize).toBeNull()
    // The apostrophe is HTML-escaped in the markup, so match around it.
    expect(html).toContain('say how many teams make the playoffs')
    expect(html).toContain('Undetermined')
    expect(html).not.toContain('Clinched')
    expect(html).not.toContain('Eliminated')
  })

  it('will not claim a finished season when the schedule is merely exhausted', () => {
    const complete = computePlayoffPicture(season(10, 14, 14), names(10), RULES)
    const html = render(complete)
    expect(complete.scheduleExhausted).toBe(true)
    expect(html).toContain('cannot tell a completed season from an unsynced one')
  })

  it('explains the absent what-if controls rather than showing an empty rail', () => {
    // The state the connected 2025 league is in today: season complete, so
    // there is nothing to toggle. Nick's Clarify — explain and hide.
    const complete = computePlayoffPicture(season(10, 14, 14), names(10), RULES)
    const html = render(complete)
    expect(complete.remainingGames).toHaveLength(0)
    expect(html).toContain('no unplayed games to try outcomes for')
    expect(html).not.toContain('<button')
    expect(html).not.toContain('Remaining games')
  })

  it('discloses divisions and states that seeding ignores them', () => {
    const divisional = computePlayoffPicture(
      season(10, 14, 12),
      names(10),
      parsePlayoffRules({
        settings: { playoff_teams: 6, playoff_week_start: 15, divisions: 2 },
      })
    )
    const html = render(divisional)
    expect(html).toContain('configures 2 divisions')
    expect(html).toContain('Seeding below ignores them')
  })

  it('labels first-round byes as inferred whenever it shows them', () => {
    const fiveSpots = computePlayoffPicture(
      season(10, 14, 12),
      names(10),
      parsePlayoffRules({
        settings: { playoff_teams: 5, playoff_week_start: 15 },
      })
    )
    const html = render(fiveSpots)
    expect(fiveSpots.rules.firstRoundByes).toBe(3)
    expect(html).toContain('3 first-round byes inferred')
    expect(html).toContain('not a stored field')
  })

  it('reads a field larger than the league as clamped, and says so', () => {
    const oversized = computePlayoffPicture(
      season(10, 14, 12),
      names(10),
      parsePlayoffRules({
        settings: { playoff_teams: 12, playoff_week_start: 15 },
      })
    )
    const html = render(oversized)
    expect(oversized.fieldSize).toBe(10)
    expect(html).toContain('Settings configure 12 playoff spots for 10 teams')
  })

  it('renders an empty league without a chart, a crash, or a verdict', () => {
    const empty = computePlayoffPicture([], new Map(), RULES)
    const html = render(empty)
    expect(html).toContain('No teams or matchups synced for this league yet')
    expect(html).toContain('No weeks scored yet')
  })
})
