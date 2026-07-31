import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { LeagueContext } from '@/services/league-context'
import { computeLuck, type LuckData, type LuckRow } from '@/services/luck'
import SpectatorLuckSummary from '@/components/spectator/spectator-luck-summary'

import LuckShell from './luck-shell'

/**
 * Wave 5 — Lucky/unlucky tracker. `luck.test.ts` proves the arithmetic; this
 * suite proves the section RENDERS that arithmetic, over a realistic 10-team
 * season, and that its disclosures survive into the markup.
 *
 * It cannot judge whether the result LOOKS right on a real viewport — that
 * still needs Nick's eyes and stays on the visual-check backlog. What it does
 * guarantee is that the diverging geometry lands inside its track, that every
 * bar is labelled in record terms rather than as an abstract index (the item's
 * explicit requirement), that the small-sample and bye-week disclosures are
 * actually present, that the surface ships zero client JavaScript, and that the
 * spectator summary imports nothing from the admin surface.
 */

const SRC_ROOT = resolve(__dirname, '..', '..')
const ROUTE_DIR = join(SRC_ROOT, 'app', '(admin)', 'leagues', '[leagueId]', 'luck')

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

const BASE_PATH = '/leagues/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/luck'

function names(count: number) {
  return new Map(
    Array.from({ length: count }, (_, index) => [
      index + 1,
      { teamName: `Team ${index + 1}`, ownerDisplayName: `owner${index + 1}` },
    ])
  )
}

/**
 * A deterministic season with REAL luck in it: scoring rises with team number,
 * but the pairing is fixed (1v2, 3v4, …) so the low seeds of each pair lose
 * every week regardless of how they scored against the field. Team 3 in
 * particular outscores teams 1 and 2 while always facing team 4 — the exact
 * shape the tracker exists to surface.
 */
function season(
  teamCount: number,
  weekCount: number,
  options: { finalFrom?: number; byeTeam?: number } = {}
): LuckRow[] {
  const rows: LuckRow[] = []
  for (let week = 1; week <= weekCount; week += 1) {
    for (let team = 1; team <= teamCount; team += 1) {
      const isBye = options.byeTeam === team
      rows.push({
        nativeRosterId: team,
        nativeMatchupId: isBye ? null : Math.ceil(team / 2),
        week,
        points: 80 + team * 4 + ((week * 7) % 23),
        isFinal: options.finalFrom === undefined || week < options.finalFrom,
      })
    }
  }
  return rows
}

function render(data: LuckData, selectedRosterId: number | null = null): string {
  return renderToStaticMarkup(
    createElement(LuckShell, {
      context: CONTEXT,
      data,
      basePath: BASE_PATH,
      selectedRosterId,
    })
  )
}

const FULL = computeLuck(season(10, 14), names(10), 15)

describe('Luck tracker — ranked view', () => {
  const html = render(FULL)

  it('renders every team and the league identity header', () => {
    expect(html).toContain('10 enter 1 Leaves')
    expect(html).toContain('Luck ranking')
    for (let team = 1; team <= 10; team += 1) {
      expect(html).toContain(`Team ${team}`)
    }
  })

  it('states the regular-season week scope it actually counted', () => {
    expect(html).toContain('Weeks 1–14')
    expect(html).toContain('playoffs start week 15')
  })

  it('labels every bar in actual-vs-expected record terms, not an index', () => {
    // The item's explicit requirement: the bar reads without a legend because
    // the label says what the gap IS.
    expect(html).toMatch(/\d+-\d+ actual \/ [\d.]+-[\d.]+ expected/)
    const labelled = html.match(/actual \/ /g)?.length ?? 0
    // One per team on the wide layout plus the narrow-viewport relocation.
    expect(labelled).toBeGreaterThanOrEqual(10)
  })

  it('keeps every diverging arm inside its track', () => {
    const percentages = [...html.matchAll(/(?:height|width):\s*([\d.]+)%/g)].map(
      (match) => Number(match[1])
    )
    expect(percentages.length).toBeGreaterThan(5)
    // An arm is measured across half the track, so nothing may exceed 50%.
    expect(percentages.every((value) => value >= 0 && value <= 50)).toBe(true)
  })

  it('uses the diverging scale, never the categorical series ramp', () => {
    // Polarity about zero is what this chart encodes — a team-identity colour
    // here would imply the bars are series rather than signed magnitudes.
    expect(html).toContain('--chart-positive')
    expect(html).toContain('--chart-negative')
    expect(html).not.toContain('--chart-1')
  })

  it('ranks luckiest first, unluckiest last', () => {
    const first = FULL.teams[0]
    const last = FULL.teams[FULL.teams.length - 1]
    expect(first.luck).toBeGreaterThan(0)
    expect(last.luck).toBeLessThan(0)
    expect(html.indexOf(`Team ${first.nativeRosterId}`)).toBeLessThan(
      html.indexOf(`Team ${last.nativeRosterId}`)
    )
  })

  it('offers a drill-down link per team', () => {
    expect(html).toContain(`href="${BASE_PATH}?team=1"`)
    expect(html).toContain(`href="${BASE_PATH}?team=10"`)
  })

  it('ships no interactive control — the section is server-rendered', () => {
    expect(html).not.toContain('<button')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('<input')
  })

  it('carries tabular-nums on the ranked list', () => {
    expect(html).toContain('tabular-nums')
  })
})

describe('Luck tracker — drill-down', () => {
  const html = render(FULL, 3)

  it('shows the per-team weekly and cumulative views', () => {
    expect(html).toContain('Weekly luck — Team 3')
    expect(html).toContain('Cumulative luck')
    expect(html).toContain('Back to all teams')
  })

  it('draws the cumulative series as a polyline, not an interpolation', () => {
    expect(html).toContain('<polyline')
    expect(html).toContain('vector-effect="non-scaling-stroke"')
  })

  it('exposes each week to assistive tech with its result and value', () => {
    expect(html).toMatch(/Team 3, W1: scored [\d.]+ against [\d.]+, (won|lost|tied)/)
  })

  it('keeps the ranked list visible as the way back', () => {
    expect(html).toContain('Luck ranking')
    expect(html).toContain('aria-current="true"')
  })

  it('falls back to the league view for an unknown roster id', () => {
    const unknown = render(FULL, 99)
    expect(unknown).not.toContain('Back to all teams')
    expect(unknown).toContain('Luck ranking')
  })
})

describe('Luck tracker — honest states', () => {
  it('renders empty copy, not failure copy, for a season with no scores', () => {
    const html = render(computeLuck([], names(10), null))
    expect(html).toContain('No weeks have been scored in this league yet')
    expect(html.toLowerCase()).not.toContain("couldn't be loaded")
  })

  it('flags a luck reading taken under six weeks', () => {
    const short = render(computeLuck(season(10, 4), names(10), null))
    expect(short).toContain('Provisional read')
    expect(short).toContain('under the ~6 weeks a luck signal needs')
  })

  it('drops the caveat once the sample is large enough', () => {
    const long = render(computeLuck(season(10, 8), names(10), null))
    expect(long).not.toContain('Provisional read')
  })

  it('discloses bye weeks that rate but do not play', () => {
    const html = render(
      computeLuck(season(10, 8, { byeTeam: 7 }), names(10), null)
    )
    expect(html).toContain('without an opponent (bye or unpaired)')
    expect(html).toContain('count toward expected wins but not toward the record')
  })

  it('discloses a disagreement with the standings snapshot', () => {
    const data = computeLuck(
      season(10, 8),
      names(10),
      null,
      new Map([[1, 99]])
    )
    const html = render(data)
    expect(html).toContain('differs from the standings snapshot')
  })

  it('surfaces provisional weeks rather than presenting them as final', () => {
    const html = render(
      computeLuck(season(10, 14, { finalFrom: 13 }), names(10), 15)
    )
    expect(html).toContain('2 unofficial')
  })
})

describe('spectator luck summary', () => {
  const html = renderToStaticMarkup(
    createElement(SpectatorLuckSummary, { data: FULL })
  )

  it('gives one delta and one short label per team, in record terms', () => {
    expect(html).toMatch(/\d+-\d+ actual \/ [\d.]+-[\d.]+ expected/)
    expect(html).toContain('lucky')
    expect(html).toContain('unlucky')
  })

  it('renders no chart geometry — this is the light mobile summary', () => {
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('<polyline')
    expect(html).not.toContain('%;')
  })

  it('never renders an admin nav label the spectator guard forbids', () => {
    expect(html).not.toContain('Luck Tracker')
    expect(html).not.toContain('Score Trends')
  })

  it('keeps the small-sample caveat a viewer needs', () => {
    const short = renderToStaticMarkup(
      createElement(SpectatorLuckSummary, {
        data: computeLuck(season(10, 4), names(10), null),
      })
    )
    expect(short).toContain('Early-season reading')
  })

  it('has an honest empty state', () => {
    const empty = renderToStaticMarkup(
      createElement(SpectatorLuckSummary, {
        data: computeLuck([], names(10), null),
      })
    )
    expect(empty).toContain('No scored weeks yet')
  })

  it('ships no interactive control', () => {
    expect(html).not.toContain('<button')
    expect(html).not.toContain('<input')
  })
})

// --- import graphs ---------------------------------------------------------

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

describe('Luck tracker route — import graph', () => {
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

describe('spectator luck summary — import graph', () => {
  const graph = relative(
    collectImportGraph(
      join(SRC_ROOT, 'components', 'spectator', 'spectator-luck-summary.tsx')
    )
  )

  it('imports no admin-surface component', () => {
    // The separate-rendering-path rule (Access Model): the shared CHART layer
    // is sanctioned, admin section directories are not.
    expect(
      graph.filter((file) =>
        /^components\/(dashboard|draft-board|auth|luck|score-trends)\//.test(file)
      )
    ).toEqual([])
  })

  it('reaches no Supabase client factory — it is handed its data', () => {
    // The generated `database.types.ts` arrives through the luck service's
    // type-only import and is not a client; a FACTORY in a presentational
    // spectator component would mean it fetches for itself, which is what
    // this guards against.
    expect(
      graph.filter((file) =>
        /^lib\/supabase\/(client|server|admin|spectator)\.ts$/.test(file)
      )
    ).toEqual([])
  })
})
