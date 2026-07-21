---
title: "Sleeper API Rate Limits"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: medium
tags:
  - rate-limits
  - caching-strategy
  - undocumented-endpoint
  - read-only-api
related:
  - sleeper-api/authentication
  - sleeper-api/players-endpoint
---

## Summary

Sleeper's only published rate-limit guidance is to stay under roughly 1,000 API calls per minute per IP, with exceeding it risking an IP-level block rather than a formally specified throttle contract. There are no documented rate-limit response headers (no `Retry-After`, no `X-RateLimit-*`), and enforcement is reported to escalate beyond a clean `429` to connection-level failures or CDN/edge challenge responses under sustained abuse. The single most consequential and best-corroborated operational rule is unrelated to the general ceiling: the full player dump (`GET /players/nfl`) should be fetched at most once per day, and most real-world blocking problems trace back to violating that specific guidance rather than the general request rate.

---

## Core Knowledge

### The Documented Ceiling and Its Enforcement

Sleeper's own guidance states a ceiling on the order of 1,000 requests per minute, per IP address, with sustained violation risking an IP block. This is the only numeric figure with any claim to being official guidance — there is no published per-endpoint quota, no documented burst allowance, and no formal windowing algorithm (fixed window, sliding window, or token bucket) specified anywhere. Because the read API requires no API key (see `sleeper-api/authentication`), all throttling is necessarily keyed on coarse signals like source IP rather than an authenticated client identity — there is no way to request a higher limit and no authenticated back-channel for resolving a block.

One source describes empirically observing a much lower practical ceiling (on the order of 100 requests per minute) rather than the commonly cited 1,000 figure. This directly contradicts the majority position. Treating the widely corroborated 1,000/minute figure as the working assumption is the correct resolution here, but the contradiction itself is worth carrying forward: no official, versioned rate-limit specification exists, so neither figure should be treated as a hard contractual guarantee, and a production client should be built to degrade gracefully regardless of which number turns out to be closer to the truth on a given day.

### HTTP Behavior When Limits Are Exceeded

The standard documented over-limit signal is an HTTP `429 Too Many Requests` response. Beyond that single status code, behavior becomes less certain and reportedly less clean: sustained or aggressive overage is described as escalating to IP-level blocking that does not always present as a well-formed `429` — it can instead manifest as connection resets, timeouts, or CDN/WAF-level challenge and error responses (403s, or non-JSON HTML error pages) if Sleeper's API sits behind an edge/CDN layer, which is plausible but not independently confirmed. A client that only checks for a `429` status code and assumes every other failure is an ordinary transient network error will mishandle this escalation path and can extend a block by retrying aggressively into it.

No standard rate-limit headers (`Retry-After`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) are reliably present. A client cannot budget against server-reported quota information and must track its own request volume client-side.

### The Players Dump: A Separate, Stricter, and More Consequential Rule

Independent of the general per-minute ceiling, Sleeper's own guidance for the full player dump (`GET /players/nfl`, documented further on `sleeper-api/players-endpoint`) is to call it at most once per day. This is a distinct, softer-sounding but more load-bearing contract than the general rate limit — an integration can be well under 1,000 requests/minute in aggregate and still be a genuinely abusive consumer by re-pulling this large, slow-changing payload on every request or every user action instead of caching it locally. Across available sources, this specific guidance is the single most consistently and explicitly stated rule in the entire rate-limit surface, and violating it is described as one of the most common real-world causes of throttling and blocks.

### Edge Cases and Failure Patterns

- **Shared-IP amplification.** Because limiting is IP-based, serverless deployments, cloud NAT gateways, shared CI runners, and corporate egress networks pool traffic from many unrelated callers onto one IP. A well-behaved integration can be throttled or blocked because of someone else's volume on the same egress address, with no fault of its own — this is described as one of the most dangerous and least-anticipated failure modes, since it produces 429s or blocks that don't correlate with the integration's own observed request rate.
- **Fan-out explosions.** The natural Sleeper access pattern — user, then every league, then per-league rosters, users, matchups across many weeks, and transactions across many weeks — multiplies request count quickly. A "sync everything" job for a single user across many leagues can easily reach several hundred requests; running that concurrently across a user base can exceed the ceiling without any single loop looking abusive in isolation.
- **Bursts vs. sustained averages.** A tight burst of requests fired in a very short window can trip protections even when the trailing one-minute average looks acceptable. Designing purely to a per-minute average without also bounding short-window burstiness is a common gap.
- **Retry storms.** Naive immediate retries after a `429` or connection failure are described as actively harmful — they can extend or deepen an IP-level block rather than recovering from it, especially if the underlying enforcement layer is edge/CDN-based rather than a simple per-request counter.
- **Repeated players-dump pulls and full historical backfills.** These two patterns are called out most consistently across sources as the actual real-world source of blocking incidents — not steady, moderate, well-cached traffic.

### Best-Practice Guidance

High confidence: cache aggressively and differentially by how quickly each resource actually changes — the players dump at most once daily; completed, past weeks' matchup and transaction data as effectively immutable once final; league/roster metadata on an hours-to-days cadence; NFL state (`sleeper-api/nfl-state-endpoint`) on a minutes cadence. High confidence: implement a client-side limiter that operates with meaningful headroom below the documented ceiling rather than targeting it directly, since the enforcement mechanism beyond a clean `429` is undocumented and can escalate. High confidence: treat a `429`, a non-JSON response body, and a connection-level failure (reset or timeout) as the same category of signal for backoff purposes, rather than assuming only `429` indicates throttling. High confidence: use exponential backoff with jitter and a bounded retry count rather than immediate or unbounded retries, since `Retry-After` cannot be assumed to be present. Moderate confidence: the exact numeric target for a safe sustained request rate is a design choice rather than a documented figure — treat any specific number (whether 500/minute, 100/minute, or another figure) as a reasonable planning assumption to validate empirically, not a guaranteed-safe constant.

---

## Key Decisions

- **Decision:** The platform will implement a client-side limiter that operates with substantial headroom below the ~1,000 requests/minute documented ceiling, scoped per egress IP or process, rather than attempting to operate near the documented limit.
  **Reasoning:** The enforcement mechanism beyond a clean `429` is undocumented and can escalate to an IP-level block or connection reset; shared egress infrastructure can also cause the platform to inherit throttling pressure from unrelated co-tenant traffic. Building in margin is the only defensible posture against an opaque enforcement layer with no published contract.
  **Rejected alternative:** Throttling right up to the documented ceiling was rejected — it leaves no margin for shared-IP amplification or burst sensitivity, and risks tripping edge-level protections that a `429`-based backoff alone would not catch cleanly.

- **Decision:** The platform will treat a `429` response, a non-JSON response body, and a connection-level failure (reset or timeout) as equivalent rate-limit signals, applying the same circuit-breaking backoff policy to all three rather than treating only `429` as a throttle indicator.
  **Reasoning:** Reported enforcement escalates beyond clean `429`s to edge/CDN-level blocks that can surface as challenge pages or dropped connections; a client that only reacts to `429` risks misreading an escalating block as an ordinary transient network error and retrying into it more aggressively.
  **Rejected alternative:** Retrying only on `429` and treating other failures as ordinary transient errors was rejected — it risks retry storms against precisely the failure mode most likely to deepen or extend an IP-level block.

- **Decision:** The platform will fetch the full players dump at most once per day via a scheduled job, never per-request, and will resolve all player-ID lookups against that locally cached copy (see `sleeper-api/players-endpoint`).
  **Reasoning:** This is Sleeper's own most explicit and consistently stated piece of rate-limit guidance, and violating it is the most commonly cited real-world cause of blocks; the payload is large and changes slowly, so there is no freshness benefit to fetching it more often.
  **Rejected alternative:** Fetching the dump on demand whenever an unrecognized player ID needs resolving was rejected — it multiplies request volume against a large, slow-changing resource for no freshness benefit and is the single most commonly cited cause of avoidable throttling.

- **Decision:** The platform will not rely on rate-limit response headers (`Retry-After`, `X-RateLimit-*`) for backoff timing, and will instead implement client-side exponential backoff with jitter and a bounded retry count as the default policy for every request path.
  **Reasoning:** Sleeper's API does not reliably return standardized rate-limit headers; a client architecture that assumes their presence will silently fail to back off correctly the moment they are absent, which appears to be the common case rather than the exception.
  **Rejected alternative:** Parsing `Retry-After` when present and falling back to a fixed delay otherwise was rejected as the primary strategy — the platform needs a robust default behavior since header presence cannot be assumed at all, and building the fallback path as an afterthought risks leaving it under-tested.

- **Decision:** The platform will run bulk or backfill jobs (multi-week historical syncs, full-league-list syncs) under their own conservative, separately-budgeted concurrency limit, isolated from interactive user-triggered requests, rather than sharing one undifferentiated request budget across both.
  **Reasoning:** Fan-out from syncing many leagues across many weeks and endpoint types is described as the most common real-world path to exceeding volume limits, and interactive requests need low, predictable latency that a shared, saturated budget would degrade during normal use.
  **Rejected alternative:** Sharing a single global limiter identically across bulk and interactive traffic was rejected — a large backfill job would starve interactive requests of budget and degrade user-facing responsiveness during ordinary use.

---

## Open Questions

- [ ] What is the actual documented or contractual rate-limit ceiling — sources disagree between a commonly cited ~1,000 requests/minute and an isolated report of a much lower practical ceiling (~100/minute)? — no official, versioned specification exists; needs direct empirical measurement against current production behavior, since documentation is not authoritative enough to resolve this on its own.
- [ ] Is enforcement purely IP-scoped, or does it have an endpoint-specific or account-level dimension (given the players dump carries its own explicit, separate guidance)? — unconfirmed by any source with precision.
- [ ] What is the actual duration of an IP-level block once triggered, and does it escalate on repeated offenses? — described anecdotally across sources as ranging from minutes to hours, with no authoritative figure available.
- [ ] Does Sleeper's API sit behind a CDN/WAF layer (commonly speculated to be Cloudflare) that applies independent, stricter burst protection beneath the application-level guidance? — plausible given the reported non-JSON/challenge-page failure behavior, but not independently confirmed.
