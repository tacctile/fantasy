---
title: "Descriptive Title — Specific Enough to Stand Alone"
type: architecture  # architecture | product-spec | domain-knowledge | market-analysis | operations | ux-research
category: player-evaluation  # one of the 4 valid categories in schema.yml, matching wiki/topics/{category}/
status: active
last_updated: "YYYY-MM-DD"
confidence: high  # high | medium | low — see WIKI_CHAT_CONTEXT.md for calibration rules
tags:
  - tag-from-tags-md
  - tag-from-tags-md
related:
  - player-evaluation/related-page-name
  - team-scheme/related-page-name
superseded_by:  # only when status: deprecated
---

## Summary

2–4 sentences. Sufficient for 80% of Claude Code's needs. A reader of only this section should know what the page covers and its single most important conclusion. No hedging. No filler. State the strongest defensible position directly.

---

## Core Knowledge

Synthesized, vetted knowledge on this subject. Organized by concept, not by source. Write in the wiki's own voice — not as a summary of sources.

### [Concept or Subsection]

Facts, patterns, and implications. Every sentence earns its place. No restating what the heading already says.

**Rules for this section:**
- Facts and decisions only — no filler, no hedging
- Sector-agnostic language throughout — no terminology implying a single industry
- No code of any kind — describe patterns and behavior in plain language
- No inline cross-references ("see [page]") — state facts directly or omit them
- No marketing language taken at face value from competitor sources

### [Concept or Subsection]

Continue as needed. Divide by logical concept, not by source.

---

## Key Decisions

**What the Fantasy Football Platform will do and why.** Not industry restatements — platform-specific decisions with explicit reasoning.

Each decision follows this pattern:
- **Decision:** What the platform will do
- **Reasoning:** Why — cost, technical, business, or constraint reason
- **Rejected alternative:** What was considered and why it was rejected

If no clear platform-specific decision can be made from available guidance, move the topic to Open Questions below. Do not fabricate decisions.

---

## Open Questions

*(Omit this section if there are no unresolved questions)*

Questions that cannot be resolved from available sources. Each must be actionable — answerable by a specific type of evidence or a decision from Nick.

Maximum 5 questions per page. Questions surviving 3+ ingests without resolution must be escalated or resolved using best available evidence.

- [ ] [Question 1] — needs [type of evidence / Nick decision]
- [ ] [Question 2] — needs [type of evidence / Nick decision]
