# wiki/MAINTAINER.md
# Wiki ingestion and maintenance protocol
# This file is for Nick and the wiki maintenance AI — not for Claude Code

---

## What the Wiki Is

A read-only, purpose-built knowledge base that Claude Code builds against. Every page contains synthesized, vetted guidance that informs architectural and feature decisions without requiring Nick to re-explain context in every build session.

The wiki is never built by Claude Code. It is built separately through a deliberate ingestion pipeline and committed via Claude Desktop, Claude.ai chat, or Cowork sessions.

---

## Session Start Protocol — Do This First, Every Session

Before doing anything else in a wiki maintenance session:

1. Read `wiki/schema.yml` — canonical schema for all wiki pages
2. Read `wiki/session-state.md` — context monitor rules and health thresholds
3. Read `wiki/tags.md` — the controlled tag vocabulary
4. Read `wiki/verification-cache.md` — what claims have already been verified
5. Read `wiki/_queue_master.md` — find the first ACTIVE queue file. Read that queue file — find the topmost PENDING entry.
6. Initialize in-memory counters: `blocks_executed = 0`, `pages_read = 0`
7. If PENDING entries exist in the queue: read `wiki/DISCOVERY_PROTOCOL.md`
8. If Nick provides a source directly: proceed with Single-Source Ingest Protocol in `wiki/WIKI_CHAT_CONTEXT.md`

---

## Wiki Directory Containment — NON-NEGOTIABLE

Every file created, modified, or deleted must exist within `wiki/`. No exceptions. No overrides. This is permanent and absolute.

- Every page lives at `wiki/topics/{category}/{page-name}.md`
- Every system file, template, and governance file lives under `wiki/`
- No wiki file is ever created at the repository root, in `.claude/`, in `src/`, or anywhere else

---

## Two Ingestion Modes

**Discovery Protocol (PRIMARY):** Subject-driven ingestion against a chathub.gg 6-model AI panel. See `wiki/DISCOVERY_PROTOCOL.md` for the full workflow. The master index (`wiki/_queue_master.md`) points to the ACTIVE batch queue file — any session on any device reads the master, opens the ACTIVE batch file, and knows exactly where things stand.

**Single-Source Ingestion:** One-off mode for sources Nick drops directly into a session. Full protocol in `wiki/WIKI_CHAT_CONTEXT.md`. The two-phase block system applies.

---

## Two-Phase Ingest Protocol Summary

Both ingestion modes use this protocol. Full detail in `wiki/WIKI_CHAT_CONTEXT.md` (single-source) and `wiki/DISCOVERY_PROTOCOL.md` (discovery).

**Phase 1 — Read and Plan (no writes):**
- Read the source completely
- Read existing pages that may be affected
- Produce an Ingest Plan in block format
- Display the plan and proceed immediately to Phase 2 — do not wait for approval

**Phase 2 — Execute Blocks (auto-advance, no gates):**
- Execute all blocks in sequence without stopping between them
- One block = one page = one commit
- Report `BLOCK [N] DONE` after each block and immediately begin the next
- Never wait between blocks — the plan is the approval
- Housekeeping block always last
- Session health status appended to every completion report

---

## Discovery Queue Workflow

The discovery queue is split across a master index and 16 batch queue files to minimize per-session token cost.

- `wiki/_queue_master.md` — navigation index only. Lists all 16 batch files with their status (ACTIVE / LOCKED / COMPLETED). Never contains individual subject entries.
- `wiki/_queue_nb1a.md` through `wiki/_queue_nb4d.md` — 16 batch files, 4 per notebook. Each holds 6-7 entries.
- Exactly one file is ACTIVE at any time. All others are LOCKED (not yet reached) or COMPLETED (fully processed).
- Any session reads the master, opens the ACTIVE batch file, finds the topmost PENDING entry, and starts there.
- No manual handoff or memory required between sessions.

---

## Self-Healing Commit Sequence

After every ingest session, these files must be updated in the housekeeping block (as applicable).

| File | Update trigger | What to update |
| ---- | -------------- | -------------- |
| `wiki/topics/{category}/_index.md` | Any page created or updated in that category | Add/update the page entry |
| `wiki/index.md` | Any new page created | Increment Page Count table |
| `wiki/tags.md` | Any new tag created | Add tag to correct section |
| `wiki/verification-cache.md` | Any factual claim verified or conflict resolved | Add/update cache entry |
| `wiki/_queue_master.md` | Current batch file just completed | Set current → COMPLETED, next → ACTIVE |
| `wiki/WIKI_ROADMAP.md` | A full notebook just completed | Update Ingestion Order table and Progress Tracker |

---

## Pre-Commit Checklist

Before committing any wiki page:

- [ ] All required frontmatter fields present (validated against `wiki/schema.yml`)
- [ ] All frontmatter values are valid (type, status, confidence values checked)
- [ ] Tags assigned from `wiki/tags.md` — no unregistered tags
- [ ] No code of any kind in the page body
- [ ] No inline cross-references ("see [page] for X") in the body
- [ ] Page size within target range or split protocol applied
- [ ] `related` field populated where applicable; bidirectionality planned
- [ ] `confidence` field reflects actual evidence quality — not assumed high
- [ ] If a new tag was created: it was added to `wiki/tags.md` first
- [ ] If a new page was created: housekeeping block will update the `_index.md` and `wiki/index.md`
- [ ] Commit message format: `wiki: create {page-name}` or `wiki: update {page-name}`

---

## Context Health Rules

Reference `wiki/session-state.md` for the full rules. Summary:

- **FRESH** (blocks < 5, pages < 10): proceed normally
- **WARM** (blocks 5–7, pages 10–15): continue, start watching
- **HOT** (blocks 8–9, pages 16–19): finish current block, recommend fresh session
- **STOP** (blocks ≥ 10, pages ≥ 20): do not accept another source — tell Nick to start fresh

Session status appears on every completion report. Never hide it.

---

## Ingestion Order

Build top-down. The notebook priority and current status is defined in `wiki/WIKI_ROADMAP.md`.

| Priority | Notebook | Wiki Category | Status |
| -------- | -------- | ------------- | ------ |
| 1 | Player Evaluation & Opportunity Metrics | player-evaluation | 🔄 ACTIVE — nb1a queue ready |
| 2 | Team & Scheme Context | team-scheme | 🔒 LOCKED |
| 3 | League Mechanics, Scoring & Draft Strategy | league-mechanics | 🔒 LOCKED |
| 4 | In-Season Management, Injury/Availability & Situational Data | in-season-management | 🔒 LOCKED |

---

## Page Size Rules

All rules defined in `wiki/schema.yml` under `page_size_tiers`. Summary:

- Target: 10–30KB per page
- Watch: 30–35KB
- Split required: 35KB+
- Thin: under 5KB — fold into a broader page unless the topic is genuinely distinct

---

## The 4 Valid Categories

| Category | Slug | Covers |
| -------- | ---- | ------ |
| Player Evaluation & Opportunity Metrics | `player-evaluation` | Opportunity metrics, efficiency stats, athletic testing, college metrics, expected value models |
| Team & Scheme Context | `team-scheme` | Team-level tendencies, line quality, coaching philosophy, Vegas context, weather, matchup data |
| League Mechanics, Scoring & Draft Strategy | `league-mechanics` | Scoring formats, draft strategy, positional scarcity, auction, dynasty, trade value |
| In-Season Management, Injury/Availability & Situational Data | `in-season-management` | Weekly decisions, injury tracking, situational splits, consistency, trend alerts |

---

_End of wiki/MAINTAINER.md_
