# PROGRESS.md
**Rolling changelog — tacctile/fantasy**

This is NOT a git log — only significant milestones, not every commit. A milestone is: first working implementation of a registered build file feature, completion of a full build file checklist, a governance system change that affects all future sessions, or activation of a core infrastructure service (Supabase, Vercel, ESPN auth). Routine bug fixes, single-file edits, and partial progress are not milestones.

**Cap: 5 most recent entries only.** Each entry is a short summary (2-4 lines), not a detailed log — full session detail lives in `.claude/logs/`. When a 6th entry would be added, the oldest entry here rolls off into `.claude/PROGRESS_ARCHIVE.md` verbatim.

Newest entry on top.

---

## 2026-07-23 — Share-Token Data-Exposure Boundary Live (Wave 4 Named-Singleton #5)

The read-only share-link Access Model's enforcement layer is live on the shared prod DB. Spectator `SELECT` RLS (`spectator_share_read`, `TO anon`) on EIGHT fantasy tables (six from the build file + `players`/`roster_players`, Nick-signed correctness amendment) gated on a `share_token` presented via the `x-share-token` header (`current_share_token()`); `draft_state`/`draft_sessions` deliberately get NO policy — unreachable to anon even with a valid token. Owner-only `regenerate_share_token(uuid)` RPC (revoke == regenerate) behind `regenerateShareToken`; `services/spectator.ts` is the server-side loader reusing the dashboard getters via a token-scoped anon client. tsc/lint/build clean + 23/23 (9 new boundary tests) + live read-only RLS verification (draft tables 0 rows with a valid token; regenerate revokes the old link live). Next: share-link settings panel UI + the spectator UI surface.

---

## 2026-07-23 — Wave 3b Complete + Durable Test Framework Activated (Resilience Sub-Section 2/2)

`03b_draft_assistant_live_draft.md` is 🟢 — the full Sleeper-snake live-draft wave is built. Final fold shipped the Resilience sub-section: (1) a reusable `ui/error-boundary.tsx` wraps each live-enhancement region so a render fault degrades only that region (quiet notice) while the static 3a board stays usable — the merge falls back to the base pool, auto-pick disarms on fault (Nick's Clarify: per-region + 3a fallback + quiet notices); (2) **Vitest** is now the project's durable test runner (the repo had none — every prior verification was a throwaway harness), with 14 co-located tests covering the DB first-write-wins race (fake in-memory client per Rule 13), BPA/tier recompute, run-window trigger/reset, and auto-pick's hard-rule skip. tsc/lint/build clean + 14/14; READ-ONLY, no migration. Next self-locatable work: Wave 4 nav-shell.

---

## 2026-07-22 — BPA Recommendation Engine Is a Working Feature: Live Panel + One-Click Draft (Sub-Section 9/9)

The BPA engine crossed from a headless query layer into a working draft-assist surface. `BpaRecommendationsPanel` mounts at the top of the board sidebar (Nick's placement): the top-8 candidates ranked purely by base VORP with market ADP beside the value and an independent roster-need badge shown alongside (never merged), a re-pick-each-session my-team picker, one-click draft wired into the SAME shared `handleDraft` (new `DraftablePlayer` seam — no duplication), and per-pick recompute off the shell's live snapshot. Live-verified read-only on the real league (topN=8; need never reorders value; ordering/VORP invariant). `03b` BPA sub-section 9/9 — file stays 🟡 (tier-cliff, positional-run, queue/auto-pick, resilience remain).

---

## 2026-07-22 — Wave 3b Begun: Manual Click-to-Draft Write Path Live (First Live-Draft Feature)

First working 3b feature since the Sleeper-snake restructure: `src/services/draft-picks.ts` (`recordManualPick` — full referential validation, Nick-signed any-unclaimed-pick + server-side dup-player rejection, first-write-wins with a typed accepted/conflict/validation result carrying the authoritative row on conflict; `undoLastManualPick` — highest `source='manual'` row only, poll rows undeletable by construction) + auth-gated server actions under the draft route. 21/21 live checks against the real league, `draft_state` left at baseline; tsc/lint/build clean. Next: active-draft polling orchestration (`draft_sessions` + cadence).

---

## 2026-07-22 — League Dashboard Is a Working Feature: Page Assembled + League Selector Live

First browsable Wave 4 surface: the owner dashboard now mounts at `/leagues/[leagueId]` (Nick-signed league root; auto-land re-signed to land here), composing MatchupsGrid (URL-driven `?week=N`, default = latest scored week via new `listScoredWeeks`) over StandingsTable + PowerRankingsList, with the PlayerCard opening as a URL-driven `?player=` sheet from matchup player links. Draft board's LeagueSelector generalized (`subPath`) and reused. tsc/lint/build clean + 21/21 live render checks. Next: nav-shell sub-section (share-link panel rides the share-token singleton).

---

_End of PROGRESS.md_
