import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { LeagueContext, RosterSlotLayout } from '@/services/league-context'
import {
  computePositionalBreakdown,
  type PositionalBreakdownData,
  type PositionalScoreRow,
} from '@/services/positional'

import PositionalShell from './positional-shell'

/**
 * Wave 5 — Positional breakdowns. `positional.test.ts` proves the arithmetic;
 * this suite proves the section RENDERS that arithmetic over a realistic
 * 10-team season, and that its disclosures survive into the markup.
 *
 * It cannot judge whether the result LOOKS right on a real viewport — that
 * still needs Nick's eyes and stays on the visual-check backlog. What it does
 * guarantee is that the average-anchored geometry lands inside its track, that
 * the inferred-attribution disclosure is actually present (the load-bearing
 * caveat of this whole section), that unmapped players are surfaced rather than
 * dropped, that sorting and team selection are links rather than client state,
 * and that the surface ships zero client JavaScript.
 */

const SRC_ROOT = resolve(__dirname, '..', '..')
const ROUTE_DIR = join(
  SRC_ROOT,
  'app',
  '(admin)',
  'leagues',
  '[leagueId]',
  'positional'
)

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

const BASE_PATH = '/leagues/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/positional'

function names(count: number) {
  return new Map(
    Array.from({ length: count }, (_, index) => [
      index + 1,
      { teamName: `Team ${index + 1}`, ownerDisplayName: `owner${index + 1}` },
    ])
  )
}

/**
 * A deterministic season with REAL positional spread in it: every team starts a
 * full standard lineup plus a third RB for the flex, and each team's strength
 * is skewed toward a different position, so the grid has genuine winners and
 * losers per column rather than a uniform field.
 */
function season(
  teamCount: number,
  weekCount: number,
  options: { unmappedTeam?: number } = {}
): PositionalScoreRow[] {
  const lineup = ['QB', 'RB', 'RB', 'RB', 'WR', 'WR', 'TE', 'K', 'DEF']
  const rows: PositionalScoreRow[] = []
  for (let week = 1; week <= weekCount; week += 1) {
    for (let team = 1; team <= teamCount; team += 1) {
      lineup.forEach((position, slot) => {
        // The skew: each team is strongest at the position matching its number.
        const bonus = position.charCodeAt(0) % (team + 2)
        rows.push({
          nativeRosterId: team,
          week,
          sleeperPlayerId: `t${team}-s${slot}`,
          points: 6 + bonus * 2 + ((week * 3 + slot) % 11),
          position,
          isFinal: true,
        })
      })
      if (options.unmappedTeam === team) {
        rows.push({
          nativeRosterId: team,
          week,
          sleeperPlayerId: 'ghost',
          points: 9,
          position: null,
          isFinal: true,
        })
      }
    }
  }
  return rows
}

function render(
  data: PositionalBreakdownData,
  selectedRosterId: number | null = null,
  sortKey: string | null = null
): string {
  return renderToStaticMarkup(
    createElement(PositionalShell, {
      context: CONTEXT,
      data,
      basePath: BASE_PATH,
      selectedRosterId,
      sortKey,
    })
  )
}

const FULL = computePositionalBreakdown(season(10, 14), names(10), STANDARD, 15)

describe('Positional breakdown — league grid', () => {
  const html = render(FULL)

  it('renders every team and the league identity header', () => {
    expect(html).toContain('10 enter 1 Leaves')
    expect(html).toContain('League positional grid')
    for (let team = 1; team <= 10; team += 1) {
      expect(html).toContain(`Team ${team}`)
    }
  })

  it('renders a column for every lineup slot, flex included', () => {
    for (const label of ['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'FLX']) {
      expect(html).toContain(`>${label}`)
    }
  })

  it('states the regular-season week scope and the started-players-only rule', () => {
    expect(html).toContain('Weeks 1–14')
    expect(html).toContain('playoffs start week 15')
    expect(html).toContain('started players only')
  })

  it('discloses that flex attribution is inferred, not recorded', () => {
    // The load-bearing caveat: the platform stores WHO started, never WHICH
    // slot, so a reader comparing against their lineup screen must be told.
    expect(html).toContain('Flex slots are inferred, not recorded')
    expect(FULL.flexAttributedStarts).toBeGreaterThan(0)
  })

  it('shades cells with the diverging scale, never the categorical ramp', () => {
    // Colour here ranks a team within its column; a team-identity colour would
    // imply the cells are series rather than positions in a distribution.
    expect(html).toContain('--chart-positive')
    expect(html).toContain('--chart-negative')
    expect(html).not.toContain('--chart-1')
  })

  it('keeps every cell shade legible under the number it sits behind', () => {
    const opacities = [...html.matchAll(/opacity:\s*([\d.]+)/g)].map((match) =>
      Number(match[1])
    )
    expect(opacities.length).toBeGreaterThan(10)
    expect(opacities.every((value) => value >= 0.08 && value <= 0.55)).toBe(true)
  })

  it('prints real points in every cell, so colour is never the only encoding', () => {
    expect(html).toMatch(/<span class="relative">\d+<\/span>/)
  })

  it('sorts by column through a link, not client state', () => {
    expect(html).toContain(`href="${BASE_PATH}?sort=RB"`)
    expect(html).toContain(`href="${BASE_PATH}?sort=FLEX"`)
  })

  it('ships no interactive control — the section is server-rendered', () => {
    expect(html).not.toContain('<button')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('<input')
  })

  it('scrolls wide content inside its own container', () => {
    expect(html).toContain('overflow-x-auto')
  })

  it('carries tabular-nums', () => {
    expect(html).toContain('tabular-nums')
  })
})

describe('Positional breakdown — sorting and selection', () => {
  it('reorders rows by the requested column', () => {
    const sorted = render(FULL, null, 'TE')
    const best = [...FULL.teams].sort(
      (a, b) =>
        (b.buckets.find((slot) => slot.key === 'TE')?.points ?? 0) -
        (a.buckets.find((slot) => slot.key === 'TE')?.points ?? 0)
    )[0]
    const firstRow = sorted.indexOf(`Team ${best.nativeRosterId}<`)
    expect(firstRow).toBeGreaterThan(-1)
    for (const team of FULL.teams) {
      if (team.nativeRosterId === best.nativeRosterId) continue
      const other = sorted.indexOf(`Team ${team.nativeRosterId}<`)
      if (other > -1) expect(firstRow).toBeLessThan(other)
    }
  })

  it('preserves the selected team across a re-sort, and vice versa', () => {
    const html = render(FULL, 3, 'TE')
    // A different column keeps the selection; another team's row keeps the sort.
    expect(html).toContain(`href="${BASE_PATH}?sort=RB&amp;team=3"`)
    expect(html).toContain(`href="${BASE_PATH}?sort=TE&amp;team=5"`)
    // Re-clicking the active column clears the sort but not the selection.
    expect(html).toContain(`href="${BASE_PATH}?team=3"`)
  })

  it('pins the selected team to the first grid row', () => {
    const html = render(FULL, 7, 'TE')
    const pinned = html.indexOf('Team 7<')
    expect(pinned).toBeGreaterThan(-1)
    for (const team of FULL.teams) {
      if (team.nativeRosterId === 7) continue
      const other = html.indexOf(`Team ${team.nativeRosterId}<`)
      if (other > -1) expect(pinned).toBeLessThan(other)
    }
    expect(html).toContain('aria-current="true"')
  })

  it('falls back to the league view for an unknown roster id', () => {
    const html = render(FULL, 99)
    expect(html).not.toContain('Back to all teams')
    expect(html).toContain('League positional grid')
  })
})

describe('Positional breakdown — single team vs. league', () => {
  const html = render(FULL, 4)

  it('shows the average-anchored bars for the selected team only', () => {
    expect(html).toContain('Team 4 vs. league')
    expect(html).toContain('Back to all teams')
    expect(html).not.toContain('Team 5 vs. league')
  })

  it('labels each bar with rank at the endpoint', () => {
    expect(html).toMatch(/\d+ of 10/)
  })

  it('keeps every bar inside its track', () => {
    const percentages = [...html.matchAll(/width:\s*([\d.]+)%/g)].map((match) =>
      Number(match[1])
    )
    expect(percentages.length).toBeGreaterThan(3)
    // An arm is measured across half the track, so nothing may exceed 50%.
    expect(percentages.every((value) => value >= 0 && value <= 50)).toBe(true)
  })

  it('colours bars by position identity, reusing the badge language', () => {
    expect(html).toContain('--pos-qb')
    expect(html).toContain('--pos-rb')
  })

  it('describes each bar to assistive tech in points and rank', () => {
    expect(html).toMatch(/points, [+-][\d.]+ versus a league average of/)
  })

  it('holds one shared scale, so switching teams never rescales the chart', () => {
    // The scale is the league's most extreme deviation. So the team holding it
    // renders a full-length arm, and EVERY other team renders shorter — if the
    // scale were per team, both would hit the maximum.
    const widest = (markup: string) =>
      Math.max(
        ...[...markup.matchAll(/width:\s*([\d.]+)%/g)].map((match) =>
          Number(match[1])
        )
      )
    const spread = (rosterId: number) => {
      const team = FULL.teams.find((entry) => entry.nativeRosterId === rosterId)
      const buckets = FULL.buckets.filter((bucket) => bucket.kind !== 'unmapped')
      return Math.max(
        ...(team?.buckets ?? [])
          .filter((slot) => buckets.some((bucket) => bucket.key === slot.key))
          .map((slot) => Math.abs(slot.deltaVsAverage))
      )
    }
    const ranked = FULL.teams
      .map((team) => team.nativeRosterId)
      .sort((a, b) => spread(b) - spread(a))
    // An arm spans half the track, so the league's extreme lands at 50%.
    expect(widest(render(FULL, ranked[0]))).toBeCloseTo(50, 5)
    expect(widest(render(FULL, ranked[ranked.length - 1]))).toBeLessThan(50)
  })
})

describe('Positional breakdown — detail table', () => {
  const html = render(FULL)

  it('carries raw totals, share and starts', () => {
    expect(html).toContain('Positional detail')
    expect(html).toContain("share is of each team's own started points".replace("'", '&#x27;'))
    expect(html).toMatch(/\d+\.\d%/)
  })

  it('sums every team into a league total', () => {
    expect(html).toContain('League total')
    const total = FULL.teams.reduce((sum, team) => sum + team.totalPoints, 0)
    expect(html).toContain(total.toFixed(1))
  })
})

describe('Positional breakdown — honest states', () => {
  it('renders empty copy, not failure copy, for a season with no scores', () => {
    const html = render(computePositionalBreakdown([], names(10), STANDARD, null))
    expect(html).toContain('No weeks have been scored in this league yet')
    expect(html.toLowerCase()).not.toContain("couldn't be loaded")
  })

  it('flags a small sample rather than suppressing the reading', () => {
    const html = render(
      computePositionalBreakdown(season(10, 3), names(10), STANDARD, 15)
    )
    expect(html).toContain('Provisional read')
    expect(html).toContain('3 weeks counted')
    // Flagged, never hidden: the grid is still there.
    expect(html).toContain('League positional grid')
  })

  it('surfaces unmapped players explicitly instead of dropping them', () => {
    const data = computePositionalBreakdown(
      season(10, 14, { unmappedTeam: 2 }),
      names(10),
      STANDARD,
      15
    )
    const html = render(data)
    expect(html).toContain('could not be matched to a position')
    expect(html).toContain('Unmapped')
    expect(data.unmappedStarts).toBe(14)
  })

  it('says so when the roster layout has not synced', () => {
    const html = render(
      computePositionalBreakdown(season(4, 6), names(4), null, null)
    )
    expect(html).toContain("roster layout hasn't synced".replace("'", '&#x27;'))
    // No flex column can exist without a layout — the section says why.
    expect(html).not.toContain('>FLX')
  })

  it('reports an unofficial week without hiding it', () => {
    const rows = season(4, 2).map((row) =>
      row.week === 2 ? { ...row, isFinal: false } : row
    )
    const html = render(computePositionalBreakdown(rows, names(4), STANDARD, 15))
    expect(html).toContain('1 unofficial')
  })
})

// --- import-graph boundaries ------------------------------------------------

const IMPORT_PATTERN = /from\s+'([^']+)'/g
const EXTENSIONS = ['.ts', '.tsx', '/index.ts', '/index.tsx']

function resolveLocal(specifier: string, fromFile: string): string | null {
  let base: string
  if (specifier.startsWith('@/')) base = join(SRC_ROOT, specifier.slice(2))
  else if (specifier.startsWith('.')) base = resolve(dirname(fromFile), specifier)
  else return null
  for (const extension of EXTENSIONS) {
    const candidate = `${base}${extension}`
    if (existsSync(candidate)) return candidate
  }
  return existsSync(base) ? base : null
}

function collectImportGraph(entry: string): string[] {
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    for (const match of readFileSync(file, 'utf8').matchAll(IMPORT_PATTERN)) {
      const resolved = resolveLocal(match[1], file)
      if (resolved !== null) queue.push(resolved)
    }
  }
  return [...seen]
}

const relative = (files: string[]) =>
  files.map((file) => file.slice(SRC_ROOT.length + 1).replaceAll('\\', '/'))

describe('Positional breakdown route — import graph', () => {
  const graph = relative([
    ...new Set(
      [join(ROUTE_DIR, 'page.tsx'), join(ROUTE_DIR, 'loading.tsx')].flatMap(
        (entry) => collectImportGraph(entry)
      )
    ),
  ])

  it('pulls in no client module — the whole section renders on the server', () => {
    const clientModules = graph.filter((file) =>
      readFileSync(join(SRC_ROOT, file), 'utf8').startsWith("'use client'")
    )
    expect(clientModules).toEqual([])
  })

  it('reads through the owner RLS client, never the service-role client', () => {
    expect(graph).toContain('lib/supabase/server.ts')
    expect(graph).not.toContain('lib/supabase/admin.ts')
    expect(graph).not.toContain('lib/supabase/spectator.ts')
  })

  it('never reaches draft services from an analysis section', () => {
    expect(graph.filter((file) => /^services\/(draft-|bpa\/)/.test(file))).toEqual([])
  })
})
