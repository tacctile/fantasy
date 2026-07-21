---
title: "ESPN Cookie and Header Format Requirements"
type: domain-knowledge
category: espn-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - cookie-auth
  - authentication
  - rest-api
  - undocumented-endpoint
related:
  - espn-api/authentication
  - espn-api/rate-limits-and-blocking
---

## Summary

ESPN's private-league API requires `espn_s2` and `SWID` sent as a standard HTTP `Cookie` header (`espn_s2=<value>; SWID={<value>}`), but two easy-to-miss formatting details cause the large majority of real-world auth failures: `SWID` must retain its literal curly braces, and `espn_s2` must be transmitted with exactly one layer of URL-encoding — never decoded-and-reencoded, never double-encoded. When in doubt, the browser's own outgoing `Cookie` header (visible in DevTools Network tab) is the authoritative reference for what a request should look like.

---

## Core Knowledge

### Basic Cookie Header Format

When passed manually (as opposed to relying on a browser's automatic cookie handling), the required format is a standard `Cookie` header with both key-value pairs semicolon-separated:

```
Cookie: espn_s2=<espn_s2 value>; SWID={<SWID value>}
```

Cookie names are used in this exact casing (`espn_s2`, `SWID`) — while ESPN's server-side check is understood to not be case-sensitive on the names themselves, different client libraries key their internal cookie handling inconsistently (some use lowercase `swid` internally while sending `SWID` on the wire), so using the exact observed casing eliminates a variable when debugging.

### The SWID Brace Requirement

`SWID` must be sent wrapped in curly braces: `{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}`. Depending on which tool or browser cookie viewer was used to copy the value, the braces are sometimes preserved and sometimes stripped by the display. This is one of the single most frequently reported "it should work but doesn't" issues across community ESPN tooling — if espn_s2 looks correct and auth is still failing, check the SWID braces first.

### The espn_s2 Encoding Requirement

The raw `espn_s2` value contains characters that are special in URL/cookie encoding contexts (forward slashes, plus signs, equals signs, and similar). As copied from a browser's cookie storage viewer, it is typically already in its final, correctly-formed transmittable state — but different viewers display this differently: some show literal percent-encoded sequences (`%2F`, `%3D`, `%2B`) as text, others show the underlying special characters directly.

The failure pattern arises from HTTP client libraries that automatically URL-encode cookie values before sending: if the copied value is already percent-encoded and the client re-encodes it, the result is double-encoding (`%2F` becomes `%252F`), which the server does not recognize and which fails auth with no informative error message. The inverse failure — decoding an already-encoded value and sending it raw — can corrupt the header if the decoded value contains characters that are syntactically meaningful in a `Cookie` header.

**Practical rule:** use the value exactly as it appears in the Network tab's raw outgoing `Cookie` request header (not the cookie-storage viewer) whenever possible, and disable automatic cookie-value encoding in the HTTP client if that option exists. When debugging an auth failure, compare the literal bytes of the outgoing request header against a known-working browser request for the same endpoint — this is the most reliable diagnostic available given the absence of any published spec.

### Client Interface Differences

HTTP clients expose this in two different ways, and the correct handling differs between them:

- **Raw `Cookie` header interface** — the caller provides the complete header string. Here, the browser/request-header representation should be preserved exactly, unmodified.
- **Cookie jar / cookie object interface** — the caller provides cookie names and values separately, and the client library handles constructing the header, including any encoding. Behavior varies significantly by library; some encode internally (expecting a decoded value as input), others pass values through unchanged (expecting an already-encoded value as input). The safest approach when using this style of interface is to compare the client's final emitted `Cookie` header against a known-good browser request rather than assuming a given library's convention.

### Supplementary Headers (Lower Confidence)

Some ESPN fantasy endpoints — particularly ones returning filtered views such as specific matchup weeks, specific roster slots, or box scores — have been observed to require or behave differently based on an `x-fantasy-filter` header carrying a JSON-encoded filter payload. Well-formed request headers resembling a real browser (User-Agent, Accept, Referer) are also reported to reduce the odds of being blocked or served a stripped-down payload.

This is explicitly lower-confidence than the core cookie mechanics: it is endpoint-specific, has shifted over time as ESPN's own web app has changed, and should not be treated as stable long-term spec. Build defensively (detect unexpectedly sparse or missing data as a distinct condition) rather than assuming a fixed set of required headers per endpoint.

### Common Format Failure Patterns

- Missing braces on `SWID`.
- Double-encoded `espn_s2` (client re-encodes an already-encoded value).
- Decoded `espn_s2` containing characters that break `Cookie` header syntax.
- Copying a truncated `espn_s2` value (it is long enough that partial copies are easy to make unnoticed).
- Including the cookie name inside a value-only input field (e.g. entering `espn_s2=<value>` into a field that expects only `<value>`).
- Hidden whitespace or line breaks introduced by pasting through an intermediate tool (password manager, spreadsheet, chat message, config file).
- Using a comma instead of a semicolon as the cookie-pair separator.

---

## Key Decisions

- **Decision:** ESPN cookie values are extracted from and validated against the browser DevTools **Network tab** raw request header, not the Storage/Application cookie panel, whenever there is any ambiguity about encoding.
  **Reasoning:** The Network tab reflects exactly what the browser transmitted on the wire; the Storage panel is a display layer that can decode, re-encode, or otherwise transform the value in ways inconsistent with the actual transmitted form, which is the single most common source of "looks right but fails" auth bugs in this integration.
  **Rejected alternative:** Relying solely on the Storage/Application panel for extraction was rejected — it is a reasonable starting point but an unreliable single source of truth given known encoding-display inconsistencies across browsers.

- **Decision:** Cookie values are stored and transmitted with exactly one layer of URL-encoding preserved as extracted, with no additional encode/decode transformation applied anywhere in the ingestion pipeline.
  **Reasoning:** Every documented ESPN auth failure pattern tied to formatting (not expiration) traces back to an extra or missing encoding pass; treating the extracted value as an opaque, already-correctly-encoded string and never re-processing it eliminates this entire failure class.
  **Rejected alternative:** Normalizing or re-encoding cookie values on ingest (e.g. always decoding then re-encoding for consistency) was rejected — there is no reliable way to determine the "correct" canonical form without a published spec, so any transformation risks introducing the exact double-encoding bug this decision avoids.

---

## Open Questions

- [ ] Whether `x-fantasy-filter` or other supplementary headers are strictly required for any endpoint the platform actually needs (as opposed to being incidentally present in browser traffic) has not been established — this is endpoint-specific and has shifted historically as ESPN's web app changed. Treat unexpectedly sparse responses as a signal to investigate, not assume, missing headers. — needs direct endpoint-by-endpoint testing once ESPN endpoint structure work (Notebook 6, subjects 6.9+) is ingested.
