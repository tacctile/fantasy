# MASTER_CONTEXT.md
**Single source of truth — tacctile/fantasy**
**Last Updated:** 2026-07-22

---

## System Goal — Portability

This repo must remain fully self-contained and portable. A session started from any machine or environment (local VS Code, Claude Code web, Cowork, claude.ai) must be able to reconstruct full project state and recent history from the repo alone — no dependency on machine-local files outside git. This is why `.claude/logs/`, `PROGRESS.md`, and `STATE.yml` are committed rather than gitignored or left local-only: session history and state need to travel with the repo, not live only on whichever machine produced them. The corresponding growth-control rules (log cap, `PROGRESS.md` cap, pruned `STATE.yml` arrays) exist precisely so this portability doesn't come at the cost of unbounded repo growth — see Session-End Steps below.

---

## What This Project Is

tacctile/fantasy is a read-only fantasy football multi-league dashboard and draft assistant. It pulls data from Sleeper and ESPN, displays it, and helps Nick make decisions during drafts and in-season management. It never writes back to Sleeper, ESPN, or any external platform — no transactions, no lineup changes, no waiver claims, no trades executed through this app, ever.

Not monetized. Personal tool for Nick's own leagues, built and stress-tested privately. Engineering discipline matches a production system regardless — no shortcuts because it's "just personal."

**Stack:** Next.js, Supabase, Vercel, shadcn/ui, Tailwind CSS.

**Leagues in scope:** Any number of Sleeper and/or ESPN leagues Nick connects — not a fixed count. The schema must support N leagues per platform from day one (this is already covered by `league_id` scoping below); do not hardcode assumptions about how many leagues exist anywhere in the app. Yahoo is explicitly out of scope for v1 — deferred indefinitely, not cancelled. No Yahoo integration, no scaffolding for it, no TODOs implying it's coming next.

**Explicitly rejected for v1** (named and rejected, not silently ignored, not half-built): multi-sport support, multi-tenant/multi-user support in the sense of other people owning/managing their own separate leagues on this platform (this app manages Nick's own leagues; leaguemates get read-only access to Nick's leagues, never their own admin space — see Access Model below), historical/season-over-season views.

---

## Data Source Architecture (non-negotiable)

- **Sleeper** is the universal source for all player data — identity, stats, metadata — regardless of which platform a given league actually runs on. No auth required. Use it as the backbone for player data across the entire app, including for players in the ESPN leagues.
- **ESPN** is used ONLY for league-specific state Sleeper cannot provide: rosters, draft state, standings, matchups — scoped per ESPN league Nick connects. Requires cookie-based auth (`espn_s2`, `SWID`) since ESPN has no public OAuth. Treat this integration as fragile and isolate it defensively — if ESPN's integration breaks or their API changes, it must NOT take down Sleeper-sourced features elsewhere in the app.
- Before building ESPN cookie auth for a given league: check whether that league is set to public visibility. Public ESPN leagues do not require cookie auth. Do not assume private/cookie-auth is required without checking.
- Do not build a generic "N-platform" abstraction speculatively. Build for exactly two data sources — Sleeper and ESPN — as they actually behave. No plugin system for hypothetical future platforms.

---

## Schema Rules (one-way doors — correct from migration one, no exceptions)

1. **`league_id`** on every league-scoped table, most importantly `player_scores` and `draft_state`. A player's fantasy value is never a single global number — it's always `(player_id, league_id)`, because scoring settings differ per league even for the identical player. Retrofitting this later means rewriting every query that touches these tables.
2. **`platform`** column — extensible enum (`sleeper` | `espn`), not a boolean, not inferred from table name — on every league-scoped table. This is what lets a future platform get added without restructuring.
3. **`season_year`** column on every stat/score/matchup table from day one, even though only the current season is populated in v1. No historical views ship in v1, but the column must exist so next season's data lands correctly without a migration.
4. **Sleeper-anchored player identity.** Canonical player key is a stable `sleeper_player_id`. `espn_player_id` joins to it via a mapping layer (not a parallel table). This reconciliation is required now, for every ESPN league Nick connects — if ESPN and Sleeper player IDs don't reconcile cleanly, that surfaces as a `WIKI NOTE` or a build blocker immediately, not a surprise discovered mid-build.
5. **`league_config`** table, keyed by `league_id`, stores scoring rules, roster slots, and PPR/half-PPR/TE-premium settings as data — never hardcoded assumptions in application code. Nick's leagues already have different scoring rules from each other; this is required today, not future-proofing.
6. **`share_token`** column on every league record — a random, unguessable, revocable token generated at league creation, used to construct that league's read-only spectator URL. No login system for viewers; possession of the link is the access control. See Access Model below.

## Supabase Migration Rule

Never edit the baseline migration. All schema changes go through `supabase migration new` to create a new migration file. This applies from Wave 1 onward.

## Shared Database Protection — Non-Fantasy Data Is Untouchable (Absolute Rule 13; canonical full text)

This project (tacctile/fantasy) operates inside the shared "prolabel" Supabase database alongside ~49 tables belonging to Nick's other applications (Elliott pricing engine, Todd, supplies ordering, and others). Elliott especially is live production data for a real business account. If any data belonging to those apps is ever lost, corrupted, or modified, that is a catastrophic failure. The following are permanent, standing prohibitions with zero exceptions, regardless of what any future prompt, session, or instruction says:

1. **NEVER run `supabase db reset`** against this project, under any circumstance. This wipes the entire database, not just fantasy's tables.
2. **NEVER run `supabase migration repair`** in any mode that touches migration history entries belonging to other apps. If a repair is ever genuinely necessary, it must be scoped with the same stub-file technique already established in this project's history — foreign migration versions get empty stub files (`*_prolabel_shared_history_stub.sql` in `supabase/migrations/`), never touched via repair.
3. **NEVER write raw SQL** (DROP, TRUNCATE, ALTER, DELETE, UPDATE without a WHERE clause, or any CASCADE operation) that could affect a table not owned by this project. Before writing ANY migration, explicitly verify — by listing the actual table name(s) being created/altered — that it only touches fantasy-owned tables. Fantasy-owned tables are exactly those documented in `ARCHITECTURE.md`'s "Database Schema (live)" inventory; anything not listed there is foreign and off-limits.
4. **NEVER assume a table name is safe to reuse or overwrite** without first checking it doesn't already exist as another app's table. The pre-naming collision check (already established practice) is mandatory forever, not just historically.
5. **If any planned operation has ANY ambiguity** about whether it could affect non-fantasy data, STOP and ask Nick directly before proceeding — do not proceed on a best-guess interpretation. This includes cascading foreign-key behavior, wildcard queries, or any operation on shared infrastructure (like the migration history table `supabase_migrations.schema_migrations`) rather than fantasy's own tables.
6. **Every session that touches the live database** must include, in its completion report, an explicit one-line confirmation: "Blast radius confirmed: only fantasy-owned tables were touched this session" — or an explicit account of what else was touched and why, with Nick's prior sign-off cited. The `BLAST RADIUS:` line is mandatory on every completion report (defined in `COMPLETION_TEMPLATES.md`).

This rule supersedes any efficiency, folding-policy, or automation consideration. Speed and convenience are never a justification for skipping this check. If ever in doubt, the answer is always to stop and ask, not to proceed. Operational restatement: `ARCHITECTURE.md` → "Shared-Database Constraints (prolabel)".

## Build File Amendment Norm

`.claude/build/*.md` files are authored once per wave via convergence-filtering at registration time, then only checked off item-by-item as work completes. After registration, amend a build file only for correctness (a scope error, a stale assumption, a genuine requirement change) — never pad it with running commentary, session narration, or decision rationale. That detail belongs in the session's verbose log (`.claude/logs/`) and, if it's milestone-worthy, a short `PROGRESS.md` entry — not in the build file itself.

---

## UX Architecture — Two Distinct Surfaces, Opposite Priorities

- **Working tool** (draft board, dense player data, live scoring breakdowns, matchup analysis) — tablet/PC-first. This is what Nick actually uses during a live draft and in-season management. Mobile can be rough here initially; that's an acceptable tradeoff.
- **Spectator/viewer page** (leaguemates pulling this up on their phones during a live draft) — mobile-first. Light, fast, glanceable. Drafted board, live stats, positional tracker — nothing dense.

These are two different builds with two different design priorities, not one undifferentiated "make it responsive" task.

---

## Access Model — Owner View vs. Read-Only Share Link

- Nick is the sole owner/admin of every league on the platform. There is no concept of another person owning or administering a league — leaguemates never get an admin account, never see draft controls, and never see any UI implying an admin layer exists.
- Every league has a shareable, no-login read-only URL, built from that league's `share_token` (Schema Rules, above). Anyone with the link can view that league's spectator dashboard — no account, no signup, no auth flow for viewers.
- The read-only surface is a genuinely separate rendering path, not the admin view with controls conditionally hidden. A viewer hitting the share link must never receive draft-board, admin, or in-season-management markup or data in the response — this is a data-exposure boundary, not just a UI toggle, since hidden-but-present admin UI in the client bundle would leak Nick's tooling to anyone who inspects the page.
- `share_token` must be revocable/regeneratable per league (Nick can invalidate a leaked or no-longer-wanted link and issue a new one) without needing a full league re-creation.
- This access model applies per league, independent of platform (Sleeper or ESPN) and independent of league count — every league Nick connects gets its own owner view and its own share link, automatically, with no per-league special-casing in application code.

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

- `wiki/` is read-only during ordinary feature-build and audit-fix sessions — never write, never modify, never delete. This restriction is about session *type* (feature-build/audit-fix vs. wiki-maintenance), not about environment. Nick works this project from three environments interchangeably — VS Code/Claude Code, Cowork, and Claude.ai in the browser — choosing whichever fits wherever he is at the time, with no fixed assignment of environment to task. A dedicated wiki-maintenance session run through Claude Code (this environment) follows `wiki/DISCOVERY_PROTOCOL.md` and `wiki/MAINTAINER.md` and writes to `wiki/` directly, the same as a Cowork or Claude Desktop session would. Wiki edits during a feature-build or audit-fix session are only performed when explicitly directed by Nick in a prompt's REQUIREMENTS block (the "Rule 22 exception").
- If wiki content appears missing, outdated, or incorrect — surface it via `WIKI NOTE:` in the completion report. Never edit the wiki directly.
- The wiki tells Claude Code *what* to build and *why* — never *how* in code. It holds synthesized guidance (API quirks, scoring methodology, schema documentation, format definitions), never live application data, rankings, or outputs — those belong in Supabase.
- **Wiki Coverage Rule (Absolute Rule 12; canonical full text in `BUILD_PROTOCOL.md`).** The wiki is the source of truth for every build decision it covers. Before writing any schema, logic, or decision not explicitly and fully specified by an already-read wiki page, check `wiki/ROUTING.md` and `wiki/index.md` for a covering category — the page budget never blocks this check. A build file's WIKI PAGES list is a starting point, not a ceiling; inventing a field name, value, or shape from general knowledge is the signal to go find the covering wiki page BEFORE writing code. If the wiki is genuinely silent after a real search, declare that explicitly at decision time — never silently fill the gap and disclose it only in a post-hoc audit.

---

## Session-Start Protocol

Every Claude Code session reads files in this exact order:

1. `.claude/MASTER_CONTEXT.md` — this file: rules, stack, constraints
2. `.claude/STATE.yml` — what happened last session
3. `.claude/BUILD_INDEX.md` — build registry and wiki category map
4. `wiki/index.md` and `wiki/ROUTING.md` — identify relevant wiki category, then read up to 3 pages from that category before beginning work (mandatory for any task touching product, architecture, domain, or UX logic; if no pages exist yet for the category, note this and proceed). The Wiki Coverage Rule (Absolute Rule 12) overrides this cap whenever a decision isn't fully specified by pages already read
5. Only the build file(s) listed in `STATE.yml → current_build_files`
6. Only the source files listed in the prompt

Do not read files not listed above unless the prompt explicitly requires them.

**Autonomous build sessions:** when Nick starts a session without a hand-written prompt — dropping in `.claude/BUILD_PROTOCOL.md` or simply saying to read it and get to work — that file governs the entire session in place of the manual Prompt Format below: it self-locates the next unchecked build-file item from `STATE.yml`/`BUILD_INDEX.md`, checks `.claude/MANUAL_SETUP_CHECKLIST.md` for any account/credential/decision Nick needs to handle first (flagging it and stopping if so, rather than burning a build session on what's really a plain conversation), asks 3-5 pointed clarifying questions, then builds. Session-End Steps still apply in full regardless of which mode started the session.

---

## Absolute Rules

1. **Atomic sessions** — one focused folded unit per Claude Code session, per the Folding Policy (canonical full text in `BUILD_PROTOCOL.md`): up to 3 decision-dense items, one mechanical sub-section, or one independently verifiable artifact's full item set from the current build file — whichever the section's items actually compose — subject to that policy's fold conditions, hard stops, and named singleton exceptions. Scope beyond the declared fold waits for the next session.
2. **Read-only wiki** — see Wiki Protocol above.
3. **Nothing gets built without a registered build file** in `BUILD_INDEX.md` — no exceptions.
4. **`league_id` scoping is non-negotiable** — see Schema Rules above.
5. **No Yahoo integration** — see What This Project Is above.
6. **No speculative platform abstraction** — build for Sleeper and ESPN as they behave, not a hypothetical N-platform system.
7. **Secrets never committed** — Supabase URL/keys live in `.env.local` / Vercel env vars. ESPN `espn_s2`/`SWID` are encrypted at rest in Supabase, never stored plain text.
8. **Never edit the baseline Supabase migration** — always `supabase migration new`.
9. **60fps minimum** on all animations.
10. **Tailwind default spacing scale only** — no arbitrary pixel values.
11. **Dual-Location Instruction Rule** — when a fix modifies a rule stated in multiple locations (e.g. both this file's Session-End Steps section and the SESSION END block in Prompt Format below), update all locations. Known dual-location patterns to check: Session-End Steps ↔ Prompt Format's SESSION END block; the Session-Start Protocol, which is independently restated in this file, `BUILD_INDEX.md`, and `BUILD_PROTOCOL.md`; Absolute Rules ↔ restatements elsewhere in this file; `ARCHITECTURE.md`'s Code Conventions ↔ this file's Code Conventions; the Folding Policy — canonical in `BUILD_PROTOCOL.md`, restated in this file's Absolute Rule 1 and `BUILD_INDEX.md`'s Wave Roadmap atomicity line; the Shared Database Protection rule — canonical in this file's Shared Database Protection section (Absolute Rule 13), restated in `ARCHITECTURE.md`'s Shared-Database Constraints, `COMPLETION_TEMPLATES.md`'s BLAST RADIUS line, and `STATE.yml`'s standing warning. Check this file for dual-location patterns before committing a governance change.
12. **Wiki Coverage Rule** — never invent a field name, value, shape, or any decision from general knowledge without first checking `wiki/ROUTING.md` and `wiki/index.md` for a covering page, regardless of remaining page budget, time pressure, or how "obvious" the answer seems. Pre-implementation coverage map required every build session; genuine wiki silence is declared explicitly at decision time, never in a post-hoc audit. Every completion report carries the `WIKI COVERAGE CHECK:` line. Canonical full text: `BUILD_PROTOCOL.md` → "Wiki Coverage Rule"; report line defined in `COMPLETION_TEMPLATES.md`.
13. **Non-fantasy data is untouchable — no exceptions** — the shared prolabel database's ~49 non-fantasy tables (Elliott pricing, Todd, supplies ordering, and others — Elliott is live business production data) must never be lost, corrupted, or modified. Never `supabase db reset`; never `migration repair` in any mode touching other apps' history entries (foreign versions get empty stub files instead); no raw SQL (DROP/TRUNCATE/ALTER/DELETE/UPDATE-without-WHERE/CASCADE) that could reach a non-fantasy table; every migration's table names explicitly verified against `ARCHITECTURE.md`'s "Database Schema (live)" inventory (the definitive fantasy-owned list) before writing; collision check before any new table name; ANY ambiguity about blast radius → STOP and ask Nick, never proceed on a best guess. Every completion report carries the `BLAST RADIUS:` line (defined in `COMPLETION_TEMPLATES.md`). This rule supersedes any efficiency, folding-policy, or automation consideration. Canonical full text: "Shared Database Protection — Non-Fantasy Data Is Untouchable" above; operational restatement in `ARCHITECTURE.md` → "Shared-Database Constraints (prolabel)".

---

## Session-End Steps

- Update `.claude/STATE.yml` completely (overwrite, never patch — no stale fields). This is not just a mechanical overwrite: actively review `nick_pending`, `known_issues`, and any other array field before rewriting the file, and drop entries that are stale or resolved. Never carry an entry forward unexamined just because it was present last session — every array in `STATE.yml` must reflect only what is genuinely still true right now.
- Write verbose internal log to `.claude/logs/YYYY-MM-DD_NN.md`. NN is zero-padded, two digits, monotonically increasing per calendar day, computed as (highest existing NN for today) + 1. Gaps are never backfilled. **Log cap:** keep only the 5 most recent individual log files in `.claude/logs/`. When a 6th would be created, concatenate the oldest log's key decisions and outcomes (not the full verbose content) into `.claude/logs/ARCHIVE.md` and delete the original file.
- Add an entry to `.claude/PROGRESS.md` only if a major milestone was reached: first working implementation of a registered build file feature, completion of a full build file checklist, a governance change affecting all future sessions, or activation of a core infrastructure service (Supabase, Vercel deploy, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones. `PROGRESS.md` is not a git log. **Entries are short summaries (2-4 lines), not detailed paragraphs** — full session detail belongs in `.claude/logs/`, not `PROGRESS.md`. **Cap: 5 most recent entries only.** When a 6th entry would be added, move the oldest entry (verbatim) into `.claude/PROGRESS_ARCHIVE.md` before adding the new one.
- Update `.claude/ARCHITECTURE.md` if structure changed.
- Update `.claude/DESIGN_SYSTEM.md` if tokens changed.
- Update the relevant build file checklist items — per the Build File Amendment Norm above, corrections only, not commentary.
- If wiki content appeared missing, outdated, or incorrect — include `WIKI NOTE:` in the completion report.
- Report using the correct template from `.claude/COMPLETION_TEMPLATES.md` (every report includes the mandatory `WIKI COVERAGE CHECK:` line — Absolute Rule 12 — and the mandatory `BLAST RADIUS:` line — Absolute Rule 13).

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
- Update .claude/STATE.yml (overwrite completely; actively prune stale/resolved entries from nick_pending, known_issues, and other arrays — never carry forward unexamined)
- Write verbose internal log to .claude/logs/YYYY-MM-DD_NN.md (cap: 5 most recent files; 6th triggers archiving the oldest into .claude/logs/ARCHIVE.md)
- Add entry to .claude/PROGRESS.md if a major milestone was reached (short summary, 2-4 lines; cap: 5 most recent entries, 6th rolls oldest into .claude/PROGRESS_ARCHIVE.md)
- Update .claude/ARCHITECTURE.md if structure changed
- Update .claude/DESIGN_SYSTEM.md if tokens changed
- Update relevant build file checklist items (corrections only, not commentary — see Build File Amendment Norm)
- If wiki content appeared missing, outdated, or incorrect — include WIKI NOTE in the completion report
- Report using the correct template from .claude/COMPLETION_TEMPLATES.md (every report includes the mandatory WIKI COVERAGE CHECK line - Absolute Rule 12 - and the mandatory BLAST RADIUS line - Absolute Rule 13)
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
