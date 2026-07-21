# Queue File: Notebook 6 — ESPN API Integration (Part A)

**Notebook:** ESPN API Integration
**Wiki category:** espn-api
**Priority:** Wave 1 unblock — narrow-scope supplemental cycle, added 2026-07-21 (not part of the original 100-subject/4-notebook sweep)
**Entry range:** 6.1–6.7 (7 entries)
**Generated:** 2026-07-21

---

### 6.1 ESPN espn_s2/SWID Origin and Auth Mechanics

- Status: COMPLETED
- Wiki Category: espn-api
- Description: What the espn_s2 and SWID cookies are, where they come from, and how they authenticate ESPN Fantasy API requests.
- Notes: Ingested via cleanly-scoped panel (2 full chathub.gg-style responses plus prior partial responses, high convergence). Created `espn-api/authentication.md`, merged with 6.2 (extraction/refresh) since the origin/mechanics and extraction/refresh material forms one coherent page.

---

### 6.2 Extracting and Refreshing ESPN Auth Cookies

- Status: COMPLETED
- Wiki Category: espn-api
- Description: How to extract espn_s2 and SWID from a browser session, and how long these cookies remain valid before expiring.
- Notes: Ingested — merged into `espn-api/authentication.md` alongside 6.1 rather than forked into a separate page (see 6.1 notes).

---

### 6.3 ESPN Cookie/Header Format Requirements

- Status: COMPLETED
- Wiki Category: espn-api
- Description: The HTTP header/cookie format required when passing espn_s2 and SWID to API requests, including URL-encoding of espn_s2.
- Notes: Ingested. Created `espn-api/format-requirements.md` — kept as a separate page from authentication.md since the encoding/formatting pitfalls are a distinct, independently-reusable reference concern.

---

### 6.4 Detecting Public vs. Private ESPN Leagues

- Status: COMPLETED
- Wiki Category: espn-api
- Description: How to programmatically determine whether an ESPN league is public or private before attempting authenticated requests.
- Notes: Ingested via cleanly-scoped 6-model panel. Merged into `espn-api/authentication.md` (new "Detecting Public vs. Private Leagues Programmatically" section) rather than a separate page — detection mechanics are a natural extension of the existing auth-mechanics page.

---

### 6.5 ESPN Error Responses for Auth Failures

- Status: COMPLETED
- Wiki Category: espn-api
- Description: The HTTP status code or error response ESPN returns when accessing a private league without valid credentials, versus an invalid league ID.
- Notes: Ingested via cleanly-scoped 6-model panel. Merged into `espn-api/authentication.md` (new "Disambiguating Auth-Failure Error Responses" section) alongside 6.4.

---

### 6.6 ESPN Public vs. Private Data Completeness

- Status: COMPLETED
- Wiki Category: espn-api
- Description: Whether public leagues expose the same data completeness as private leagues, or whether any fields are restricted regardless of authentication.
- Notes: Ingested via cleanly-scoped 6-model panel. Created `espn-api/data-completeness.md` — kept as a separate page since data completeness is a distinct, independently-reusable reference concern from auth mechanics.

---

### 6.7 ESPN Fantasy API Base URL and Versioning

- Status: PENDING
- Wiki Category: espn-api
- Description: The base URL structure and versioning for ESPN's Fantasy Football API (v3, games/ffl, seasons, leagueId).
- Notes: (pending ingestion)

---

This file covers entries 6.1–6.7. This file is LOCKED until all Notebook 5 (sleeper-api) queue files reach COMPLETED. When all entries in this file are COMPLETED or SKIPPED, update `wiki/_queue_master.md`: set this file → COMPLETED, `wiki/_queue_nb6b.md` → ACTIVE.

_End of wiki/_queue_nb6a.md_
