# PROGRESS.md
**Rolling changelog — tacctile/fantasy**

This is NOT a git log — only significant milestones, not every commit. A milestone is: first working implementation of a registered build file feature, completion of a full build file checklist, a governance system change that affects all future sessions, or activation of a core infrastructure service (Supabase, Vercel, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones.

Newest entry on top.

---

## 2026-07-21 — Wave 1 Build File Registered (First Registered Build File)

`.claude/build/01_foundation.md` created and registered in `BUILD_INDEX.md`'s Build Files Registry — the first entry in that table since the governance scaffold was established. This is the first concrete, executable scope for actual application code in this project.

**How it was scoped:** the same 6-model convergence-filtering methodology used for `wiki/` discovery ingestion, applied to build planning instead of research. A single, fully self-contained panel prompt (project context + Wave 1's `BUILD_INDEX.md` scope bullet) was run against 6 independent AI models, each producing a 25-item atomic task breakdown for Wave 1. Responses were convergence-filtered — tasks appearing in 5-6 of 6 responses were treated as consensus and form the spine of the build file; low-corroboration items (env validation via Zod, Realtime publication, defensive raw-ingest snapshot tables) were noted but not adopted into this wave's scope.

**What's in scope:** Next.js/Tailwind/shadcn scaffold, Supabase project + migration workflow, `platform` enum, Sleeper-anchored `players` table + ESPN crosswalk, `leagues` table with `share_token` generation, `league_config`, league-scoped rosters/matchups/standings/player_scores tables, shared `draft_state` table (schema only — write logic is Wave 3), RLS enabled with owner-only write policies (spectator read policies deferred to Wave 4), generated TypeScript types, env/secrets + Vercel deploy with a live connectivity smoke test as the completion gate.

**Explicitly deferred out of Wave 1** (documented in the build file itself, not silently dropped): ESPN cookie-auth flow, any data ingestion/sync logic, share-token-gated spectator RLS policies and the spectator route surface, manual/automated draft-pick write logic.

**Why this milestone matters:** per `BUILD_INDEX.md`'s own rule, nothing gets built without a registered build file — this is the moment the project becomes buildable, transitioning from pure planning/governance/wiki work to an executable build queue.

---

## 2026-07-21 — Scope Corrections: Open-Ended League Count, Access Model, Draft-Entry Sequencing

Three scope corrections landed in `MASTER_CONTEXT.md` and `BUILD_INDEX.md`, driven by a full extraction of Nick's prior conversation history on this project cross-checked against the committed repo state. This is a governance/scope change affecting all future build sessions.

**What changed:**
- **League count is now open-ended, not fixed.** Previous text hardcoded "2 Sleeper leagues, 2 ESPN leagues." Corrected to: the platform must support any number of Sleeper and/or ESPN leagues Nick connects — the schema already supports this via `league_id` scoping, this was a documentation framing fix, not an architecture change. Yahoo remains explicitly out of scope for v1, unchanged.
- **Access Model added** (`MASTER_CONTEXT.md`, new section after UX Architecture): Nick is sole owner/admin of every league; leaguemates get a no-login, revocable, per-league `share_token`-based read-only URL. The read-only surface is a genuinely separate rendering path — never the admin view with controls conditionally hidden — since leaked admin markup in a client bundle would expose Nick's draft tooling to viewers. Added as Schema Rule #6 (`share_token` column, one-way door, correct from migration one).
- **Wave 3b scope changed**: manual click-to-draft and live ESPN draft polling now ship together in v1, both writing to one shared `draft_state` table (first-write-wins) — no staged "manual first, poller as v2" sequencing (that staging was a real decision from an earlier session, explicitly reversed by Nick this session).
- **Wave 4 scope note added**: the read-only share-link dashboard is part of Wave 4 (League Dashboard), not a separate later build — same data, gated by `share_token` instead of owner auth.

**Why:** Nick ran a full extraction of every prior conversation touching this project (spanning an abandoned 2025 Bubble/no-code era and the current 2026 Next.js/Supabase era) and reconciled it against the live repo. Most of the extraction confirmed existing `MASTER_CONTEXT.md` content; these three items were genuine gaps or reversals Nick called out directly rather than items the extraction resolved on its own.

**Not yet resolved:** ESPN league public/private visibility per league — still pending Nick's confirmation before ESPN cookie-auth work begins (see `STATE.yml` → `nick_pending`).

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

**Next:** Wave 1 (Foundation) — Supabase schema, env/secrets setup, initial Vercel deploy. Not started.

---

_End of PROGRESS.md_
