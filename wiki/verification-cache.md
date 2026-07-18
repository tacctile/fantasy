# Fantasy Football Platform Wiki — Verification Cache

> **Tracks factual claims verified across wiki sessions**
>
> **Purpose:** Prevent re-verifying the same claim in future sessions. Any claim verified
> within 90 days can be trusted from this cache. Claims older than 90 days must be
> re-verified and the cache entry updated.
>
> **90-day trust window:** Checked on the `Verified` date. If today's date is more
> than 90 days past the `Verified` date, treat the entry as stale — re-verify
> via web search and update the `Verified` and `Next Review` fields.
>
> **5-minute verification cap:** If a claim cannot be resolved in 5 minutes of
> searching, stop. Set `confidence: medium` on the affected page, add the claim to
> that page's Open Questions section, and add a note here in Unresolved Conflicts.
>
> **What gets cached:**
> - Platform-specific feature availability claims
> - Regulatory and legal claims (with statute citations)
> - Pricing and plan structure data (with approximate date context)
> - Company status claims (active, acquired, shut down)
> - Statistical methodology claims (e.g., exact formula definitions)
>
> **What never gets cached:**
> - Design patterns, analytical principles, strategic frameworks — these don't expire
> - Synthesis conclusions ("most analysts use X") — these are judgment calls, not facts

---

## Statistical & Methodology Claims

| Topic | Claim | Source | Verified | Next Review |
| ----- | ----- | ------ | -------- | ----------- |
| WOPR formula | WOPR = 1.5 × Target Share + 0.7 × Air Yards Share (Josh Hermsmeyer's canonical formula) | chathub.gg 6-model panel, 5-of-6 models confirmed; 1 model reported an unconfirmed alternate (0.75/0.25) attributed to a single platform | 2026-07-17 | 2026-10-15 |

---

## Platform & Tool Claims

| Topic | Claim | Source | Verified | Next Review |
| ----- | ----- | ------ | -------- | ----------- |
| — | — | — | — | — |

---

## Pending Verification

Claims included in wiki pages from corpus synthesis that have not been independently verified.

| Topic | Claim | Affects | Added | Verify Against |
| ----- | ----- | ------- | ----- | -------------- |
| — | — | — | — | — |

---

## Unresolved Conflicts

Claims where sources directly contradict each other and the conflict could not be resolved within the 5-minute cap. Affected pages carry `confidence: medium` and include the conflict in Open Questions.

| Topic | Conflict | Status | Notes |
| ----- | -------- | ------ | ----- |
| — | — | — | — |

---

_End of wiki/verification-cache.md_
