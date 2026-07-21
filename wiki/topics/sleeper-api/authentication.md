---
title: "Sleeper API Authentication and Access Model"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - authentication
  - rest-api
  - read-only-api
  - graphql
  - websocket
related:
  - sleeper-api/roster-endpoint
---

## Summary

Sleeper's public REST API (`api.sleeper.app/v1`) requires no authentication, API key, or OAuth flow for any read endpoint — user, league, roster, matchup, draft, transaction, and player data are all openly readable over HTTPS with no registration step. A separate, undocumented layer handles write operations (lineup changes, roster moves, some commissioner actions) and real-time push updates; this layer requires a login-derived session and sits entirely outside the public read contract. A related but distinct fact with real product implications: because the read API requires no credential, it also has no concept of a "private" league — any league is readable by anyone who has its league ID.

---

## Core Knowledge

### Public Read Access Requires Nothing

Every commonly used Sleeper endpoint for football data — users, leagues, rosters, matchups, transactions, drafts, players, and NFL state — is served without any token, key, or signed request. This is server-enforced behavior, not merely a documentation omission: the read surface is architecturally public. There is no developer portal, no per-application API key issuance process, and no distinction in the response between an anonymous caller and a logged-in one. A request built from nothing but a league ID, user ID, or draft ID is sufficient to retrieve full league data.

### There Is No Concept of a Private League at the API Level

Because no credential gates read access, Sleeper's public API does not distinguish public from private leagues the way some other fantasy platforms do. A league's visibility inside the Sleeper app (who a user sees it listed for) is a product-level, not an API-level, concept — the underlying league, roster, matchup, and transaction data for any league ID is retrievable by anyone who has that ID, regardless of whether the league's members consider it private. This is a materially different security posture than platforms that gate equivalent data behind session cookies, and it should inform how carefully a league ID is treated: it functions closer to an unlisted-but-public identifier than to an access-controlled resource.

### A Separate Authenticated Layer Exists for Mutations

Beyond the public read API, Sleeper's own web and mobile clients rely on an undocumented, authenticated layer for actions the public REST API cannot perform: creating or renaming a league, executing a lineup change, processing a waiver claim, or completing a trade. This layer is commonly described as a GraphQL endpoint reached only after a standard login flow, issuing a session token that authorizes subsequent mutation requests. A companion real-time channel — commonly implemented as a WebSocket connection — pushes transaction, chat, and score-update events to authenticated clients; it exists primarily to support live in-app experiences and is not required to read historical or point-in-time league data through the standard REST resources.

Both of these authenticated surfaces sit outside the documented public contract. They are reconstructed from client network traffic by the developer community rather than published by Sleeper, and their exact token format, session lifetime, and refresh behavior are not established with any real precision. Community-observed detail on this layer is considerably thinner and less corroborated than the public read API, and should be treated with correspondingly lower confidence.

### No Formal Version or Key-Rotation Model on the Read Path

The public read API has operated under a single stable path prefix for its entire public life, with no publicized breaking version change comparable to a `v1` → `v2` migration. There is no key-rotation or credential-expiry concern for read access, because there is no credential to rotate or expire in the first place. This stability is itself an operational asset: an integration built purely against the public read endpoints has historically not needed to plan for authentication-related breakage, which is not true of the undocumented write/session layer.

### Practical Consequence for Rate Behavior

Because there is no API key tying requests to an identified caller, Sleeper cannot apply per-application rate limits the way a keyed API can — any throttling it applies is necessarily based on coarser signals such as source IP or request volume patterns, not an authenticated client identity. This matters operationally: there is no way to request a higher limit, no account-level quota to negotiate, and no authenticated back-channel for resolving a block. Whatever throttling exists applies uniformly to anonymous traffic.

---

## Key Decisions

- **Decision:** The platform will call Sleeper's public read endpoints directly, with no credential storage, token refresh logic, or authentication middleware in the ingestion path.
  **Reasoning:** Every endpoint the platform needs for read-only league ingestion is unauthenticated; building credential-handling infrastructure for endpoints that require none would be pure overhead with no corresponding benefit.
  **Rejected alternative:** Routing Sleeper reads through an authenticated backend session was rejected — there are no credentials to protect on the read path, so a session layer would add latency and complexity without a security benefit.

- **Decision:** The platform will not integrate against Sleeper's undocumented authenticated GraphQL/WebSocket layer in the initial build, and will not offer native lineup-mutation actions (add/drop/set-lineup) against Sleeper from within the platform.
  **Reasoning:** That layer has no public contract, no stability guarantee, and no official support; building against it would tie platform functionality to a surface that can change without notice and cannot be debugged against any documentation.
  **Rejected alternative:** Reverse-engineering the GraphQL mutation flow to support in-app lineup management was rejected for the initial build. Revisit only if native write support becomes a hard product requirement, and treat it as a materially higher-risk integration than the read path even then.

- **Decision:** The platform will treat a Sleeper league ID with the same handling care as a private credential when it appears in logs, URLs, or client-side code, even though the API itself imposes no access control on it.
  **Reasoning:** Since any league ID is fully readable by anyone who obtains it, unintentionally exposing a user's league ID (for example in a shared screenshot, log line, or public URL) effectively exposes that league's full roster, transaction, and matchup history with no way for the user to revoke access.
  **Rejected alternative:** Treating league IDs as ordinary, freely-loggable identifiers (as most platform-internal IDs are treated) was rejected specifically because Sleeper's lack of API-level privacy makes this ID more sensitive than a typical internal identifier.

---

## Open Questions

- [ ] What is the exact authentication mechanism (session token format, acquisition flow, expiry) for Sleeper's write-capable GraphQL/WebSocket layer, should the platform ever need native lineup-mutation support? — needs direct API experimentation or a response from Sleeper directly, since community sources describe this layer's existence with only partial, low-confidence detail on its mechanics.
- [ ] Does Sleeper enforce a formal, published rate limit on the public read API, or only an informal, community-observed threshold? — addressed more fully once the dedicated Sleeper rate-limits subject is ingested; noted here because it bears directly on whether the platform's read-polling strategy needs a hard cap or can rely on adaptive backoff.
