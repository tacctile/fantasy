import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { LeagueContext } from '@/services/league-context'
import {
  computeScoreTrends,
  type ScoreRow,
  type ScoreTrendsData,
} from '@/services/score-trends'

import ScoreTrendsShell from './score-trends-shell'

/**
 * Wave 5 — Score charts. The chart primitives shipped in the previous fold
 * were pure-maths-tested but had never been RENDERED by anything (a known gap
 * recorded in STATE.yml). This suite is the first thing that mounts them: the
 * whole section is rendered to static markup over a realistic 10-team season
 * and asserted on.
 *
 * It cannot judge whether the result LOOKS right — that still needs Nick's eyes
 * on a real authed session, and is left on the visual-check backlog. What it
 * does guarantee is that the section renders at all, that the series cap
 * actually fans out to small multiples rather than overplotting, that the
 * geometry lands inside the plot, that provisional and low-confidence states
 * are surfaced honestly, and that the surface stays server-rendered — the
 * failure modes that would otherwise only surface in front of Nick.
 */

const SRC_ROOT = resolve(__dirname, '..', '..')
const ROUTE_DIR = join(SRC_ROOT, 'app', '(admin)', 'leagues', '[leagueId]', 'score-trends')

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
  slotLayout: null,
}

const BASE_PATH = '/leagues/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/score-trends'

function names(count: number) {
  return new Map(
    Array.from({ length: count }, (_, index) => [
      index + 1,
      {
        teamName: `Team ${index + 1}`,
        ownerDisplayName: `owner${index + 1}`,
      },
    ])
  )
}

/** A deterministic season: distinct per-team scoring levels, no randomness. */
function season(teamCount: number, weekCount: number, options: { finalFrom?: number } = {}) {
  const rows: ScoreRow[] = []
  for (let team = 1; team <= teamCount; team += 1) {
    for (let week = 1; week <= weekCount; week += 1) {
      rows.push({
        nativeRosterId: team,
        week,
        points: 80 + team * 4 + ((week * 7) % 23),
        isFinal: options.finalFrom === undefined || week < options.finalFrom,
      })
    }
  }
  return rows
}

function render(data: ScoreTrendsData, selectedRosterId: number | null = null): string {
  return renderToStaticMarkup(
    createElement(ScoreTrendsShell, {
      context: CONTEXT,
      data,
      basePath: BASE_PATH,
      selectedRosterId,
    })
  )
}

const FULL = computeScoreTrends(season(10, 14), names(10), 15)

describe('Score Trends — league view', () => {
  const html = render(FULL)

  it('renders every team and the league identity header', () => {
    expect(html).toContain('10 enter 1 Leaves')
    expect(html).toContain('Score trends')
    for (let team = 1; team <= 10; team += 1) {
      expect(html).toContain(`Team ${team}`)
    }
  })

  it('states the regular-season week scope it actually plotted', () => {
    expect(html).toContain('Weeks 1–14')
    expect(html).toContain('playoffs start week 15')
  })

  it('fans out past the 4-series cap instead of overplotting one chart', () => {
    // The small-multiples primitive states the shared scale once; an
    // overplotted chart would carry a 10-entry legend instead.
    expect(html).toContain('same scale on every team')
    expect(html).toContain('cumulative points · same scale on every team')
  })

  it('keeps every mark inside the plot area', () => {
    const percentages = [...html.matchAll(/(?:height|bottom|left|width):\s*([\d.]+)%/g)].map(
      (match) => Number(match[1])
    )
    expect(percentages.length).toBeGreaterThan(100)
    expect(percentages.every((value) => value >= 0 && value <= 100)).toBe(true)
  })

  it('draws trend lines as broken-into-segments polylines, not interpolations', () => {
    expect(html).toContain('<polyline')
    expect(html).toContain('vector-effect="non-scaling-stroke"')
  })

  it('renders the spread band with the league median reference', () => {
    expect(html).toContain('Score spread')
    expect(html).toContain('Dotted line is the league median')
  })

  it('offers a drill-down link per team from the season list', () => {
    expect(html).toContain(`href="${BASE_PATH}?team=1"`)
    expect(html).toContain(`href="${BASE_PATH}?team=10"`)
  })

  it('ships no interactive control — the section is server-rendered', () => {
    expect(html).not.toContain('<button')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('<input')
  })

  it('carries tabular-nums on every chart frame and the season list', () => {
    expect(html.match(/tabular-nums/g)?.length ?? 0).toBeGreaterThan(2)
  })
})

describe('Score Trends — drill-down', () => {
  const html = render(FULL, 3)

  it('narrows the full-size charts to the selected team', () => {
    expect(html).toContain('Weekly points — Team 3')
    expect(html).toContain('Cumulative points — Team 3')
    expect(html).toContain('Back to all teams')
  })

  it('keeps the league visible in the spread chart for context', () => {
    // The point of the spread view is comparison — a lone team's band would
    // answer nothing, so every team stays rendered with the selection marked.
    expect(html).toContain('Team 7')
    expect(html).toContain('aria-current="true"')
  })

  it('exposes each bar to assistive tech with its exact value', () => {
    expect(html).toMatch(/Team 3, W1: [\d.]+ points/)
  })

  it('falls back to the league view for an unknown roster id', () => {
    const unknown = render(FULL, 99)
    expect(unknown).not.toContain('Back to all teams')
    expect(unknown).toContain('same scale on every team')
  })
})

describe('Score Trends — honest states', () => {
  it('renders empty copy, not failure copy, for a season with no scores', () => {
    const html = render(computeScoreTrends([], names(10), null))
    expect(html).toContain('No weeks have been scored in this league yet.')
    expect(html).toContain('Nothing to trend until a week has been scored.')
    expect(html).toContain('nothing to spread')
    expect(html.toLowerCase()).not.toContain("couldn't be loaded")
  })

  it('flags a variance reading taken under six weeks', () => {
    const short = render(computeScoreTrends(season(10, 4), names(10), null))
    expect(short).toContain('under 6 weeks, spread is mostly sample noise')
  })

  it('drops the caveat once the sample is large enough', () => {
    const long = render(computeScoreTrends(season(10, 8), names(10), null))
    expect(long).not.toContain('sample noise')
  })

  it('surfaces provisional weeks rather than presenting them as final', () => {
    const html = render(
      computeScoreTrends(season(10, 14, { finalFrom: 13 }), names(10), 15)
    )
    expect(html).toContain('2 unofficial')
  })

  it('renders a four-team league as one grouped chart with a legend', () => {
    const small = computeScoreTrends(season(4, 6), names(4), null)
    const html = render(small)
    // Under the cap: one chart carrying all four series, so the legend is what
    // carries identity — no small-multiples scale caption.
    expect(html).not.toContain('same scale on every team')
    expect(html).toContain('--chart-1')
    expect(html).toContain('--chart-4')
  })
})

// --- the route stays server-rendered --------------------------------------

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

describe('Score Trends route — import graph', () => {
  const graph = [
    ...new Set(
      [join(ROUTE_DIR, 'page.tsx'), join(ROUTE_DIR, 'loading.tsx')].flatMap(
        (entry) => collectImportGraph(entry)
      )
    ),
  ].map((file) => file.slice(SRC_ROOT.length + 1).replaceAll('\\', '/'))

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
