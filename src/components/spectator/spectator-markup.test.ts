import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { existsSync } from 'node:fs'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type {
  MatchupsData,
  PlayerCardData,
  PowerRankingsData,
  StandingsData,
} from '@/services/dashboard'
import type { SpectatorDashboardData } from '@/services/spectator'

import SpectatorLoading from '@/app/share/[share_token]/loading'

import SpectatorPlayerCard from './spectator-player-card'
import SpectatorPlayerDrawer from './spectator-player-drawer'
import SpectatorShell from './spectator-shell'
import SpectatorUnavailable from './spectator-unavailable'

/**
 * Wave 4 build item: "assert the spectator route's rendered response contains
 * no admin-surface markup (draft board, BPA, admin nav, regenerate-token
 * control)."
 *
 * Two complementary guards, because either alone is escapable:
 *  1. RENDERED OUTPUT — the composed spectator page (including the player
 *     drawer) is rendered to static markup and asserted free of every admin
 *     affordance: admin nav labels, draft/BPA vocabulary, /leagues/ links, and
 *     any interactive control at all (the regenerate-token control is a
 *     <button>; the spectator surface has zero buttons/forms/inputs by design).
 *  2. IMPORT GRAPH — the spectator route's transitive local imports are walked
 *     and asserted to include no admin component directory and no owner/
 *     service-role Supabase factory. This catches an admin component pulled in
 *     behind a branch that this fixture happens not to hit, which a rendered
 *     snapshot never could.
 */

const SRC_ROOT = resolve(__dirname, '..', '..')
const SEGMENT_DIR = join(SRC_ROOT, 'app', 'share', '[share_token]')
const ROUTE_ENTRY = join(SEGMENT_DIR, 'page.tsx')
/** Every file the spectator segment can render a response from. */
const SEGMENT_ENTRIES = [
  ROUTE_ENTRY,
  join(SEGMENT_DIR, 'loading.tsx'),
  join(SEGMENT_DIR, 'error.tsx'),
  join(SEGMENT_DIR, 'not-found.tsx'),
]

const CONTEXT = {
  leagueId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  name: 'Alpha League',
  platform: 'sleeper' as const,
  seasonYear: 2026,
}

const STANDINGS: StandingsData = {
  context: CONTEXT,
  teams: [
    {
      nativeRosterId: 1,
      teamName: 'Alpha One',
      ownerDisplayName: 'alphaowner1',
      rank: 1,
      wins: 2,
      losses: 0,
      ties: 0,
      pointsFor: 250.5,
      pointsAgainst: 200,
    },
    {
      nativeRosterId: 2,
      teamName: 'Alpha Two',
      ownerDisplayName: 'alphaowner2',
      rank: 2,
      wins: 0,
      losses: 2,
      ties: 0,
      pointsFor: 200,
      pointsAgainst: 250.5,
    },
  ],
}

const POWER_RANKINGS: PowerRankingsData = {
  context: CONTEXT,
  teams: [
    {
      nativeRosterId: 1,
      teamName: 'Alpha One',
      ownerDisplayName: 'alphaowner1',
      rank: 1,
      allPlayWins: 2,
      allPlayLosses: 0,
      allPlayTies: 0,
      allPlayWinPct: 1,
      pointsFor: 245.5,
      standingsRank: 1,
      rankDelta: 0,
    },
    {
      nativeRosterId: 2,
      teamName: 'Alpha Two',
      ownerDisplayName: 'alphaowner2',
      rank: 2,
      allPlayWins: 0,
      allPlayLosses: 2,
      allPlayTies: 0,
      allPlayWinPct: 0,
      pointsFor: 210,
      standingsRank: 1,
      rankDelta: -1,
    },
  ],
  weeksCounted: 2,
  nonFinalWeeksCounted: 1,
  lowConfidence: true,
}

const MATCHUPS: MatchupsData = {
  context: CONTEXT,
  week: 2,
  pairs: [
    {
      nativeMatchupId: 1,
      sides: [
        {
          nativeRosterId: 1,
          teamName: 'Alpha One',
          ownerDisplayName: 'alphaowner1',
          effectivePoints: 125.5,
          isFinal: false,
          fetchedAt: '2026-09-17T00:00:00Z',
          playerScores: [
            {
              sleeperPlayerId: 'p1',
              fullName: 'Global Player One',
              position: 'RB',
              team: 'DET',
              points: 22.4,
              wasStarter: true,
              isFinal: false,
              fetchedAt: '2026-09-17T00:00:00Z',
            },
            {
              sleeperPlayerId: 'p3',
              fullName: 'Bench Guy',
              position: 'WR',
              team: 'GB',
              points: 4.2,
              wasStarter: false,
              isFinal: false,
              fetchedAt: '2026-09-17T00:00:00Z',
            },
          ],
        },
        {
          nativeRosterId: 2,
          teamName: 'Alpha Two',
          ownerDisplayName: 'alphaowner2',
          effectivePoints: 110,
          isFinal: false,
          fetchedAt: '2026-09-17T00:00:00Z',
          playerScores: [
            {
              sleeperPlayerId: 'p2',
              fullName: 'Global Player Two',
              position: 'WR',
              team: 'GB',
              points: 15.1,
              wasStarter: true,
              isFinal: false,
              fetchedAt: '2026-09-17T00:00:00Z',
            },
          ],
        },
      ],
    },
  ],
  unpaired: [],
  hasPairingAnomaly: false,
}

const DASHBOARD: SpectatorDashboardData = {
  leagueId: CONTEXT.leagueId,
  context: CONTEXT,
  standings: { status: 'ok', data: STANDINGS },
  powerRankings: { status: 'ok', data: POWER_RANKINGS },
  availableWeeks: [1, 2],
  week: 2,
  matchups: { status: 'ok', data: MATCHUPS },
}

/** The same league with every section's query failed — the resilience path. */
const ALL_SECTIONS_UNAVAILABLE: SpectatorDashboardData = {
  ...DASHBOARD,
  standings: { status: 'unavailable' },
  powerRankings: { status: 'unavailable' },
  matchups: { status: 'unavailable' },
}

const PLAYER_CARD: PlayerCardData = {
  context: CONTEXT,
  player: {
    sleeperPlayerId: 'p1',
    fullName: 'Global Player One',
    firstName: 'Global',
    lastName: 'Player One',
    position: 'RB',
    fantasyPositions: ['RB'],
    team: 'DET',
    status: 'Active',
    injuryStatus: 'Questionable',
  },
  rosterStatus: {
    availability: 'rostered',
    nativeRosterId: 1,
    teamName: 'Alpha One',
    ownerDisplayName: 'alphaowner1',
    slot: 'starter',
  },
  weeks: [
    {
      week: 1,
      status: 'scored',
      points: 18,
      wasStarter: true,
      isFinal: true,
      fetchedAt: '2026-09-10T00:00:00Z',
      nativeRosterId: 1,
      teamName: 'Alpha One',
      ownerDisplayName: 'alphaowner1',
    },
    { week: 2, status: 'not_rostered' },
  ],
}

/** The spectator page as a viewer with `?player=` open actually receives it. */
function renderSpectatorResponse(): string {
  return renderToStaticMarkup(
    createElement(SpectatorShell, {
      data: DASHBOARD,
      // children-as-prop is required here, not a style choice: this suite is a
      // .ts file (the vitest `include` glob), so there is no JSX, and
      // createElement's typed overload demands `children` inside props when the
      // component's props interface declares it required.
      // eslint-disable-next-line react/no-children-prop
      playerSlot: createElement(SpectatorPlayerDrawer, {
        closeHref: '/share/token',
        label: 'Global Player One',
        children: createElement(SpectatorPlayerCard, { data: PLAYER_CARD }),
      }),
    })
  )
}

/** Every admin affordance that must never reach a spectator response — the
 *  admin sidebar's nav labels, the draft/BPA surface's vocabulary, and the
 *  share-link panel's own controls. */
const FORBIDDEN_TEXT = [
  // Admin nav shell (components/dashboard/admin-sidebar.tsx)
  'Draft board',
  'Command center',
  'Score Trends',
  'Luck Tracker',
  'Playoff Picture',
  'Trade Evaluator',
  'Waiver Wire',
  'Season Report',
  'Free Agents',
  'Sign out',
  // Draft board / BPA
  'Best available',
  'BPA',
  'Draft queue',
  'Auto-pick',
  'draft_state',
  // Share-link settings panel (owner-only)
  'Share link',
  'Regenerate',
  'Spectator link',
  // Auth affordances — viewers never have accounts
  'Sign in',
  'Log in',
  'Password',
]

describe('spectator response — no admin-surface markup', () => {
  const html = renderSpectatorResponse()

  it('renders the spectator surface itself', () => {
    expect(html).toContain('Alpha League')
    expect(html).toContain('Standings')
    expect(html).toContain('Power rankings')
    expect(html).toContain('Week 2')
    expect(html).toContain('Global Player One')
  })

  it.each(FORBIDDEN_TEXT)('contains no admin affordance: %s', (needle) => {
    expect(html.toLowerCase()).not.toContain(needle.toLowerCase())
  })

  it('exposes no interactive controls at all', () => {
    // The regenerate-token control is a <button>; a login is a <form>/<input>.
    // The spectator surface navigates exclusively by anchor, so the absence of
    // all three is a stronger guarantee than naming individual controls.
    expect(html).not.toContain('<button')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('<input')
  })

  it('links nowhere near the admin surface', () => {
    expect(html).not.toContain('/leagues/')
    expect(html).not.toContain('/login')
    expect(html).not.toContain('/draft')
    // Player links stay relative to the share URL (query-only).
    expect(html).toContain('href="?player=p1"')
  })

  it('omits bench lines from matchup cards (starters only)', () => {
    expect(html).toContain('Global Player One')
    expect(html).not.toContain('Bench Guy')
  })

  it('keeps the wiki-mandated low-confidence and unofficial caveats', () => {
    expect(html).toContain('Early-season reading')
    expect(html).toContain('unofficial')
  })
})

/**
 * The resilience surfaces (2026-07-31 build item): the loading skeleton, the
 * whole-page unavailable view, and the degraded shell where every section's
 * query failed. Each is a real response a leaguemate can receive, so each is
 * held to the same no-admin-markup, no-auth, no-controls contract as the happy
 * path — and, for the failure views, to leaking nothing about the fault.
 */
const RESILIENCE_RESPONSES: Array<[string, () => string]> = [
  ['loading skeleton', () => renderToStaticMarkup(createElement(SpectatorLoading))],
  [
    'unavailable view',
    () =>
      renderToStaticMarkup(
        createElement(SpectatorUnavailable, { retryHref: '/share/token' })
      ),
  ],
  [
    'all sections unavailable',
    () =>
      renderToStaticMarkup(
        createElement(SpectatorShell, { data: ALL_SECTIONS_UNAVAILABLE })
      ),
  ],
]

describe('spectator resilience surfaces — same boundary as the happy path', () => {
  it.each(RESILIENCE_RESPONSES)('%s: no admin affordances', (_label, render) => {
    const html = render().toLowerCase()
    for (const needle of FORBIDDEN_TEXT) {
      expect(html).not.toContain(needle.toLowerCase())
    }
  })

  it.each(RESILIENCE_RESPONSES)('%s: no controls, no admin links', (_label, render) => {
    const html = render()
    expect(html).not.toContain('<button')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('<input')
    expect(html).not.toContain('/leagues/')
    expect(html).not.toContain('/login')
  })

  it('degraded sections say the data failed, never that the league is empty', () => {
    const html = renderToStaticMarkup(
      createElement(SpectatorShell, { data: ALL_SECTIONS_UNAVAILABLE })
    )
    // The league still identifies itself; only its sections are missing.
    expect(html).toContain('Alpha League')
    expect(html).toContain('Couldn&#x27;t load this week&#x27;s matchups')
    expect(html).toContain('Couldn&#x27;t load the standings')
    expect(html).toContain('Couldn&#x27;t load the power rankings')
    // The empty-state copy would be a lie here — a failure is not an absence.
    expect(html).not.toContain('No standings for this league yet')
    expect(html).not.toContain('No scored weeks in this league yet')
  })

  it('the unavailable view leaks no error detail and names no league', () => {
    const html = renderToStaticMarkup(
      createElement(SpectatorUnavailable, { retryHref: '/share/token' })
    )
    expect(html).toContain('Try again')
    expect(html).toContain('href="/share/token"')
    // No digest/ref (Nick's Clarify), no stack, no message, no league identity.
    expect(html.toLowerCase()).not.toContain('ref ')
    expect(html.toLowerCase()).not.toContain('digest')
    expect(html.toLowerCase()).not.toContain('error')
    expect(html).not.toContain('Alpha League')
  })
})

const IMPORT_PATTERN = /from\s+'([^']+)'/g
const EXTENSIONS = ['.ts', '.tsx', '/index.ts', '/index.tsx']

/** Resolve a `@/`-aliased or relative specifier to a real file under src/. */
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

/** Every first-party module the spectator route transitively pulls in. */
function collectImportGraph(entry: string): string[] {
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(IMPORT_PATTERN)) {
      const resolved = resolveLocal(match[1], file)
      if (resolved !== null) queue.push(resolved)
    }
  }
  return [...seen]
}

describe('spectator route — import graph carries no admin UI', () => {
  // Every entry point the segment can render from — the page plus its
  // resilience siblings. Walking only the page would leave error.tsx and
  // loading.tsx as unguarded holes in the same boundary (Nick's Clarify).
  const graph = [
    ...new Set(
      SEGMENT_ENTRIES.flatMap((entry) => collectImportGraph(entry))
    ),
  ].map((file) => file.slice(SRC_ROOT.length + 1).replaceAll('\\', '/'))

  it('reaches the spectator components and the shared data layer', () => {
    expect(graph).toContain('components/spectator/spectator-shell.tsx')
    expect(graph).toContain('services/spectator.ts')
    // Shared data-access is sanctioned; shared UI is not.
    expect(graph).toContain('services/dashboard.ts')
  })

  it('imports no component from the admin surface', () => {
    const adminUi = graph.filter((file) =>
      /^components\/(dashboard|draft-board|auth)\//.test(file)
    )
    expect(adminUi).toEqual([])
  })

  it('never reaches the owner or service-role Supabase factories', () => {
    expect(graph).not.toContain('lib/supabase/server.ts')
    expect(graph).not.toContain('lib/supabase/admin.ts')
    expect(graph).toContain('lib/supabase/spectator.ts')
  })

  it('never reaches draft services', () => {
    const draft = graph.filter((file) =>
      /^services\/(draft-|bpa\/)/.test(file)
    )
    expect(draft).toEqual([])
  })
})
