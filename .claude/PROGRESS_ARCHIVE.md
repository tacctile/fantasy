# PROGRESS_ARCHIVE.md
**Archive for entries rolled off PROGRESS.md — tacctile/fantasy**

Entries move here when PROGRESS.md exceeds its 5-entry cap (oldest rolls off first). This file is append-only and not read as part of the standard Session-Start Protocol — consult it only when researching project history predating the 5 most recent milestones.

Oldest entry on top (chronological, opposite of PROGRESS.md's newest-first order).

---

## 2026-07-18 — .claude/ Governance Scaffold Established

Committed the full `.claude/` build-governance system for tacctile/fantasy, adapted from `tacctile/tacctile_webapp`'s governance model. This is a governance system change affecting all future sessions.

**What was established:**
- `CLAUDE.md` auto-loader (root) + `.claude/MASTER_CONTEXT.md` — rules, stack, schema requirements, data source architecture, UX split, code conventions, design token discipline, session-start protocol, absolute rules
- `.claude/STATE.yml` — session state tracking
- `.claude/BUILD_INDEX.md` — 6-wave roadmap (Foundation, Data Pipeline, Draft Assistant 3a/3b, League Dashboard, Eye Candy, Report+Tools), wiki category map
- `.claude/ARCHITECTURE.md` — satellite doc, Code Conventions, Supabase migration rule
- `.claude/DESIGN_SYSTEM.md` — token/scale/radius discipline for Tailwind+shadcn, lucide-react as icon library
- `.claude/COMPLETION_TEMPLATES.md` — 3 report templates, PROMPT SCORE rubric, Dual-Location Instruction Rule

**Deliberate scope decisions baked in:**
- No Yahoo integration (deferred indefinitely)
- No postmortem system (no build_session_count tracking, no postmortem trigger — dropped entirely, not deferred)
- No terminology/banned-word-list mechanic (fantasy has no product-identity language to protect)

**Wiki taxonomy reconciled, not overwritten:** `wiki/schema.yml` already had a live, content-populated 4-category taxonomy (player-evaluation, team-scheme, league-mechanics, in-season-management — 102+ existing pages) that predated this session. Merged rather than replaced: kept the 4 existing categories untouched, added 3 new technical categories (sleeper-api, espn-api, schema-reference) for platform-integration and schema documentation. draft-mechanics was considered and folded into league-mechanics — no separate draft-content cluster existed to justify a standalone category. Final taxonomy: 7 categories total. Updated `wiki/schema.yml`'s category enum and `system_files_required`, created 3 new `_index.md` stubs, extended `wiki/ROUTING.md`'s Category Routing Guide — all under the explicit Rule 22 exception authorized in this session's prompt.

**Not yet resolved:** none — all open items from the prior extraction series (category taxonomy, branch name, design token mechanism) were decided this session.

---

## 2026-07-21 — Wave 1 Execution Started: First Working Application Code (Project Scaffold)

First build session executed via `BUILD_PROTOCOL.md`. The Project scaffold section of `01_foundation.md` is complete: Next.js 16.2.11, shadcn/ui with CSS-variable theming, Tailwind v4 defaults. `npm run build`/`lint` pass. First working application code in the repo.

**Next:** Wave 1 (Foundation) — Supabase schema, env/secrets setup, initial Vercel deploy. Not started.

---

## 2026-07-21 — Scope Corrections: Open-Ended League Count, Access Model, Draft-Entry Sequencing

Three scope corrections landed in `MASTER_CONTEXT.md` and `BUILD_INDEX.md`, driven by a full extraction of Nick's prior conversation history on this project cross-checked against the committed repo state. This is a governance/scope change affecting all future build sessions.

**What changed:**
- **League count is now open-ended, not fixed.** Previous text hardcoded "2 Sleeper leagues, 2 ESPN leagues." Corrected to: the platform must support any number of Sleeper and/or ESPN leagues Nick connects — the schema already supports this via `league_id` scoping, this was a documentation framing fix, not an architecture change. Yahoo remains explicitly out of scope for v1, unchanged.
- **Access Model added** (`MASTER_CONTEXT.md`, new section after UX Architecture): Nick is sole owner/admin of every league; leaguemates get a no-login, revocable, per-league `share_token`-based read-only URL. The read-only surface is a genuinely separate rendering path — never the admin view with controls conditionally hidden — since leaked admin markup in a client bundle would expose Nick's draft tooling to viewers. Added as Schema Rule #6 (`share_token` column, one-way door, correct from migration one).
- **Wave 3b scope changed**: manual click-to-draft and live ESPN draft polling now ship together in v1, both writing to one shared `draft_state` table (first-write-wins) — no staged "manual first, poller as v2" sequencing (that staging was a real decision from an earlier session, explicitly reversed by Nick this session).
- **Wave 4 scope note added**: the read-only share-link dashboard is part of Wave 4 (League Dashboard), not a separate later build — same data, gated by `share_token` instead of owner auth.

**Why:** Nick ran a full extraction of every prior conversation touching this project (spanning an abandoned 2025 Bubble/no-code era and the current 2026 Next.js/Supabase era) and reconciled it against the live repo. Most of the extraction confirmed existing `MASTER_CONTEXT.md` content; these three items were genuine gaps or reversals Nick called out directly rather than items the extraction resolved on its own.

**Not yet resolved (at time of archiving):** ESPN league public/private visibility per league — was still pending Nick's confirmation before ESPN cookie-auth work begins.

---

## 2026-07-21 — Wave 4 Build File Registered

`.claude/build/04_league_dashboard.md` registered: fantasy-scoring engine, owner-authenticated standings/matchups/power-rankings, and the `share_token`-gated read-only spectator surface — built together, not staged separately.

---

## 2026-07-21 — Wave 5 Build File Registered

`.claude/build/05_eye_candy.md` registered: score charts, lucky/unlucky tracker, positional breakdowns, playoff picture engine. Extends the Wave 4 admin dashboard; only luck summary and playoff status get spectator equivalents.

---

## 2026-07-21 — Wave 6 Build File Registered (Build-Queue Scoping Complete)

`.claude/build/06_report_and_tools.md` registered — the final wave in the v1 roadmap. All six waves (01–06) are now registered, convergence-filtered build files. Build-queue planning phase is complete; next session should begin execution with Wave 1.

---

## 2026-07-21 — Supabase Infrastructure Activated (Wave 1, Session 2)

Supabase project `tszssadgsxjoymcttlwd` credentialed, linked, and CLI-workflowed — the full "Supabase project + migration workflow" section of `01_foundation.md` is complete. Keys captured in gitignored `.env.local` and validated live; CLI installed and linked. No schema exists yet — next up is the platform + identity migrations.

---

## 2026-07-21 — First Live Schema: Platform + Identity Foundation (Wave 1, Session 3)

First schema migrations live in Supabase: `platform` enum, `players` (Sleeper-anchored identity), `player_id_crosswalk` — all verified against the live DB. Discovered the linked project is Nick's shared multi-app "prolabel" database (confirmed intentional); adopted the empty-stub migration pattern for its 23 foreign history versions, and `db reset`/`migration repair` are now permanently forbidden (see ARCHITECTURE.md Shared-Database Constraints).

---

## 2026-07-21 — Governance: Wiki Coverage Rule (Absolute Rule 12)

New non-negotiable rule affecting all future build sessions, born from this session's provenance audit: a mandatory pre-implementation wiki coverage map (every decision → its covering wiki page, before code), ROUTING.md/index.md search before any general-knowledge fill regardless of page budget, explicit at-decision-time declaration of genuine wiki silence, and a mandatory `WIKI COVERAGE CHECK:` line on every completion report. Canonical text in BUILD_PROTOCOL.md; restated in MASTER_CONTEXT.md (Rule 12), BUILD_INDEX.md, COMPLETION_TEMPLATES.md.

---

## 2026-07-22 — Governance: Folding Policy Replaces One-Item-Per-Session Cadence

Session scope unit redefined for all future build sessions: up to 3 decision-dense items, one mechanical sub-section, or one independently verifiable artifact's full item set per session — with hard stops, a live-behavior ceiling (Wave 3b), and 5 named singleton exceptions. Canonical text in BUILD_PROTOCOL.md; restated in MASTER_CONTEXT.md (Rule 1) and BUILD_INDEX.md. Also resolved 03b's auto-pick contradiction per Nick's ruling: auto-pick is local-only, writing solely to this app's draft_state — never to Sleeper/ESPN (read-only rule reaffirmed, no exception created).

---

## 2026-07-22 — Wave 1 Schema Complete: Integrity Section + RLS Security Model Live

The entire Wave 1 schema block is now built and verified live. The integrity fold (first session under the new Folding Policy: 3 items) confirmed all 18 FKs shipped at creation, added 17 integrity indexes, and activated the RLS owner-policy layer — `fantasy_owner_all` (full CRUD) on all ten tables, pinned to Nick's specific `auth.uid()` via `is_fantasy_admin()`. Admin identity: the pre-existing prolabel user nick@prolabelco.com, reused by Nick's ruling (duplicate emails impossible in the shared namespace) — no password handoff needed. Remaining Wave 1: types/client wiring, env/deploy.

---

## 2026-07-22 — Governance: Absolute Rule 13 — Non-Fantasy Data Is Untouchable

Permanent, zero-exception protection for the shared prolabel database's ~49 non-fantasy tables (Elliott = live business production data) installed at Nick's direction: never `db reset`, never `migration repair` touching foreign history (stubs only), no raw SQL reaching non-fantasy tables (blast radius verified against ARCHITECTURE.md's live schema inventory per migration), collision check forever, any ambiguity → stop and ask. New mandatory `BLAST RADIUS:` line on every completion report. Canonical text in MASTER_CONTEXT.md; mirrored in COMPLETION_TEMPLATES.md, ARCHITECTURE.md, BUILD_PROTOCOL.md, STATE.yml.

---

## 2026-07-22 — Vercel Deploy Pipeline Verified Live + Env Contract Committed (Wave 1)

Core infra activation: the GitHub→Vercel pipeline is confirmed working end-to-end — this session's env-contract push auto-deployed to production and reached READY (~23s build; project `fantasy`, nextjs preset; Supabase env vars in place from the manual setup). Committed `.env.example` documents the full contract: modern Supabase key pair, CLI-only DB password, and Wave 2 ESPN cookie placeholders carrying the wiki's wire-format rules. One Wave 1 item remains: the deployed health-check read — the wave's completion gate.

---

## 2026-07-22 — WAVE 1 COMPLETE: Deployed Health-Check Gate Passed, `01_foundation.md` 🟢

Full checklist completion — the first build file finished. The final item shipped `/api/health` (public, minimal `{ ok }`) plus the deferred secret-key admin client; deployed production returned 200 `{"ok":true}` on a real authenticated read, functionally proving the Vercel env vars and end-to-end DB reachability. Registry + roadmap rows flipped 🟢. Next in roadmap order: `02_data_pipeline.md` (Wave 2 — all its MANUAL_SETUP items still open: Sleeper league ID, ESPN public/private decisions, cookies).

---

_End of PROGRESS_ARCHIVE.md_