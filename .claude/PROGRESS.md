# PROGRESS.md
**Rolling changelog — tacctile/fantasy**

This is NOT a git log — only significant milestones, not every commit. A milestone is: first working implementation of a registered build file feature, completion of a full build file checklist, a governance system change that affects all future sessions, or activation of a core infrastructure service (Supabase, Vercel, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones.

Newest entry on top.

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
