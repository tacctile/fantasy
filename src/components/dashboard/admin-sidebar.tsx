'use client'

import {
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  LineChart,
  type LucideIcon,
  PlusCircle,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import SignOutButton from '@/components/auth/sign-out-button'
import LeagueSelector from '@/components/draft-board/league-selector'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { ConnectedLeague } from '@/services/draft-board'

interface AdminSidebarProps {
  /** Every connected league — the persistent selector switches between them. */
  leagues: ConnectedLeague[]
  activeLeagueId: string
}

/** A live admin section: a real route under the active league. */
type PrimaryItem = {
  label: string
  icon: LucideIcon
  /** Path under /leagues/<id> — '' is the command-center home. */
  sub: string
  /** 'exact' so Home isn't lit on child sections; 'prefix' for the rest. */
  match: 'exact' | 'prefix'
}

/**
 * The active admin surface's sections — Home (command center), the full
 * standings/matchups/power dashboard, and the draft board. This is the IA the
 * whole admin surface hangs off; Wave 5/6 sections activate the FUTURE_NAV
 * mount points below rather than building their own frame.
 */
const PRIMARY_NAV: PrimaryItem[] = [
  { label: 'Home', icon: Home, sub: '', match: 'exact' },
  { label: 'Dashboard', icon: LayoutDashboard, sub: '/dashboard', match: 'prefix' },
  { label: 'Draft board', icon: ClipboardList, sub: '/draft', match: 'prefix' },
]

/**
 * Reserved sidebar slots for Wave 5 (analysis) and Wave 6 (report/tools) —
 * rendered as visible, disabled "coming soon" rows (Nick's Clarify) so the IA
 * is legible now and each wave lights its slot rather than reframing the nav.
 * The `wave` field is the documented mount point for that future build.
 */
const FUTURE_NAV: { label: string; icon: LucideIcon; wave: 5 | 6 }[] = [
  { label: 'Score Trends', icon: LineChart, wave: 5 },
  { label: 'Luck Tracker', icon: Sparkles, wave: 5 },
  { label: 'Positional', icon: BarChart3, wave: 5 },
  { label: 'Playoff Picture', icon: Trophy, wave: 5 },
  { label: 'Trade Evaluator', icon: ArrowLeftRight, wave: 5 },
  { label: 'Waiver Wire', icon: PlusCircle, wave: 5 },
  { label: 'Season Report', icon: FileText, wave: 6 },
  { label: 'Free Agents', icon: Users, wave: 6 },
]

const NAV_ROW =
  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors'

/** Whether a primary section is the one currently shown. */
function isPrimaryActive(
  pathname: string,
  base: string,
  item: PrimaryItem
): boolean {
  const target = `${base}${item.sub}`
  if (item.match === 'exact') return pathname === target
  return pathname === target || pathname.startsWith(`${target}/`)
}

/**
 * Persistent admin navigation shell (Wave 4 nav-shell sub-section). A sidebar,
 * not top tabs — it scales past ~5 sections and gives constant-time access to
 * any one. Rendered by the [leagueId] layout so it persists across Home /
 * Dashboard / Draft without re-mounting, and owns the global chrome the
 * per-page headers used to duplicate (Nick's Clarify): the league selector
 * (the sticky context — switching sections never makes you re-pick the league)
 * and sign-out. Tablet/PC-first per MASTER_CONTEXT UX Architecture: a labelled
 * left rail from `md` up, a compact top bar below it (mobile stays rough here
 * by design — the spectator surface is the mobile-first build).
 */
export default function AdminSidebar({
  leagues,
  activeLeagueId,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const base = `/leagues/${activeLeagueId}`

  return (
    <>
      {/* Labelled left rail — tablet/PC */}
      <nav
        aria-label="Primary"
        className="hidden w-60 shrink-0 flex-col gap-1 border-r bg-background p-3 md:flex"
      >
        <div className="flex items-center gap-2 px-2 py-1.5">
          <LayoutDashboard
            className="size-5 text-muted-foreground"
            aria-hidden
          />
          <span className="font-heading text-base font-semibold tracking-tight">
            fantasy
          </span>
        </div>
        <div className="px-1 py-2">
          <LeagueSelector
            leagues={leagues}
            activeLeagueId={activeLeagueId}
            subPath=""
          />
        </div>
        <div className="flex flex-col gap-0.5">
          {PRIMARY_NAV.map((item) => {
            const active = isPrimaryActive(pathname, base, item)
            return (
              <Link
                key={item.label}
                href={`${base}${item.sub}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  NAV_ROW,
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            )
          })}
        </div>
        <Separator className="my-2" />
        <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
          Coming soon
        </p>
        <div className="flex flex-col gap-0.5">
          {FUTURE_NAV.map((item) => (
            <span
              key={item.label}
              aria-disabled="true"
              className={cn(NAV_ROW, 'cursor-not-allowed text-muted-foreground/40')}
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">{item.label}</span>
              <span className="text-xs font-normal">Soon</span>
            </span>
          ))}
        </div>
        <div className="mt-auto border-t pt-2">
          <SignOutButton />
        </div>
      </nav>

      {/* Compact top bar — below md; primary sections only, no future slots */}
      <div className="flex items-center gap-2 border-b bg-background p-2 md:hidden">
        <LeagueSelector
          leagues={leagues}
          activeLeagueId={activeLeagueId}
          subPath=""
        />
        <nav aria-label="Primary" className="ml-auto flex items-center gap-1">
          {PRIMARY_NAV.map((item) => {
            const active = isPrimaryActive(pathname, base, item)
            return (
              <Link
                key={item.label}
                href={`${base}${item.sub}`}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={cn(
                  'rounded-md p-2 transition-colors',
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <item.icon className="size-4" aria-hidden />
              </Link>
            )
          })}
        </nav>
        <SignOutButton />
      </div>
    </>
  )
}
