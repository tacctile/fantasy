# COMPLETION_TEMPLATES.md
**Static reference — defines structured report formats for every Claude Code session type**

**Parent:** `.claude/MASTER_CONTEXT.md`

**Rules:**
- Every session ends with a completion report in chat.
- Declare session type at the START of every session.
- Use the exact template for the declared session type.
- Prompt Score is mandatory on every report.
- Verbose internal log is written to `.claude/logs/` automatically.

There is no postmortem system for this project.

---

## PROMPT SCORE Rubric

Every completion report includes a PROMPT SCORE from 1 to 10, scored against the prompt that drove the session. Use this rubric consistently:

- **10** — Zero ambiguity. Every file, requirement, and constraint specified. No guessing needed.
- **9** — One minor ambiguity that did not affect execution.
- **8** — Clear intent but 1-2 details required inference from context.
- **7** — Functional but multiple areas required judgment calls.
- **6** — Achievable but significant gaps required assumptions.
- **5 or below** — Prompt needs rewrite before execution.

Always pair the score with the SUGGESTED PROMPT IMPROVEMENTS field — naming the specific wording changes that would have raised the score.

---

## WIKI COVERAGE CHECK Line (mandatory on every report, added 2026-07-21)

Every completion report — all three templates — includes exactly one of these values (per the Wiki Coverage Rule, Absolute Rule 12 in `MASTER_CONTEXT.md`, canonical text in `BUILD_PROTOCOL.md`):

- **`complete`** — every decision made this session was either explicitly specified by a read wiki page, or required no wiki grounding (pure governance/mechanical work).
- **`gap found and flagged`** — the wiki was genuinely silent on something after a real `wiki/ROUTING.md`/`wiki/index.md` search; the gap was declared explicitly at decision time and appears as a `WIKI NOTE`.
- **`gap found and NOT checked before writing code`** — a decision was filled from general knowledge without searching the wiki first. This is a standing failure and must never appear in any report after 2026-07-21.

---

## Dual-Location Instruction Rule

When a fix modifies a rule that is stated in multiple locations (e.g., both the Prompt Format SESSION END block and the Session-End Steps section of MASTER_CONTEXT.md), update ALL locations. Check `MASTER_CONTEXT.md` for dual-location patterns before committing. Common dual-location patterns: SESSION END block ↔ Session-End Steps, Absolute Rules ↔ MASTER_CONTEXT.md restatements elsewhere, ARCHITECTURE.md Code Conventions ↔ MASTER_CONTEXT.md Code Conventions.

---

## Session Types

| Type | When to Use |
| ---- | ----------- |
| `feature-build` | Building new functionality, screens, or components |
| `audit-fix` | Reading codebase, finding issues, fixing without new features |
| `non-code` | Context file updates, wiki commits, governance work |

---

## Report Templates

### Template 1 — feature-build

```
SESSION TYPE: feature-build
PROMPT SCORE: [1-10]
SUGGESTED PROMPT IMPROVEMENTS: [specific wording changes that would have improved this session, or NONE]

TASK COMPLETED: [one sentence]

FILES CREATED:
* [path] — [what it does]

FILES MODIFIED:
* [path] — [what changed]

FILES DELETED:
* [path] — [why]

PACKAGES INSTALLED:
* [package@version] — [why]

PACKAGES REMOVED:
* [package@version] — [why]

ARCHITECTURE CHANGES: [describe any structural changes, or NONE]
DESIGN SYSTEM CHANGES: [new tokens, pattern changes, or NONE]

BUILD STATUS: [PASSED / FAILED — details]
TYPE CHECK: [PASSED / FAILED — error count]
CONSOLE LOGS: [0 / N remaining]

KNOWN ISSUES INTRODUCED:
* [issue] — [why it was left, what fixes it]

WIKI COVERAGE CHECK: [complete / gap found and flagged / gap found and NOT checked before writing code]

WIKI NOTE: [OPTIONAL — only include when Claude Code identifies wiki content that appears missing, outdated, or incorrect. Format: "WIKI NOTE: [description of what should change in the wiki]". Omit entirely if no wiki issues were observed.]

STATE.yml: UPDATED (overwrite completely — no stale fields)
PROGRESS.md: [UPDATED / NOT UPDATED] — update only for: first working build feature, full checklist completion, governance change affecting all future sessions, or core infra activation. Entries are short (2-4 lines); cap 5, oldest rolls into PROGRESS_ARCHIVE.md
ARCHITECTURE.md: [UPDATED / NOT UPDATED]

NEXT LOGICAL TASK: [one sentence describing what comes next]
```

### Template 2 — audit-fix

```
SESSION TYPE: audit-fix
PROMPT SCORE: [1-10]
SUGGESTED PROMPT IMPROVEMENTS: [specific wording changes, or NONE]

AUDIT SCOPE: [what was examined]

FINDINGS:
* CRITICAL: [list or NONE]
* HIGH: [list or NONE]
* MEDIUM: [list or NONE]
* LOW: [list or NONE]

FIXES APPLIED:
* [what was fixed] — [file path]

FILES MODIFIED:
* [path] — [what changed]

BUILD STATUS: [PASSED / FAILED — details]
TYPE CHECK: [PASSED / FAILED — error count]

ISSUES DEFERRED:
* [issue] — [why deferred, what resolves it]

WIKI COVERAGE CHECK: [complete / gap found and flagged / gap found and NOT checked before writing code]

WIKI NOTE: [OPTIONAL — only include when Claude Code identifies wiki content that appears missing, outdated, or incorrect. Format: "WIKI NOTE: [description of what should change in the wiki]". Omit entirely if no wiki issues were observed.]

STATE.yml: UPDATED (overwrite completely — no stale fields)
PROGRESS.md: [UPDATED / NOT UPDATED] — update only for: first working build feature, full checklist completion, governance change affecting all future sessions, or core infra activation. Entries are short (2-4 lines); cap 5, oldest rolls into PROGRESS_ARCHIVE.md

NEXT LOGICAL TASK: [one sentence]
```

### Template 3 — non-code

```
SESSION TYPE: non-code
PROMPT SCORE: [1-10]
SUGGESTED PROMPT IMPROVEMENTS: [specific wording changes, or NONE]

TASK COMPLETED: [one sentence]

FILES CREATED OR MODIFIED:
* [path] — [what changed]

NOTES: [anything worth flagging, or NONE]

WIKI COVERAGE CHECK: [complete / gap found and flagged / gap found and NOT checked before writing code]

WIKI NOTE: [OPTIONAL — only include when Claude Code identifies wiki content that appears missing, outdated, or incorrect. Format: "WIKI NOTE: [description of what should change in the wiki]". Omit entirely if no wiki issues were observed.]

STATE.yml: UPDATED (overwrite completely — no stale fields)
PROGRESS.md: [UPDATED / NOT UPDATED] — update only for: first working build feature, full checklist completion, governance change affecting all future sessions, or core infra activation. Entries are short (2-4 lines); cap 5, oldest rolls into PROGRESS_ARCHIVE.md
```

---

## Verbose Internal Log

Every session automatically writes a verbose internal log to `.claude/logs/` in addition to the completion report.

**File naming:** `.claude/logs/YYYY-MM-DD_NN.md` where NN is the session number for that day.

**The verbose log captures:**
- Every file read during the session and why
- Every decision made and the reasoning behind it
- Every assumption made where the prompt was ambiguous
- Every pattern followed or deviated from and why
- What context was missing that would have improved the output
- What the prompt got right and what caused friction
- **WIKI NOTE** — if the session's completion report included a WIKI NOTE, copy the full WIKI NOTE text verbatim into the log under a `## WIKI NOTE` heading. If no WIKI NOTE was produced, the log must still include the line `WIKI NOTE: none`.

The verbose log is never shown in chat. It is written to the repo.

**Sequencing:** NN is a zero-padded two-digit sequence number (range 01-99), monotonically increasing per calendar day. The first log of a new calendar day always starts at 01. NN is computed as (highest existing NN for today's date) + 1 — gaps are never backfilled.

---

_End of COMPLETION_TEMPLATES.md_
