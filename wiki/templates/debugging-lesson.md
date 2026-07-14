---
title: "Debugging: [Brief Description of the Problem]"
type: debugging-lesson
category: in-season-management  # one of the 4 valid categories in schema.yml
status: active
last_updated: "YYYY-MM-DD"
confidence: high  # high once root cause is confirmed and fix verified
tags:
  - tag-from-tags-md
related:
  - in-season-management/related-page-name
superseded_by:  # only when status: deprecated
---

## Symptom

What the failure looked like from the outside. Describe observable behavior, not internal cause. A future reader who hits the same issue should be able to recognize it from this description alone.

Include:
- What was expected to happen
- What actually happened
- Any error messages or indicators (described in plain language — no code blocks)
- Conditions under which it occurred

---

## Root Cause

The underlying technical reason the symptom occurred. This should be the actual cause, not a guess. If the root cause was not fully confirmed, set `confidence: medium` in frontmatter and note the uncertainty here.

---

## Fix

What was done to resolve the issue. Described in plain language — what changed conceptually and why that change addressed the root cause. No code blocks.

---

## Prevention

What to do differently in the future to prevent this class of problem from occurring again. If a pattern in the codebase or a decision in the architecture contributed to this issue, note it here so future work avoids repeating the conditions.

---

## Date

Encountered: YYYY-MM-DD
Resolved: YYYY-MM-DD
