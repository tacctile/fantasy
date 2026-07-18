# MASTER_CONTEXT.md
**Single source of truth — tacctile/fantasy**
**Last Updated:** 2026-07-18

---

## What This Project Is

tacctile/fantasy is a read-only fantasy football multi-league dashboard and draft assistant. It pulls data from Sleeper and ESPN, displays it, and helps Nick make decisions during drafts and in-season management. It never writes back to Sleeper, ESPN, or any external platform — no transactions, no lineup changes, no waiver claims, no trades executed through this app, ever.

Not monetized. Personal tool for Nick's own leagues, built and stress-tested privately. Engineering discipline matches a production system regardless — no shortcuts because it's "just personal."

**Stack:** Next.js, Supabase, Vercel, shadcn/ui, Tailwind CSS.

**Leagues in scope:** 2 Sleeper leagues, 2 ESPN leagues. A 5th league (Yahoo) is explicitly out of scope for v1 — deferred indefinitely, not cancelled. No Yahoo integration, no scaffolding for it, no TODOs implying it's coming next.

**Explicitly rejected for v1** (named and rejected, not silently ignored, not half-built): multi-sport support, multi-tenant/multi-user support (this app manages Nick's own leagues, not other people's accounts), historical/season-over-season views.

---

## Data Source Architecture (non-negotiable)

- **Sleeper** is the universal source for all player data — identity, stats, metadata — regardless of which platform a given league actually runs on. No auth required. Use it as the backbone for player data across the entire app, including for players in the ESPN leagues.
- **ESPN** is used ONLY for league-specific state Sleeper cannot provide: rosters, draft state, standings, matchups — scoped to the 2 ESPN leagues specifically. Requires cookie-based auth (`espn_s2`, `SWID`) since ESPN has no public OAuth. Treat this integration as fragile and isolate it defensively — if ESPN's integration breaks or their API changes, it must NOT take down Sleeper-sourced features elsewhere in the app.
- Before building ESPN cookie auth for a given league: check whether that league is set to public visibility. Public ESPN leagues do not require cookie auth. Do not assume private/cookie-auth is required without checking.
- Do not build a generic "N-platform" abstraction speculatively. Build for exactly two data sources — Sleeper and ESPN — as they actually behave. No plugin system for hypothetical future platforms.

---

## Schema Rules (one-way doors — correct from migration one, no exceptions)

1. **`league_id`** on every league-scoped table, most importantly `player_scores` and `draft_state`. A player's fantasy value is never a single global number — it's always `(player_id, league_id)`, because scoring settings differ per league even for the identical player. Retrofitting this later means rewriting every query that touches these tables.
2. **`platform`** column — extensible enum (`sleeper` | `espn`), not a boolean, not inferred from table name — on every league-scoped table. This is what lets a future platform get added without restructuring.
3. **`season_year`** column on every stat/score/matchup table from day one, even though only the current season is populated in v1. No historical views ship in v1, but the column must exist so next season's data lands correctly without a migration.
4. **Sleeper-anchored player identity.** Canonical player key is a stable `sleeper_player_id`. `espn_player_id` joins to it via a mapping layer (not a parallel table). This reconciliation is required now, for the 2 ESPN leagues — if ESPN and Sleeper player IDs don't reconcile cleanly, that surfaces as a `WIKI NOTE` or a build blocker immediately, not a surprise discovered mid-build.
5. **`league_config`** table, keyed by `league_id`, stores scoring rules, roster slots, and PPR/half-PPR/TE-premium settings as data — never hardcoded assumptions in application code. Nick's 5 leagues already have different scoring rules from each other; this is required today, not future-proofing.

## Supabase Migration Rule

Never edit the baseline migration. All schema changes go through `supabase migration new` to create a new migration file. This applies from Wave 1 onward.

---

## UX Architecture — Two Distinct Surfaces, Opposite Priorities

- **Working tool** (draft board, dense player data, live scoring breakdowns, matchup analysis) — tablet/PC-first. This is what Nick actually uses during a live draft and in-season management. Mobile can be rough here initially; that's an acceptable tradeoff.
- **Spectator/viewer page** (leaguemates pulling this up on their phones during a live draft) — mobile-first. Light, fast, glanceable. Drafted board, live stats, positional tracker — nothing dense.

These are two different builds with two different design priorities, not one undifferentiated "make it responsive" task.

---

## Code Conventions

Reflects actual patterns as they're established in `src/`. Follow when adding or editing code.

**Imports:**
- Cross-directory imports use the `@/` alias.
- Same-directory and sibling-directory imports use relative paths.
- Never use `@/` to reach a sibling file.
- Never use `../`-walking imports — if a file needs to reach up and back down, use `@/` instead.

**Exports:**
- React components use default exports.
- Services, hooks, stores, utilities, and types use named exports. Default exports are reserved for components.
- Type-only exports use `export type` (required for TypeScript `isolatedModules`).

**Barrel exports (`index.ts`):**
- Used at the directory level for service/component directories that expose a public surface.
- When a directory has an `index.ts`, import from the directory, not the file directly.
- When adding to a directory that already has an `index.ts`, re-export new public symbols from it.
- Do not create new `index.ts` files in directories that don't already have one.

**TypeScript:**
- No `any` without explicit justification.

**JSX runtime:** default React JSX runtime (no custom pragma). Next.js standard.

---

## Design Token Discipline

- Reference CSS variables per shadcn convention (`--background`, `--radius`, etc.). Zero inline hex values ever — if a color isn't available as a token, add it to the token set first.
- Spacing comes from Tailwind's default scale only. No arbitrary pixel values.
- Radius via shadcn's `--radius` CSS variable, not a fixed custom scale.
- Icon library: `lucide-react` (standard shadcn pairing).
- Actual color/token values are decided in Wave 1 against a real UI — not specified here in advance.
- Animation: 60fps minimum, test on lower-spec hardware. Prefer CSS transitions for simple state changes (hover, active, focus). Use `requestAnimationFrame` only for continuous rendering loops.
- Tabular numbers (`font-variant-numeric: tabular-nums`) on all data displays.

**New Component Checklist:**
- [ ] TypeScript props interface (no `any`)
- [ ] JSDoc comment describing purpose
- [ ] Wrapped in an error boundary (major components)
- [ ] Zero inline hex values — CSS variables only
- [ ] Tailwind default spacing scale only — no arbitrary pixels
- [ ] Tabular numbers for data displays
- [ ] Loading/error/empty states handled for async operations
- [ ] Corresponding test file (goal — not yet enforced for all)

---

## Wiki Protocol

- `wiki/` is strictly read-only for Claude Code — never write, never modify, never delete, during feature-build and audit-fix sessions. Wiki governance file edits are only performed when explicitly directed by Nick in a prompt's REQUIREMENTS block (the "Rule 22 exception").
- If wiki content appears missing, outdated, or incorrect — surface it via `WIKI NOTE:` in the completion report. Never edit the wiki directly.
- The wiki tells Claude Code *what* to build and *why* — never *how* in code. It holds synthesized guidance (API quirks, scoring methodology, schema documentation, format definitions), never live application data, rankings, or outputs — those belong in Supabase.

---

## Session-Start Protocol

Every Claude Code session reads files in this exact order:

1. `.claude/MASTER_CONTEXT.md` — this file: rules, stack, constraints
2. `.claude/STATE.yml` — what happened last session
3. `.claude/BUILD_INDEX.md` — build registry and wiki category map
4. `wiki/index.md` and `wiki/ROUTING.md` — identify relevant wiki category, then read up to 3 pages from that category before beginning work (mandatory for any task touching product, architecture, domain, or UX logic; if no pages exist yet for the category, note this and proceed)
5. Only the build file(s) listed in `STATE.yml → current_build_files`
6. Only the source files listed in the prompt

Do not read files not listed above unless the prompt explicitly requires them.

---

## Absolute Rules

1. **Atomic prompts** — one focused task per Claude Code session.
2. **Read-only wiki** — see Wiki Protocol above.
3. **Nothing gets built without a registered build file** in `BUILD_INDEX.md` — no exceptions.
4. **`league_id` scoping is non-negotiable** — see Schema Rules above.
5. **No Yahoo integration** — see What This Project Is above.
6. **No speculative platform abstraction** — build for Sleeper and ESPN as they behave, not a hypothetical N-platform system.
7. **Secrets never committed** — Supabase URL/keys live in `.env.local` / Vercel env vars. ESPN `espn_s2`/`SWID` are encrypted at rest in Supabase, never stored plain text.
8. **Never edit the baseline Supabase migration** — always `supabase migration new`.
9. **60fps minimum** on all animations.
10. **Tailwind default spacing scale only** — no arbitrary pixel values.
11. **Dual-Location Instruction Rule** — when a fix modifies a rule stated in multiple locations (e.g. both `STATE.yml`'s session-end steps and this file's Session-Start Protocol), update all locations. Check this file for dual-location patterns before committing a governance change.

---

## Session-End Steps

- Update `.claude/STATE.yml` completely (overwrite, never patch — no stale fields).
- Write verbose internal log to `.claude/logs/YYYY-MM-DD_NN.md`. NN is zero-padded, two digits, monotonically increasing per calendar day, computed as (highest existing NN for today) + 1. Gaps are never backfilled.
- Add an entry to `.claude/PROGRESS.md` only if a major milestone was reached: first working implementation of a registered build file feature, completion of a full build file checklist, a governance change affecting all future sessions, or activation of a core infrastructure service (Supabase, Vercel deploy, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones. `PROGRESS.md` is not a git log.
- Update `.claude/ARCHITECTURE.md` if structure changed.
- Update `.claude/DESIGN_SYSTEM.md` if tokens changed.
- Update the relevant build file checklist items.
- If wiki content appeared missing, outdated, or incorrect — include `WIKI NOTE:` in the completion report.
- Report using the correct template from `.claude/COMPLETION_TEMPLATES.md`.

There is no postmortem system for this project. No `build_session_count` tracking, no postmortem trigger, no postmortem audit file.

---

## Prompt Format

Every prompt sent to Claude Code follows this structure, in one plain-text code block:

```
SESSION TYPE: [feature-build / audit-fix / non-code]
TASK: [What needs to be done — one sentence]
CONTEXT: [Why this change is needed, what currently exists]

READ FIRST:
- .claude/MASTER_CONTEXT.md
- .claude/STATE.yml
- .claude/BUILD_INDEX.md
- wiki/index.md
- wiki/ROUTING.md
- .claude/build/[relevant build file]
- [relevant source files only — no extras]

REQUIREMENTS:
1. Specific requirement
2. Specific requirement

DO NOT:
- Touch these files
- Change this behavior

SESSION END:
- Update .claude/STATE.yml (overwrite completely)
- Write verbose internal log to .claude/logs/YYYY-MM-DD_NN.md
- Add entry to .claude/PROGRESS.md if a major milestone was reached
- Update .claude/ARCHITECTURE.md if structure changed
- Update .claude/DESIGN_SYSTEM.md if tokens changed
- Update relevant build file checklist items
- If wiki content appeared missing, outdated, or incorrect — include WIKI NOTE in the completion report
- Report using the correct template from .claude/COMPLETION_TEMPLATES.md
```

**Formatting Rules:**
1. Entire prompt in ONE code block — one-click copy.
2. Plain text inside — no markdown formatting within the code block.
3. `SESSION TYPE` declared at the top of every prompt.
4. Numbered `REQUIREMENTS` — easy reference during execution.
5. Full file paths always from project root.
6. Specific values, not vague adjectives — a concrete number/name, not "fast" or "a nice color."
7. `MASTER_CONTEXT.md` + `STATE.yml` + `BUILD_INDEX.md` + `wiki/index.md` always in `READ FIRST`.
8. `SESSION END` block is never shortened or omitted.
