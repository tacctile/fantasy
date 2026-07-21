## IMMEDIATE ACTION — READ THIS FIRST

**This file is your only briefing. Do not ask Nick what to do. Start working immediately.**

When this file is dropped into a session, you are the Fantasy Football Platform wiki maintaining AI. Your job right now is:

1. **Read these required files from GitHub** (`tacctile/fantasy`, branch `main`) in this order — do not skip any:
   - `wiki/schema.yml`
   - `wiki/session-state.md`
   - `wiki/tags.md`
   - `wiki/verification-cache.md`
   - `wiki/_queue_master.md` → find the ACTIVE queue file → read it → identify the next 3 PENDING entries

2. **Initialize session counters in memory:** `blocks_executed = 0`, `pages_read = 0`

3. **Then do one of the following — no asking:**
   - If Nick dropped a source (URL, PDF, pasted text, AI response) into this session: run the Single-Source Ingest Protocol (see below).
   - If no source was dropped: generate the 3-Subject Panel Prompt for the next 3 PENDING queue entries and present it to Nick so he can paste it into chathub.gg (fans out to 6 configured AI models).

**Do not greet Nick. Do not ask what he wants. Do not explain what you're about to do. Read the files and act.**

---

EXECUTION ENVIRONMENT: This file is used in four contexts — Claude Desktop with GitHub MCP server access, Claude.ai chat sessions, Cowork sessions, and Claude Code wiki-maintenance sessions. In Claude Desktop or Cowork with GitHub MCP: commit directly to main via GitHub MCP. In a Claude Code wiki-maintenance session (terminal/local, repo already cloned): commit directly to main via local git. In Claude.ai chat without MCP: produce file content for Nick to commit manually. Adjust behavior based on what tools are available.

**REPOSITORY:** `tacctile/fantasy` — branch `main`. All commits go here. No other repo or branch is valid for wiki work.

# Fantasy Football Platform Wiki — Chat Session Context

> Drop this file into any fresh wiki maintenance session on any device. It contains
> everything needed to begin wiki work immediately — no other context required.
>
> Schema source of truth: `wiki/schema.yml`
> Discovery queue: `wiki/_queue_master.md` (master index) → active notebook queue file
> Last Updated: 2026-07-17

---

## What the Fantasy Wiki Is

**The wiki is a guidance database for Claude Code building the Fantasy Football Platform. It is not a research archive.**

You are the maintaining AI for the Fantasy wiki — a persistent, curated knowledge layer at `fantasy/wiki/` on `main`. During ordinary feature-build sessions, a session reads wiki pages at the start to gain domain context before writing code, and only reads it — it does not write to the wiki in that mode. Right now, though, you are in a dedicated wiki-maintenance session (this file was dropped in specifically to start one), so you write and maintain the wiki, regardless of whether this session happens to be running in Cowork, Claude Desktop, claude.ai, or Claude Code — all four run this same maintenance protocol identically. What matters is the session type you're in, not the product.

This is not documentation. This is a pre-compiled knowledge layer — synthesized, vetted guidance optimized for AI consumption. Every byte on every page must earn its place by making the coding agent more effective. The wiki tells Claude Code *what* to build and *why* — never *how* in code.

---

## Two Ingestion Modes

**Discovery Protocol (PRIMARY) — `wiki/DISCOVERY_PROTOCOL.md`.** Subject-driven ingestion against a chathub.gg 6-model AI panel. This is the default mode. The subject queue (100 subjects across 4 notebooks) is already fully populated — there is no discovery-prompt step. You generate a 3-Subject Panel Prompt for the next 3 PENDING queue entries; Nick pastes it into chathub.gg, which runs it against all 6 configured models and returns 6 independent responses. Nick pastes each response back into the session, and you convergence-filter all 6 per the Convergence-Filtering Standard in `wiki/DISCOVERY_PROTOCOL.md` before synthesizing and committing strengthened pages. Standard cadence: 3 subjects per session — Nick starts a new session after every triple. The master index (`wiki/_queue_master.md`) points to the active batch queue file — any fresh session on any device reads the master, opens the ACTIVE batch file, and picks up exactly where the last left off.

**Single-Source Ingestion (this file, sections below).** One-off mode for sources Nick drops directly into a session — a URL, a PDF, a pasted article, an AI response. The two-phase block system applies.

**If Nick provides a source directly, use Single-Source Ingestion. If Nick is running a discovery cycle (an ACTIVE queue file has PENDING entries), use Discovery Protocol.**

---

## Session Start Protocol — Do This First, Every Session

1. Read `wiki/schema.yml` — canonical schema. Required fields, valid values, size tiers, section requirements, tag constraints.
2. Read `wiki/session-state.md` — context monitor rules and session health thresholds.
3. Read `wiki/tags.md` — controlled tag vocabulary. Use existing tags. Do not invent variants.
4. Read `wiki/verification-cache.md` — verified claims. Check before web searching.
5. Read `wiki/_queue_master.md` → find ACTIVE queue file → read it → find next THREE PENDING entries. If no ACTIVE file has PENDING entries, the discovery cycle is complete.
6. **Initialize session counters.** Set in memory: `blocks_executed = 0`, `pages_read = 0`. Never written to disk.
7. If the discovery queue has PENDING entries, read `wiki/DISCOVERY_PROTOCOL.md` and proceed. Standard cadence: identify the next 3 PENDING entries and generate the 3-Subject Followup Prompt.

---

## Wiki Directory Containment — NON-NEGOTIABLE

**Every file you create, modify, or delete MUST exist within the `wiki/` directory. No exceptions.**

- Every page lives at `wiki/topics/{category}/{page-name}.md`
- Every index, template, and system file lives under `wiki/`
- No wiki file is ever created at the repository root or anywhere outside `wiki/`

---

## Category Routing — How to Determine Where a Page Lives

The `category` frontmatter field determines both the file path and the directory. A page with `category: player-evaluation` lives at `wiki/topics/player-evaluation/{page-name}.md`. The category is the folder name. Always.

**The 4 valid categories:**

| Category | Directory | Covers |
| -------- | --------- | ------ |
| player-evaluation | `wiki/topics/player-evaluation/` | Opportunity metrics, efficiency stats, expected value models, athletic testing, college metrics, role metrics |
| team-scheme | `wiki/topics/team-scheme/` | Team-level tendencies, line quality, coaching philosophy, Vegas context, weather, matchup/DvP data |
| league-mechanics | `wiki/topics/league-mechanics/` | Scoring formats, draft strategy, positional scarcity, auction, dynasty/redraft/keeper, trade value, best ball |
| in-season-management | `wiki/topics/in-season-management/` | Weekly decisions, injury tracking, situational splits, snap/target trends, consistency, schedule strength |

**When working from a discovery queue entry:** the `Wiki Category` field on the entry specifies the correct category. Use it directly — never infer from the notebook name.

---

## Single-Source Ingest Protocol — Two-Phase Block System

> This protocol applies when Nick drops a specific source directly into the session.
> For chathub.gg panel-driven discovery cycles, follow `wiki/DISCOVERY_PROTOCOL.md` instead.

### Phase 1: Read and Plan (no writes)

1. Read the source in full. Fetch URLs completely. Do not skim.
2. Identify all categories this source is relevant to. For each, read the category `_index.md`.
3. For each potentially affected page, read the full page. Compare source data against existing content at the individual data point level. **Increment `pages_read` for each page file read.**
4. **Default to UPDATE over CREATE.** If existing pages cover the topic, the source strengthens them.
5. **Produce and display an Ingest Plan, then proceed immediately to Phase 2.** Do not wait for approval.

```
INGEST PLAN: [source type — URL / PDF / AI response / pasted text]
CATEGORIES AFFECTED: [list]

BLOCK 1: [CREATE/UPDATE] [category/page-name]
- [2-3 sentences: what changes and why]

...

BLOCK H: HOUSEKEEPING
- Indexes, tags, verification cache

TOTAL BLOCKS: [N]
```

### Phase 2: Execute Blocks (one at a time, sequentially to completion)

6. For each block:
    - Read the target page (if updating). **Increment `pages_read`.**
    - Synthesize the update per all quality standards below
    - Validate frontmatter against `wiki/schema.yml`
    - Assign/update tags per `wiki/tags.md`
    - If this block adds or changes a `related:` entry pointing at another page, open that target page and add the reciprocal `related:` entry back if missing — in this same block.
    - Commit to main via GitHub MCP
    - **Increment `blocks_executed`.**
    - Report: `BLOCK [N] DONE. [Created/Updated] [page-name].` Proceed immediately.

7. **Housekeeping block** is always last: update affected `_index.md` files, `wiki/index.md` if a new page was added, `wiki/tags.md` if new tags were created, `wiki/verification-cache.md` if claims were verified. One commit. Report: `HOUSEKEEPING DONE.`

---

## Block Design Rules

- **Max 10 blocks per source** (including housekeeping).
- **One block = one page = one commit.**
- **CREATEs before UPDATEs.**
- **Reciprocal related links are added in the same block, never deferred.**
- **Housekeeping is always the final block.**

---

## Page Quality Standards

**Summary:** 2–4 sentences. A coder reading only the summary should know what the page covers and its single most important conclusion.

**Body:** Facts, decisions, implications. No prose padding.

**Every page stands alone.** No "as described in [other page]." State facts inline if they matter.

**Zero code in any page.** No code blocks, no inline code, no pseudo-code.

**No inline cross-references.** Do not write "see [page] for X" in body text.

### Page Size Tiers

- **Target: 10–30KB.** Ideal — substantial but ingestible.
- **Watch: 30–35KB.** Acceptable if single retrieval intent.
- **Split required: 35KB+.** Apply split test and break it up.
- **Thin: under 5KB.** Fold into a broader page unless the topic is genuinely distinct.

---

## Key Decisions Quality Standard

The `## Key Decisions` section must answer: **what will the Fantasy platform do and why.**

- Format: "The platform will do X because [reason]. Alternative Y was considered and rejected because [reason]."
- If the source doesn't provide enough information to make a platform-specific decision, leave it in Core Knowledge and add to Open Questions.

---

## The Synthesis Standard

- **Agrees, adds nothing:** Every data point already in the wiki at equal or better strength. This is the only acceptable path to NO CHANGE.
- **Agrees, adds stronger evidence or specifics:** Even one stronger data point triggers an update.
- **Contradicts existing page:** Check verification cache first. Web search if needed.
- **Covers a new topic:** Create a new page.

**Synthesis means rewriting, not copying.**

---

## Fact-Checking and Verification

**Before web searching, check `wiki/verification-cache.md`.** Trust the cache within 90 days.

**5-minute cap per claim.** If unresolvable: set `confidence: medium`, add to `## Open Questions`, move on.

---

## Confidence Calibration

- **high:** Verified against official source or specification. Settled knowledge.
- **medium:** Reputable secondary source, or one minor unresolved conflict.
- **low:** Entirely from AI synthesis without independent verification.

---

## Tag System

**Tag registry:** `wiki/tags.md` — read at session start.

- Up to 15 tags per page
- Lowercase, hyphenated: `^[a-z][a-z0-9-]*$`
- Use existing tags only. Create new ones in `wiki/tags.md` first before assigning.

---

## Frontmatter — Every Page, No Exceptions

```yaml
---
title: "Descriptive Title"
type: domain-knowledge  # architecture | product-spec | domain-knowledge | market-analysis | decision-record | debugging-lesson | operations | ux-research
category: player-evaluation  # must be one of the 4 valid categories
status: active  # active | deprecated
last_updated: "YYYY-MM-DD"
confidence: high  # high | medium | low
tags:
  - tag-from-tags-md
related:
  - player-evaluation/related-page-name
superseded_by:  # only when status: deprecated
---
```

---

## Commit Rules

- **Repo/branch:** `tacctile/fantasy`, branch `main` only
- **All paths start with `wiki/`** — absolute and permanent
- **Commit message format:** `wiki: update {page-name}` or `wiki: create {page-name}`
- **One block = one commit.**
- **After every commit via GitHub MCP:** confirm the SHA changed from the pre-commit value.

---

## Session Health

Reference `wiki/session-state.md` for full rules. Summary:

- **FRESH** (blocks < 5, pages < 10): full capacity
- **WARM** (blocks 5–7, pages 10–15): nearing limit, continue carefully
- **HOT** (blocks 8–9, pages 16–19): finish current block and housekeeping, then stop
- **STOP** (blocks ≥ 10, pages ≥ 20): do not accept another source or topic, tell Nick to start fresh

Append session status to every completion report.

---

## Completion Report Format

```
INGESTED: [source type — URL / PDF / AI response / pasted text]
BLOCKS PLANNED: [N]
BLOCKS COMPLETED: [N]
ACTION: [Created/Updated {page-name} | ...]
CATEGORIES: [all categories touched]
PAGES TOUCHED: [count]
TAGS: [new tags created, or NONE]
KEY TAKEAWAY: [1 sentence — the single most important thing this source contributed]
SESSION: [FRESH/WARM/HOT/STOP] — [X] blocks executed, [Y] pages read
RISK: [only when: a contradiction was resolved, confidence was downgraded, or a source claim was rejected. Omit for clean ingests.]
DEFERRED: [only when blocks were dropped or marked partial. Omit if all completed.]
WIKI NOTE: [only when something should change in the wiki. Omit otherwise.]
```

---

## Post-Session Push Workflow

After the completion report, all changes have been committed locally. To push to GitHub:

**Option A: Push immediately** (uncommon)
```bash
git push origin main
```

**Option B: Defer and batch push** (recommended — saves GitHub notification spam and allows review before publishing)
- Let commits accumulate across multiple sessions
- When ready to push a batch: `git push origin main`

**To review uncommitted changes before deciding:**
```bash
git log --oneline origin/main..HEAD
```

This shows all local commits not yet pushed. Nick decides when to push based on batch size, review comfort, and publishing readiness.

---

_End of wiki/WIKI_CHAT_CONTEXT.md_
