---
title: "ESPN Public vs. Private League Data Completeness"
type: domain-knowledge
category: espn-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - authentication
  - cookie-auth
  - roster-structure
  - league-settings
  - undocumented-endpoint
related:
  - espn-api/authentication
  - espn-api/format-requirements
---

## Summary

Once a request is authorized — whether by a league being public or by valid cookies granting access to a private one — the core league data ESPN returns is materially the same. Public/private is an access gate in front of the league resource, not a field-level redaction layer on top of it. The dominant cause of apparently "missing" data is an unrequested view parameter (`mSettings`, `mRoster`, `mMatchup`, `mDraftDetail`, etc.), not privacy. A smaller set of specific resources — other teams' pending waiver claims and FAAB bids, commissioner-only tools, manager email addresses — are withheld from every caller regardless of authentication, because they are role-restricted rather than privacy-restricted.

---

## Core Knowledge

### Core League Data Is View-Dependent, Not Privacy-Dependent

ESPN's Fantasy API returns data in slices controlled by `view` query parameters (`mSettings`, `mTeam`, `mRoster`, `mMatchup`/`mMatchupScore`, `mStandings`, `mDraftDetail`, and related player-pool views such as `kona_player_info`). A response that lacks roster or matchup detail because the caller didn't request `mRoster` or `mMatchup` is not evidence of privacy-based redaction — it's evidence of an incomplete request. This is the single most common source of confusion when reasoning about "what ESPN exposes publicly": missing fields are overwhelmingly a request-shape problem, not an access-tier problem.

For the core analytical domains — league settings, teams, standings, rosters (including lineup slots and applied stats), matchup scoring, and completed draft results including auction prices — a properly authorized request to a public league and an authenticated request to a private league return equivalent underlying data once the same views are requested. Community tooling built entirely against public leagues (scorebots, record-keeping tools, power-ranking generators) works with zero credentials precisely because this parity holds for ordinary competitive data.

### Restrictions That Apply Regardless of Public/Private Status

A distinct category of data is withheld from every caller — public, authenticated non-member, and even authenticated league member in some cases — because it is scoped by role or game-integrity concerns, not by the public/private toggle:

- **Other teams' pending waiver claims and FAAB bids are never exposed to anyone.** The API mirrors the web UI: a manager can see their own pending claims when authenticated as that manager, but rival teams' unprocessed bids are invisible to every other caller, including fully authenticated ones. No credential unlocks this — it does not exist in the read API for any account other than the bid's owner. FAAB amounts only become visible after a transaction has been processed, via transaction-history views.
- **Commissioner-only tools and manager email addresses are not present in the read API at all**, for any caller. Public and authenticated responses alike expose team display names and manager account identifiers, never contact information or league-manager administrative controls.
- **Communication/message-board and league-activity-feed data behaves inconsistently** — some seasons and endpoints have required cookies even for otherwise-fully-public leagues, and this has changed without announcement across ESPN API generations. Treat this specific surface as requiring credentials unconditionally rather than assuming public-league parity, and expect it to be the least stable data domain in the integration.
- **Historical/legacy-season data (pre-2018, served via the `leagueHistory` endpoint) is thinner for every caller**, public or authenticated, than modern-season data — coarser transaction detail and less granular weekly lineup history. This gap should not be attributed to privacy; it reflects a real reduction in what ESPN's older endpoint generation returns at all.
- **Draft-in-progress state can differ from completed draft results.** Live-room detail during an active draft may be restricted or unavailable even where completed draft results are later readable by any caller once the draft finishes.

### What "Same Data" Does Not Mean

Field-level or byte-for-byte JSON equality is the wrong bar — request timestamps, member-specific UI flags, and other incidental metadata will legitimately differ per-caller without reflecting any real data-completeness gap. The correct comparison is domain-level equivalence: for a given view, does a public-league caller and an authorized private-league caller receive the same competitive facts (rosters, scores, settings, standings, draft results)? Evaluated that way, the two are equivalent for core league data; the exceptions are the specific role-restricted resources listed above, not a general "private leagues get more" pattern.

---

## Key Decisions

- **Decision:** The platform's ESPN ingestion layer will request the full set of views needed for a given feature explicitly (`mSettings`, `mRoster`, `mMatchup`, `mDraftDetail`, etc.) rather than assuming a single default view is sufficient, and will not build any "upgrade to authenticated access for richer data" pathway for core league domains.
  **Reasoning:** The dominant real-world cause of incomplete ESPN data is an unrequested view parameter, not an access-tier limitation; building a credential-upgrade path for data that credentials don't actually unlock would be wasted engineering effort and a source of confusing, unnecessary auth prompts.
  **Rejected alternative:** Treating sparse initial responses as a signal to prompt for ESPN credentials was rejected — for public leagues this would not resolve the actual problem (a missing view parameter) and would create a misleading UX implying private leagues are more data-complete than they are.

- **Decision:** The platform will never attempt to model or infer other teams' pending waiver claims or FAAB bids from the ESPN API, for any league regardless of authentication status.
  **Reasoning:** This data does not exist in the read API for any caller other than the bid's own manager — it is a game-integrity restriction enforced identically for public and authenticated requests, not a data gap that better credentials could close.
  **Rejected alternative:** Building speculative FAAB-bid inference from indirect signals (e.g., transaction timing patterns) was rejected as out of scope and unreliable; the platform will surface FAAB activity only from processed-transaction history, which is reliably available.

- **Decision:** ESPN communication/message-board data will always be fetched with credentials attached, even for public leagues, rather than attempting an anonymous path first.
  **Reasoning:** This specific surface has a documented history of requiring cookies even on otherwise-fully-public leagues, and that requirement has shifted across ESPN API generations without announcement — treating it as credential-required unconditionally avoids building detection logic around a surface known to be unstable.
  **Rejected alternative:** Attempting an anonymous request first and falling back to authenticated on failure was rejected as added complexity for a surface unlikely to reward the anonymous attempt.

---

## Open Questions

- [ ] Whether ESPN's communication-endpoint auth requirement on public leagues is deliberate policy or an incidental side effect of internal service boundaries is unresolved — behavior has changed between seasons without announcement, and no authoritative source clarifies intent.
- [ ] Whether ESPN will begin gating player-pool/projection views (`kona_player_info` and related player-card data) behind stricter auth or header requirements is unconfirmed; edge-layer hardening reported since the 2023 API host migration suggests the anonymous path may be the more fragile tier going forward even where nominal data parity currently holds.
- [ ] No authoritative field-by-field matrix exists distinguishing which ESPN resources are anonymous-accessible, authenticated-member-only, or commissioner-only — all guidance here is reconstructed from community tooling behavior and panel corroboration, not an ESPN-published contract.
