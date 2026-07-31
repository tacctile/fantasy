import type {
  PlayoffPictureData,
  PlayoffStatus,
  PlayoffTeam,
} from '@/services/playoff-picture'

/**
 * The Playoff Picture section's status vocabulary, clinch sentences, and shared
 * disclosures (Wave 5 — Playoff picture, item 4).
 *
 * Written once here rather than inline in the table, exactly as `luck-notes.ts`
 * and `positional-notes.ts` are, so the table and the interactive layer built on
 * top of it can never describe the same status two different ways. It matters
 * more on this surface than on its siblings: a status word here is a CLAIM about
 * what is mathematically settled, and two phrasings of it would read as two
 * different claims.
 *
 * Nothing in this file computes anything. Every number it prints was decided by
 * `services/playoff-picture.ts` against the same field size; this layer only
 * chooses words for it.
 */

/** The four badge labels the build file names, and the honest fifth non-verdict. */
export const STATUS_LABEL: Record<PlayoffStatus, string> = {
  clinched: 'Clinched',
  controls_own_path: 'Controls Own Path',
  needs_help: 'Needs Help',
  eliminated: 'Eliminated',
  undetermined: 'Undetermined',
}

/**
 * Badge tone per status, as semantic token classes — never inline colour.
 *
 * `--positive` for clinched and `--destructive` for eliminated are the two
 * settled verdicts. Contention deliberately does NOT get a graded warm-to-cool
 * ramp: a ramp reads as a likelihood scale, and this section is barred from
 * anything probability-shaped (build file item 6). `Controls Own Path` gets a
 * plain outline and `Needs Help` gets `--warning`, which MASTER_CONTEXT reserves
 * for roster-need and regenerate-confirm — the "you have an unmet condition"
 * meaning, which is precisely what needing outside results is.
 */
export const STATUS_CLASS: Record<PlayoffStatus, string> = {
  clinched: 'bg-positive/15 text-positive',
  controls_own_path: 'border-border text-foreground',
  needs_help: 'bg-warning/15 text-warning',
  eliminated: 'bg-destructive/10 text-destructive',
  undetermined: 'bg-muted text-muted-foreground',
}

/**
 * The plain-language clinch sentence for one team — the build file's mandated
 * pairing for the status badge.
 *
 * IT SAYS ONLY WHAT THE SERVICE COMPUTED (Nick's Clarify, 2026-07-31). The
 * build file's illustrative example ("Clinch with: a win, OR Team X loses")
 * implies a named-rival clause, and `resolveMagicNumber` deliberately counts a
 * team's OWN remaining wins only. Naming which rivals must lose needs pairwise
 * tiebreaker reasoning that the previous session declared genuine wiki silence
 * on and declined to invent; printing it here would smuggle that invention into
 * the presentation layer, where it would read as equally authoritative as the
 * magic number beside it. So `needs_help` states the shape of its dependency
 * without naming a rival, which is true and checkable.
 */
export function clinchSentence(team: PlayoffTeam): string {
  const games = team.gamesRemaining
  const gameWord = games === 1 ? 'game' : 'games'

  switch (team.status) {
    case 'clinched':
      return 'In. A berth is secured regardless of every remaining result.'
    case 'eliminated':
      return `Out. Winning all ${games} remaining ${gameWord} would still leave the field full above them.`
    case 'controls_own_path':
      if (team.magicNumber === null) {
        // Unreachable through resolveMagicNumber's own gate, but stated rather
        // than crashed: a status without its number is still a true status.
        return 'Alive, and their own results are enough — no clinch number available.'
      }
      return team.magicNumber === 1
        ? 'Clinch with 1 more win, whatever else happens.'
        : `Clinch with ${team.magicNumber} more wins, whatever else happens.`
    case 'needs_help':
      return games === 0
        ? 'Still alive, but with no games left the outcome rests entirely on other results.'
        : `Winning out is not enough on its own — needs results elsewhere as well as their own ${games} ${gameWord}.`
    case 'undetermined':
      return 'Not enough is known yet to say.'
  }
}

/**
 * Why the whole table has no verdicts, when it has none. Null when the field
 * size resolved — the ordinary case needs no explanation.
 *
 * This is the disclosure that makes the "never default a field size" ruling
 * legible to a reader. Without it, an unsynced league shows ten Undetermined
 * badges and looks broken rather than honest.
 */
export function fieldSizeNote(data: PlayoffPictureData): string | null {
  if (data.fieldSize === null) {
    return "This league's settings don't say how many teams make the playoffs, so no team is given a clinched or eliminated verdict. A guessed field size would produce confident badges that are simply wrong."
  }
  if (data.fieldSizeClamped) {
    return `Settings configure ${data.rules.playoffTeams} playoff spots for ${data.teams.length} teams — read as ${data.fieldSize}, since a field at least as large as the league makes every team trivially clinched.`
  }
  return null
}

/**
 * The week/scope line, in the same shape Score Trends, Luck, and Positional all
 * use, so a reader who has seen one recognises this.
 */
export function playoffScopeNote(data: PlayoffPictureData): string {
  const weeks =
    data.weeksCounted === 0
      ? 'No weeks scored yet'
      : `${data.weeksCounted} ${data.weeksCounted === 1 ? 'week' : 'weeks'} counted`
  const scope =
    data.rules.playoffWeekStart === null
      ? 'all scored weeks'
      : `regular season (playoffs start week ${data.rules.playoffWeekStart})`
  const provisional =
    data.nonFinalWeeksCounted > 0
      ? ` · ${data.nonFinalWeeksCounted} unofficial`
      : ''
  const remaining =
    data.gamesRemainingTotal === 0
      ? ''
      : ` · ${data.gamesRemainingTotal} scheduled ${
          data.gamesRemainingTotal === 1 ? 'game' : 'games'
        } left`
  return `${weeks} · ${scope}${provisional}${remaining}`
}

/**
 * The exhausted-schedule disclosure. `scheduleExhausted` means no unscored
 * regular-season game is visible — which is EITHER a finished regular season OR
 * a league whose future weeks were never synced. The service is explicit that it
 * cannot tell those apart, so the surface says so rather than presenting a
 * settled picture that might just be missing data.
 */
export function scheduleExhaustedNote(data: PlayoffPictureData): string | null {
  if (!data.scheduleExhausted) return null
  return 'No unplayed regular-season games are visible, so every status below is final as far as this data goes. If the season is still running, run the full-season matchup sync so future weeks land — this cannot tell a completed season from an unsynced one.'
}

/**
 * The standings cross-check disclosure. Seeds here are RECOMPUTED from matchup
 * pairings rather than read from the standings snapshot; a disagreement is
 * surfaced rather than silently resolved in favour of either side.
 */
export function standingsDisagreementNote(
  data: PlayoffPictureData
): string | null {
  if (!data.hasStandingsDisagreement) return null
  const count = data.teams.filter((team) => team.disagreesWithStandings).length
  return `${count} ${count === 1 ? 'team has a record' : 'teams have records'} here that differ from the synced standings snapshot. Seeds are recomputed from regular-season matchup results, which excludes playoff games and commissioner adjustments the snapshot absorbs. Neither is overridden — the differing rows are marked.`
}

/**
 * The divisions disclosure. Divisions are DETECTED and never applied to seed
 * order, because no source documents how the platform seeds division winners —
 * so a league that uses them will visibly differ from its platform's own seeding
 * rather than differ silently.
 */
export function divisionsNote(data: PlayoffPictureData): string | null {
  if (!data.rules.hasDivisions) return null
  return `This league configures ${data.rules.divisionCount} divisions. Seeding below ignores them — no documented source describes how division winners are seeded, so applying a rule would be a guess. Expect the seed order to differ from the platform's own.`
}

/**
 * The first-round-bye line, or null when the field size isn't known. Always
 * labelled inferred: byes are not a stored field anywhere in this platform, and
 * this count is arithmetic on the bracket size, not something read from a
 * bracket resource.
 */
export function byeNote(data: PlayoffPictureData): string | null {
  const byes = data.rules.firstRoundByes
  if (byes === null || data.fieldSize === null) return null
  if (byes === 0) return null
  return `${byes} first-round ${byes === 1 ? 'bye' : 'byes'} inferred from a ${data.fieldSize}-team field — byes are not a stored field, so this is arithmetic on the bracket size, not a synced bracket. The clinch numbers count down to a berth only, never to a bye.`
}

/** Every applicable disclosure, in the order a reader should meet them. */
export function playoffNotes(data: PlayoffPictureData): string[] {
  return [
    fieldSizeNote(data),
    scheduleExhaustedNote(data),
    divisionsNote(data),
    byeNote(data),
    standingsDisagreementNote(data),
  ].filter((note): note is string => note !== null)
}
