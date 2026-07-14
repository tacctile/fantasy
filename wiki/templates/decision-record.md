---
title: "ADR: [Decision Title]"
type: decision-record
category: league-mechanics  # one of the 4 valid categories in schema.yml — wherever the decision lives
status: active  # active | deprecated (use deprecated + superseded_by when a decision is reversed)
last_updated: "YYYY-MM-DD"
confidence: high
tags:
  - tag-from-tags-md
related:
  - league-mechanics/related-page-name
superseded_by:  # only when status: deprecated — path to the page that replaces this decision
---

## Context

What situation, constraint, or requirement forced this decision? Describe the problem space without presupposing the answer. Include the constraints that were non-negotiable and the factors that made this decision non-trivial.

Keep this section factual and brief — 3–6 sentences. No editorializing about whether the decision was easy or hard.

---

## Decision

State the decision in one clear sentence. Then explain what it means in practice — what the platform will do, what it will not do, and any constraints the decision imposes on future work.

---

## Rationale

Why this decision was made over the alternatives. Reference the constraints from Context. Be specific about what evidence, research, or reasoning drove the choice.

If the decision involved tradeoffs, name them explicitly. "We accepted X in exchange for Y" is better than "this was the best overall option."

---

## Rejected Alternatives

List each alternative that was seriously considered and explain why it was rejected. This section is critical — it prevents future contributors from reopening decisions that were already thought through.

**Alternative 1: [Name]**
- What it would have done
- Why it was rejected — specific reason, not "it wasn't the best option"

**Alternative 2: [Name]**
- What it would have done
- Why it was rejected

---

## Date

Decision made: YYYY-MM-DD
Last reviewed: YYYY-MM-DD
