# PROGRESS.md
**Rolling changelog — tacctile/fantasy**

This is NOT a git log — only significant milestones, not every commit. A milestone is: first working implementation of a registered build file feature, completion of a full build file checklist, a governance system change that affects all future sessions, or activation of a core infrastructure service (Supabase, Vercel, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones.

**Cap: 5 most recent entries only.** Each entry is a short summary (2-4 lines), not a detailed log — full session detail lives in `.claude/logs/`. When a 6th entry would be added, the oldest entry here rolls off into `.claude/PROGRESS_ARCHIVE.md` verbatim.

Newest entry on top.

---

## 2026-07-22 — Vercel Deploy Pipeline Verified Live + Env Contract Committed (Wave 1)

Core infra activation: the GitHub→Vercel pipeline is confirmed working end-to-end — this session's env-contract push auto-deployed to production and reached READY (~23s build; project `fantasy`, nextjs preset; Supabase env vars in place from the manual setup). Committed `.env.example` documents the full contract: modern Supabase key pair, CLI-only DB password, and Wave 2 ESPN cookie placeholders carrying the wiki's wire-format rules. One Wave 1 item remains: the deployed health-check read — the wave's completion gate.

---

## 2026-07-22 — Governance: Absolute Rule 13 — Non-Fantasy Data Is Untouchable

Permanent, zero-exception protection for the shared prolabel database's ~49 non-fantasy tables (Elliott = live business production data) installed at Nick's direction: never `db reset`, never `migration repair` touching foreign history (stubs only), no raw SQL reaching non-fantasy tables (blast radius verified against ARCHITECTURE.md's live schema inventory per migration), collision check forever, any ambiguity → stop and ask. New mandatory `BLAST RADIUS:` line on every completion report. Canonical text in MASTER_CONTEXT.md; mirrored in COMPLETION_TEMPLATES.md, ARCHITECTURE.md, BUILD_PROTOCOL.md, STATE.yml.

---

## 2026-07-22 — Wave 1 Schema Complete: Integrity Section + RLS Security Model Live

The entire Wave 1 schema block is now built and verified live. The integrity fold (first session under the new Folding Policy: 3 items) confirmed all 18 FKs shipped at creation, added 17 integrity indexes, and activated the RLS owner-policy layer — `fantasy_owner_all` (full CRUD) on all ten tables, pinned to Nick's specific `auth.uid()` via `is_fantasy_admin()`. Admin identity: the pre-existing prolabel user nick@prolabelco.com, reused by Nick's ruling (duplicate emails impossible in the shared namespace) — no password handoff needed. Remaining Wave 1: types/client wiring, env/deploy.

---

## 2026-07-22 — Governance: Folding Policy Replaces One-Item-Per-Session Cadence

Session scope unit redefined for all future build sessions: up to 3 decision-dense items, one mechanical sub-section, or one independently verifiable artifact's full item set per session — with hard stops, a live-behavior ceiling (Wave 3b), and 5 named singleton exceptions. Canonical text in BUILD_PROTOCOL.md; restated in MASTER_CONTEXT.md (Rule 1) and BUILD_INDEX.md. Also resolved 03b's auto-pick contradiction per Nick's ruling: auto-pick is local-only, writing solely to this app's draft_state — never to Sleeper/ESPN (read-only rule reaffirmed, no exception created).

---

## 2026-07-21 — Governance: Wiki Coverage Rule (Absolute Rule 12)

New non-negotiable rule affecting all future build sessions, born from this session's provenance audit: a mandatory pre-implementation wiki coverage map (every decision → its covering wiki page, before code), ROUTING.md/index.md search before any general-knowledge fill regardless of page budget, explicit at-decision-time declaration of genuine wiki silence, and a mandatory `WIKI COVERAGE CHECK:` line on every completion report. Canonical text in BUILD_PROTOCOL.md; restated in MASTER_CONTEXT.md (Rule 12), BUILD_INDEX.md, COMPLETION_TEMPLATES.md.

---

_End of PROGRESS.md_
