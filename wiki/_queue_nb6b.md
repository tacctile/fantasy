# Queue File: Notebook 6 — ESPN API Integration (Part B)

**Notebook:** ESPN API Integration
**Wiki category:** espn-api
**Priority:** Wave 1 unblock — narrow-scope supplemental cycle, added 2026-07-21
**Entry range:** 6.8–6.13 (6 entries)
**Generated:** 2026-07-21

---

### 6.8 ESPN "view" Query Parameter

- Status: COMPLETED
- Wiki Category: espn-api
- Description: The role of the view query parameter, and which views (mRoster, mTeam, mMatchup, mMatchupScore, mSettings, mDraftDetail, mLiveScoring) return which data.
- Notes: Ingested via cleanly-scoped 6-model panel. Created `espn-api/view-parameter-reference.md`.

---

### 6.9 ESPN Roster Response Structure

- Status: COMPLETED
- Wiki Category: espn-api
- Description: The structure of the roster response (mRoster view), including lineupSlotId mappings and slot-to-position tables.
- Notes: Ingested via cleanly-scoped 6-model panel. Created `espn-api/roster-response-structure.md`. One single-source disagreement on whether to derive slot mappings from mSettings vs. hardcode was resolved in favor of the majority (mSettings-authoritative), consistent with MASTER_CONTEXT.md's league_config schema rule — see verification cache.

---

### 6.10 ESPN Matchup Response Structure

- Status: COMPLETED
- Wiki Category: espn-api
- Description: The structure of the matchup response (mMatchup/mMatchupScore), including the distinction between scoringPeriodId and matchupPeriodId.
- Notes: Ingested via cleanly-scoped 6-model panel. Created `espn-api/matchup-response-structure.md`.

---

### 6.11 ESPN Draft Detail Response Structure

- Status: COMPLETED
- Wiki Category: espn-api
- Description: The structure of the draft detail response (mDraftDetail), including pick order, keeper flags, and auction values.
- Notes: Ingested via cleanly-scoped 6-model panel. Created `espn-api/draft-detail-response-structure.md`.

---

### 6.12 ESPN Player Endpoint and Filtering

- Status: COMPLETED
- Wiki Category: espn-api
- Description: The structure of the player endpoint (kona_player_info view), and how the X-Fantasy-Filter header is used to query and filter players.
- Notes: Ingested via cleanly-scoped 6-model panel. Created `espn-api/player-endpoint-and-filtering.md`.

---

### 6.13 ESPN Historical Season Access

- Status: COMPLETED
- Wiki Category: espn-api
- Description: How historical season data is accessed differently (leagueHistory endpoint) compared to the current season.
- Notes: Ingested via cleanly-scoped 6-model panel. Created `espn-api/historical-season-access.md`. This file (`_queue_nb6b.md`) is now fully COMPLETED — all 6 of 6 subjects ingested.

---

This file covers entries 6.8–6.13. `wiki/_queue_nb6a.md` reached COMPLETED 2026-07-21; this file is now ACTIVE. When all entries in this file are COMPLETED or SKIPPED, update `wiki/_queue_master.md`: set this file → COMPLETED, `wiki/_queue_nb6c.md` → ACTIVE.

_End of wiki/_queue_nb6b.md_
