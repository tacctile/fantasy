# Fantasy Football Platform Wiki — Ingestion Roadmap

> **Living status document — updated after every notebook completes**
>
> **This file is for Nick and the wiki maintenance AI — not for Claude Code**
>
> **Last Updated:** 2026-07-21

---

## How to Resume After Any Break

1. Open a fresh Cowork or Claude Desktop session with GitHub MCP
2. Drop `wiki/WIKI_CHAT_CONTEXT.md` into the session (or read it directly from the repo)
3. The AI reads `wiki/_queue_master.md` → opens the ACTIVE batch file → finds the topmost PENDING entry
4. Say: "Continue wiki ingestion." Everything picks up exactly where it left off.

The repo is the memory. The queue is the state. Nothing is ever lost.

---

## The Core Workflow

### Phase 0 — Queue Initialization (already complete)
All 100 subjects across all 4 original notebooks were pre-populated into the 16 batch queue files at wiki initialization (2026-07-14). This phase does not repeat — the Cycle 1 subject list is fixed unless Nick manually edits a batch file to add new subjects.

**Cycle 2 addition (2026-07-21):** `sleeper-api` and `espn-api` were valid categories from the original governance scaffold but had no discovery queue and no content. To unblock Wave 1 of the build roadmap, 18 sleeper-api subjects and 19 espn-api subjects were generated as a narrow-scope supplemental cycle (Notebook 5 and Notebook 6 below) and pre-populated into 6 new batch queue files (`_queue_nb5a–c`, `_queue_nb6a–c`), structured identically to Cycle 1 so the same 3-subject-per-session chathub.gg cadence applies without any protocol changes.

**Cycle 3 addition (2026-07-21):** `schema-reference` was also a valid category with no discovery queue and no content, and Nick flagged it as needing a plan before build starts. Unlike Cycles 1–2, schema-reference has no external source of truth — it's the platform's own internal data model, so it can't be researched via chathub.gg panel and synthesized the normal way. Notebook 7 (below) was registered as a single locked queue file (`_queue_nb7a.md`, 3 subjects) that runs in **decision-record mode** instead of panel-synthesis mode, and stays LOCKED until Notebook 6 (ESPN) fully completes — see "Notebook 7" below for why.

### Phase 1 — Subject Ingestion (3 subjects per session)
Each session processes exactly 3 subjects via the 3-Subject Panel Prompt, pasted into chathub.gg to run against all 6 configured AI models. Nick pastes each of the 6 responses back into the session, and the AI convergence-filters them per `wiki/DISCOVERY_PROTOCOL.md` before synthesizing wiki pages. Nick starts a fresh session for each triple. After every triple, the AI marks the three queue entries COMPLETED (with notes), updates the relevant `_index.md` files, updates `wiki/index.md` page counts if pages were added, and updates `wiki/_queue_master.md` if the batch file boundary was crossed. **This phase does not apply to Notebook 7** — see its own section for process.

### Phase 2 — Notebook Complete
When all entries in a notebook's batch files are COMPLETED or SKIPPED, that notebook is done. Update the Progress Tracker below.

---

## Ingestion Order

| Priority | Notebook | Wiki Category | Status |
| -------- | -------- | ------------- | ------ |
| 1 | Player Evaluation & Opportunity Metrics | player-evaluation | ✅ COMPLETED — all 25 subjects ingested |
| 2 | Team & Scheme Context | team-scheme | ✅ COMPLETED — all 25 subjects ingested |
| 3 | League Mechanics, Scoring & Draft Strategy | league-mechanics | ✅ COMPLETED — all 25 subjects ingested |
| 4 | In-Season Management, Injury/Availability & Situational Data | in-season-management | ✅ COMPLETED — all 25 subjects ingested |
| 5 | Sleeper API Integration | sleeper-api | 🔄 ACTIVE — 15 of 18 ingested, 5.16–5.18 IN_PROGRESS in nb5c |
| 6 | ESPN API Integration | espn-api | 🔒 LOCKED — queued via nb6a–c, begins after Notebook 5 completes |
| 7 | Schema Reference | schema-reference | 🔒 LOCKED — decision-record mode, begins after Notebook 6 completes |

---

## Notebook 1 — Player Evaluation & Opportunity Metrics

**Wiki category:** player-evaluation
**Question target:** 25 pages (one per subject)
**Priority:** FIRST — foundational player metrics everything else references
**Queue files:** nb1a (ACTIVE) · nb1b/c/d (LOCKED)
**Discovery run:** Pre-populated with 25 known subjects

### Subjects (1–25)
1. Target Share
2. Air Yards Share
3. Weighted Opportunity Rating (WOPR)
4. Yards Per Route Run (YPRR)
5. Route Participation Rate
6. Snap Share
7. Red Zone Target Share
8. Goal-Line Carry Share
9. Carries Per Game / Carry Share
10. Touches Per Game
11. Catch Rate / Contested Catch Rate
12. Yards After Catch (YAC)
13. Average Depth of Target (aDOT)
14. Explosive Play Rate / Breakaway Run Rate
15. Missed Tackles Forced / Yards After Contact
16. Fantasy Points Over Expected (FPOE)
17. Expected Fantasy Points (xFP)
18. Value Over Replacement Player (VORP/VBD)
19. Drop Rate
20. First-Read Target Rate / Target Quality
21. QB Designed Rush Rate / Scramble Rate
22. QB EPA per Dropback / CPOE
23. TE Alignment Rate (Inline vs. Slot/Wide)
24. Rookie College Dominator Rating / Breakout Age
25. Athletic Testing (RAS / Speed Score / Burst Score)

---

## Notebook 2 — Team & Scheme Context

**Wiki category:** team-scheme
**Question target:** 25 pages
**Priority:** SECOND
**Queue files:** nb2a/b/c/d (LOCKED)
**Discovery run:** Pre-populated

---

## Notebook 3 — League Mechanics, Scoring & Draft Strategy

**Wiki category:** league-mechanics
**Question target:** 25 pages
**Priority:** THIRD
**Queue files:** nb3a/b/c/d (LOCKED)
**Discovery run:** Pre-populated

---

## Notebook 4 — In-Season Management, Injury/Availability & Situational Data

**Wiki category:** in-season-management
**Question target:** 25 pages
**Priority:** FOURTH
**Queue files:** nb4a/b/c/d (LOCKED)
**Discovery run:** Pre-populated

---

## Notebook 5 — Sleeper API Integration

**Wiki category:** sleeper-api
**Question target:** 18 pages (one per subject, unless subjects are tightly related enough to consolidate)
**Priority:** FIFTH — narrow-scope Wave 1 unblock, not part of the original 100-subject taxonomy
**Queue files:** nb5a (COMPLETED, 5.1–5.3 ingested) · nb5b (COMPLETED, 5.4–5.12 ingested) · nb5c (ACTIVE, 5.13–5.15 ingested, 5.16–5.18 IN_PROGRESS)
**Discovery run:** Subjects generated 2026-07-21 by Claude at Nick's request to cover: authentication (or lack thereof), endpoint structure (league, roster, matchup, draft, players), rate limits, player data format/canonical player ID structure, and known quirks/undocumented behavior.

### Subjects (5.1–5.18)
1. Sleeper API Authentication Requirements — ✅ ingested (sleeper-api/authentication)
2. Sleeper League Endpoint Structure — ✅ ingested (sleeper-api/league-endpoint)
3. Sleeper Roster Endpoint Structure — ✅ ingested (sleeper-api/roster-endpoint)
4. Sleeper Matchup Endpoint Structure — ✅ ingested (sleeper-api/matchup-endpoint)
5. Sleeper Draft Endpoint Structure — ✅ ingested (sleeper-api/draft-endpoint)
6. Sleeper Users Endpoint Structure — ✅ ingested (sleeper-api/users-endpoint)
7. Sleeper Transactions Endpoint Structure — ✅ ingested (sleeper-api/transactions-endpoint)
8. Sleeper User and User-Leagues Endpoints — ✅ ingested (sleeper-api/user-leagues-endpoint)
9. Sleeper Playoff Bracket Endpoints — ✅ ingested (sleeper-api/playoff-bracket-endpoint)
10. Sleeper NFL State Endpoint — ✅ ingested (sleeper-api/nfl-state-endpoint)
11. Sleeper API Rate Limits — ✅ ingested (sleeper-api/rate-limits)
12. Sleeper Players Dump and Canonical Player ID — ✅ ingested (sleeper-api/players-endpoint)
13. Cross-Referencing Sleeper Player IDs — ✅ ingested (sleeper-api/player-id-crosswalk)
14. Sleeper Trending Players Endpoint — ✅ ingested (sleeper-api/trending-endpoint)
15. Sleeper Defense and Free-Agent Player Representation — ✅ ingested (sleeper-api/dst-and-free-agents)
16. Sleeper Players Payload Size and Caching Strategy — 🔄 IN_PROGRESS
17. Sleeper Player Data Quirks — 🔄 IN_PROGRESS
18. Sleeper Live vs. Finalized Scoring — 🔄 IN_PROGRESS

---

## Notebook 6 — ESPN API Integration

**Wiki category:** espn-api
**Question target:** 19 pages (one per subject, unless subjects are tightly related enough to consolidate)
**Priority:** SIXTH — narrow-scope Wave 1 unblock, not part of the original 100-subject taxonomy
**Queue files:** nb6a/b/c (LOCKED — begins after Notebook 5 completes)
**Discovery run:** Subjects generated 2026-07-21 by Claude at Nick's request to cover: cookie auth mechanics (espn_s2/SWID), public vs. private league detection, endpoint structure (league, roster, matchup, draft, players), and known quirks/undocumented behavior specific to ESPN's API.

### Subjects (6.1–6.19)
1. ESPN espn_s2/SWID Origin and Auth Mechanics
2. Extracting and Refreshing ESPN Auth Cookies
3. ESPN Cookie/Header Format Requirements
4. Detecting Public vs. Private ESPN Leagues
5. ESPN Error Responses for Auth Failures
6. ESPN Public vs. Private Data Completeness
7. ESPN Fantasy API Base URL and Versioning
8. ESPN "view" Query Parameter
9. ESPN Roster Response Structure
10. ESPN Matchup Response Structure
11. ESPN Draft Detail Response Structure
12. ESPN Player Endpoint and Filtering
13. ESPN Historical Season Access
14. ESPN Team, Owner, and Member ID Structure
15. ESPN Proprietary Player ID Inconsistencies
16. ESPN Undocumented Rate-Limiting and IP Blocking
17. ESPN's History of Unannounced Breaking Changes
18. ESPN Bye Week, IR, and Locked Lineup Quirks
19. ESPN scoringPeriodId/matchupPeriodId Mismatches

---

## Notebook 7 — Schema Reference

**Wiki category:** schema-reference
**Question target:** 3 decision-record pages (not domain-knowledge — see below)
**Priority:** SEVENTH — Wave 1 unblock, added 2026-07-21 at Nick's request for a plan he can execute right after Sleeper + ESPN finish, before build starts
**Queue files:** nb7a (LOCKED — begins after Notebook 6 completes)
**Discovery run:** N/A in the Cycle 1/2 sense. Schema-reference has no external source of truth — it's this platform's own internal data model. There's nothing for a chathub.gg panel to converge on the way it does for fantasy analytics consensus or published third-party API docs.

### Why this notebook works differently

- **Page type is `decision-record`**, not `domain-knowledge`. Required sections per `wiki/schema.yml`: Context, Decision, Rationale, Rejected Alternatives, Date.
- **The chathub.gg panel is optional input, not the source of the answer.** If used, reframe it around data-architecture best practices for multi-provider fantasy-sports platforms — normalization patterns, ID-mapping pitfalls, multi-tenant scoping conventions — not "what should this schema be." Claude and Nick make the actual call.
- **Gated on both Sleeper AND ESPN being fully ingested**, not just Sleeper, even though the category description calls player identity mapping "Sleeper-anchored." Finalizing a "platform-agnostic" ID scheme or league_config model before ESPN's specific quirks (proprietary player IDs, season/versioning model, league-settings shape) are known risks designing a Sleeper-only schema that has to be reworked the moment ESPN is added.
- **Run as a dedicated decision session with Nick**, not a solo ingest-and-commit loop — these are hard-to-unwind architectural decisions Claude Code will build directly against.

### Subjects (7.1–7.3)
1. Multi-Platform League Identity and Scoping — how Sleeper's per-season `league_id` renewal/`previous_league_id` chaining and ESPN's season/versioning model each map into one internal league-identity and season-history convention.
2. Platform-Agnostic Player Identity Mapping — the platform's own canonical internal player ID scheme, anchored on Sleeper's `player_id`, with defined join/fallback behavior once ESPN's proprietary player IDs are added, including DST and free-agent edge cases.
3. League Configuration Data Model — normalizing each platform's league-settings shape (Sleeper's `settings`/`scoring_settings`/`roster_positions`, ESPN's equivalent) into one internal `league_config` schema without leaking provider-specific structure into the application layer.

Full rationale lives in `wiki/_queue_nb7a.md` itself — read it in full before starting this notebook, even though it's short.

---

## Progress Tracker

| Notebook | Queue Populated | Pages Committed | Status |
| -------- | --------------- | ---------------- | ------ |
| 1 — Player Evaluation & Opportunity Metrics | ✅ 25 subjects | ✅ 26 pages | ✅ COMPLETED |
| 2 — Team & Scheme Context | ✅ 25 subjects | ✅ 24 pages | ✅ COMPLETED |
| 3 — League Mechanics, Scoring & Draft Strategy | ✅ 25 subjects | ✅ 24 pages | ✅ COMPLETED |
| 4 — In-Season Management, Injury/Availability & Situational Data | ✅ 25 subjects | ✅ 23 pages | ✅ COMPLETED |
| 5 — Sleeper API Integration | ✅ 18 subjects | ⏳ 13 pages | 🔄 ACTIVE — 5.16–5.18 up next in nb5c |
| 6 — ESPN API Integration | ✅ 19 subjects | ⏳ 0 pages | 🔒 LOCKED |
| 7 — Schema Reference | ✅ 3 subjects | ⏳ 0 pages | 🔒 LOCKED — decision-record mode, begins after Notebook 6 |

---

## Notes & Audibles

**2026-07-14:** Wiki initialized. All 16 batch queue files created with all 100 subjects pre-populated across 4 notebooks. nb1a is ACTIVE. No ingestion has begun — all 100 subjects are PENDING. Run the first wiki maintenance session to begin ingesting notebook 1.

**2026-07-17:** Ingestion source switched from NotebookLM to a chathub.gg 6-model AI panel. NotebookLM is fully removed from the pipeline — no per-notebook discovery step, no corpus to diff against. Each session triple now generates a single 3-Subject Panel Prompt (opens with a fixed fantasy-football-analytics-expert framing, no platform/wiki context) run against all 6 models in chathub.gg; Nick pastes back the 6 responses and Claude applies the Convergence-Filtering Standard (`wiki/DISCOVERY_PROTOCOL.md`) before synthesizing pages. First triple ingested under this pipeline: 1.1 Target Share, 1.2 Air Yards Share, 1.3 WOPR — all three created in `wiki/topics/player-evaluation/`.

**2026-07-17 (later):** Notebook 1 (Player Evaluation & Opportunity Metrics) fully ingested — all 25 subjects COMPLETED across nb1a–nb1d, 26 pages committed to `wiki/topics/player-evaluation/`. Notebook 2 (Team & Scheme Context) is now ACTIVE via `wiki/_queue_nb2a.md`.

**2026-07-17 (later still):** Notebook 2 (Team & Scheme Context) fully ingested — all 25 subjects COMPLETED across nb2a–nb2d, 24 pages committed to `wiki/topics/team-scheme/`. Notebook 3 (League Mechanics, Scoring & Draft Strategy) is now ACTIVE via `wiki/_queue_nb3a.md`.

**2026-07-18:** Notebook 3 (League Mechanics, Scoring & Draft Strategy) fully ingested — all 25 subjects COMPLETED across nb3a–nb3d, 24 pages committed to `wiki/topics/league-mechanics/`. Notebook 4 (In-Season Management, Injury/Availability & Situational Data) is now ACTIVE via `wiki/_queue_nb4a.md`.

**2026-07-18 (later):** Notebook 4 (In-Season Management, Injury/Availability & Situational Data) fully ingested — all 25 subjects COMPLETED across nb4a–nb4d, 23 pages committed to `wiki/topics/in-season-management/` (2 pages routed to `wiki/topics/league-mechanics/` where content fit better: multi-platform-adp-divergence). All 16 queue files across all 4 notebooks are now COMPLETED. The full discovery cycle (Cycle 1) is complete — 100 subjects processed, 98 total wiki pages committed.

**2026-07-21:** `sleeper-api` and `espn-api` identified as blockers for Wave 1 of the build roadmap — both were registered as valid categories in `wiki/schema.yml` at governance-scaffold time (2026-07-18) but never had a discovery queue or any content. Ran a narrow, targeted subject-generation pass (not a full taxonomy sweep): 18 subjects for sleeper-api and 19 subjects for espn-api. Initialized Cycle 2 of the discovery queue — Notebook 5 (Sleeper API Integration, `_queue_nb5a–c.md`) and Notebook 6 (ESPN API Integration, `_queue_nb6a–c.md`) — using the identical structure, 3-Subject Panel Prompt template (reframed for API/technical-integration expertise instead of fantasy analytics), and 3-subjects-per-session cadence as Cycle 1.

**2026-07-21 (later):** First Sleeper triple (5.1–5.3: authentication, league endpoint, roster endpoint) ingested — created `sleeper-api/authentication.md`, `sleeper-api/league-endpoint.md`, `sleeper-api/roster-endpoint.md` (all confidence: high). RISK: the chathub.gg panel run did not cleanly isolate the 3 requested subjects — most of the 6 responses answered a much broader "full Sleeper + ESPN" scope instead of the specific SUBJECT A/B/C framing (one model explicitly flagged the subjects as missing from its prompt). Only the material relevant to 5.1–5.3 was synthesized into pages; the extra material (Sleeper transactions, drafts, players endpoint, rate limits, trending, and substantial ESPN coverage) was not processed this session to preserve the 3-subject/session cadence and session-health limits, and is logged in `wiki/verification-cache.md` Unresolved Conflicts. Recommend future triples re-run a cleanly scoped panel prompt rather than reuse this dump. `_queue_nb5a.md` → COMPLETED, `_queue_nb5b.md` → ACTIVE, `_queue_master.md` updated accordingly.

**2026-07-21 (later still):** Sleeper subjects 5.4–5.15 ingested across `_queue_nb5b.md` (COMPLETED) and the first half of `_queue_nb5c.md`, using cleanly-scoped 3-subject panel prompts per the fix noted above. 12 additional pages committed to `wiki/topics/sleeper-api/`. Sleeper API Integration is now at 15 of 18 subjects (83%). Subjects 5.16–5.18 (players payload/caching strategy, player data quirks, live vs. finalized scoring) marked IN_PROGRESS in `_queue_nb5c.md`, with the 3-Subject Panel Prompt generated and handed to Nick to run in chathub.gg.

**2026-07-21 (planning session):** Nick asked whether the wiki would have enough data to build against and flagged that `schema-reference` — a valid category since the 2026-07-18 governance scaffold — has zero content and no discovery queue, unlike sleeper-api/espn-api which at least got a Cycle 2 unblock. Clarified with Nick: he does not want to run schema-reference work now — he wants a solid plan in place so he can move straight into it once Sleeper and ESPN are both fully ingested, before build starts. Registered Cycle 3: `wiki/_queue_nb7a.md` (Notebook 7 — Schema Reference, subjects 7.1–7.3: multi-platform league identity/scoping, platform-agnostic player identity mapping, league_config data model), LOCKED until `_queue_nb6c.md` (last ESPN file) reaches COMPLETED. Key design call: schema-reference has no external source of truth like the other notebooks, so it runs in decision-record mode (Context/Decision/Rationale/Rejected Alternatives pages, not domain-knowledge synthesis) and is gated on ESPN as well as Sleeper — deciding a "platform-agnostic" schema on Sleeper facts alone risks rework once ESPN's ID/schema quirks (subjects 6.13, 6.15, 6.7–6.10) are known. This file, `wiki/_queue_master.md`, and `wiki/topics/schema-reference/_index.md` updated to reflect the plan.

---

_End of wiki/WIKI_ROADMAP.md_
