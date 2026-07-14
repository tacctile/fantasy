EXECUTION ENVIRONMENT: This file is used in Claude Desktop with GitHub MCP, Claude.ai chat, or Cowork sessions — not by Claude Code. Claude Code never reads this file.

# Fantasy Football Platform Wiki — Discovery Protocol

> The primary ingestion mode for building the Fantasy wiki from the NotebookLM corpus.
> Single-source ingestion (defined in `wiki/WIKI_CHAT_CONTEXT.md`) remains available
> for one-off sources Nick drops directly into a session.
>
> Standard session cadence: 3 subjects per session. Nick starts a new session after every triple.
>
> Last Updated: 2026-07-14

---

## Mental Model

The wiki is a **guidance database for Claude Code** building the Fantasy Football Platform. It is not a research archive. What matters is that pages contain the strongest current guidance for Claude Code to use when building features.

**The pipeline:**

```
NotebookLM (synthesis engine — holds AI model sweep results + URL sources)
        ↓
   Claude (judgment layer — Claude.ai chat, Claude Desktop, or Cowork)
        ↓
   wiki/ topics (curated guidance database — committed to main)
        ↓
   Claude Code (consumer — reads wiki at session start before writing code)
```

NotebookLM holds the raw corpus. You decide what is wiki-worthy, diff against existing pages, and commit synthesized guidance. Claude Code never sees NotebookLM, never sees sources, never sees provenance — it only reads the curated pages.

---

## When to Use Discovery Protocol vs Single-Source Ingestion

**Discovery Protocol (this file):** Default mode. Used for systematically extracting everything wiki-worthy from the NotebookLM notebooks. Subject-driven — you and Nick walk the ranked queue and pull synthesis from NotebookLM for each triple of subjects.

**Single-Source Ingestion (`wiki/WIKI_CHAT_CONTEXT.md`):** One-off mode. Used when Nick drops a specific source directly into a session — a URL, a PDF, a pasted article, an AI response. The two-phase block system applies. The Discovery Protocol does not gate single-source ingests.

Both modes share: ingest plan display + block-by-block execution + verification cache for factual claims + size tier rules + split protocol + tag system + page quality standards.

---

## The Workflow

### Phase 0: Initialize the Queue (one-time per notebook)

1. Nick opens the target NotebookLM notebook and runs the **Discovery Prompt** (template below — use the notebook-specific variant, not the generic one).
2. NotebookLM returns exactly 25 subjects for the notebook (since this wiki has 25 subjects per notebook), ranked by volume of source material, each annotated with a corpus depth rating.
3. Nick pastes the response into the session.
4. Parse the response into the four `wiki/_queue_nb{N}{a-d}.md` batch files — approximately 6-7 slots each. Sort subjects Rich → Moderate → Thin within each batch file, then alphabetically within each tier. Replace any existing placeholder stubs entirely — no stub survives into ingestion.
5. Update `wiki/_queue_master.md`: set the first batch file (nb{N}a) → ACTIVE, record the discovery run date and subject count in the changelog header. Commit all four batch files and the master index. The discovery cycle for that notebook is initialized.

**Self-healing rule:** If placeholder stubs exist in a batch file when the discovery response arrives, replace them entirely. Every slot must contain a real subject entry (with Description and corpus depth) or remain an empty reserved slot — never a named-but-undescribed stub.

Individual subject entries always go into batch queue files. The master index (`wiki/_queue_master.md`) is a navigation index only — it never contains subject entries.

**Queue entry format** (in the relevant `wiki/_queue_nb{N}{a-d}.md` batch file):

```
### [N.M] [Subject Title]

- Status: PENDING
- Wiki Category: [one of the 4 valid category slugs]
- Description: [one sentence describing the subject]
- Notes: [corpus depth: Rich/Moderate/Thin] — [number] sources
```

Where N is the notebook number and M is the subject number within that notebook.

### Phase 1: Per-Session Subject Loop (3 subjects per session)

Each session — fresh or continuing, any device — processes exactly 3 subjects before stopping. Nick starts a new session for the next triple. This is the standard cadence.

1. **Read `wiki/_queue_master.md`.** Find the first ACTIVE queue file. Read that file. Find the next three entries with `Status: PENDING`. If fewer than 3 PENDING entries remain in the entire ACTIVE file, process however many remain. If no ACTIVE file has any PENDING entries, the cycle is complete — report it and stop.

2. **Cross-check all three subjects against existing wiki coverage.** Read `wiki/index.md` and the relevant category `_index.md` files. Check pages by tag overlap and title relevance for each subject. If a subject is already fully covered at strength, mark that queue entry `SKIPPED` with a note citing which pages cover it and pull the next PENDING entry to maintain the triple of 3. Do not generate a NotebookLM prompt for skipped subjects.

3. **Mark all three entries `IN_PROGRESS`** in the active batch file in a single commit. Then generate the **3-Subject Followup Prompt** (template below) for Nick to paste into NotebookLM. The prompt asks for synthesis of all three subjects in a single response, each under a clearly labeled header.

4. **Wait.** Nick runs the prompt in NotebookLM and pastes the combined response back.

5. **Diff and plan for all three subjects together.** Read NotebookLM's response. Identify all wiki pages affected by all three subjects. Read each affected page in full. Produce a single Ingest Plan covering all blocks for all three subjects combined (max 10 content blocks total plus 1 housekeeping block). Display the plan and proceed immediately — do not wait for approval. **Increment `pages_read` for every page read.**

6. **Execute all blocks in sequence without gates.** Read target page, synthesize per quality standards, validate frontmatter against `wiki/schema.yml`, commit, verify SHA changed, report `BLOCK [N] DONE`, proceed immediately to the next block. **Increment `blocks_executed` after each block.**

7. **Housekeeping block** is always last and covers all three subjects. After all content blocks complete: update affected `_index.md` files, `wiki/index.md` page count table if any pages were added, `wiki/tags.md` if new tags were created, `wiki/verification-cache.md` if claims were verified or conflicts resolved, `wiki/WIKI_ROADMAP.md` Progress Tracker if a notebook just completed. Commit as one commit.

8. **Mark all three queue entries COMPLETED** in the active batch file in a single commit, with brief notes on what pages were created or updated for each. If the entries include the last PENDING entries in the batch file, also update `wiki/_queue_master.md`: set the current batch file → COMPLETED and set the next batch file → ACTIVE. Commit the master index update in the same or immediately following commit.

9. **Output the Triple Subject Completion Report** (format below).

10. **STOP.** The session is complete. Nick starts a new session for the next triple of subjects. Do not continue processing in the current session regardless of remaining context capacity.

### Phase 2: Cross-Session Continuation

No manual handoff is needed. Each fresh session reads `wiki/_queue_master.md`, opens the ACTIVE batch queue file, picks up the next three PENDING subjects, and continues. The master index and batch files are the only state.

**Session start protocol for Discovery cycles:**

1. Read `wiki/schema.yml`
2. Read `wiki/session-state.md`
3. Read `wiki/tags.md`
4. Read `wiki/verification-cache.md`
5. Read `wiki/_queue_master.md`, then read the first ACTIVE queue file
6. Initialize counters: `blocks_executed = 0`, `pages_read = 0`
7. Find the next three PENDING subjects and proceed to Phase 1 step 2

### Exit Conditions

The discovery cycle ends when:

- Every queue entry across all 4 notebooks is `COMPLETED` or `SKIPPED`
- All remaining PENDING entries are low-priority and Nick decides the wiki is sufficiently strong to stop
- Nick wants to refresh the queue by running a new Discovery Prompt in NotebookLM (e.g., after adding many new sources) — re-run Phase 0 for the affected notebook

When the cycle ends, report it. Do not auto-start a new cycle.

---

## Synthesis Standards

All content quality standards from `wiki/WIKI_CHAT_CONTEXT.md` apply unchanged:

- Page Quality Standards (Summary 2–4 sentences, self-contained pages, zero code, Key Decisions tied to the Fantasy platform)
- Synthesis Standard (rewrite not copy, strip code, verify factual claims, no marketing language)
- Key Decisions Quality Standard (platform-specific decisions with reasoning)
- AI Source Handling (NotebookLM responses are raw material, not authoritative — synthesize and verify)
- Confidence Calibration (high/medium/low based on evidence quality, not source age)
- Volatile Data Handling (date-stamp only pricing, regulatory, company status, feature availability)
- Size Tiers and Split Protocol (target 10–30KB, split at 35KB+, every split page stands alone)
- Tag System (max 15 per page, lowercase-hyphenated, use existing tags from `wiki/tags.md` first)
- Verification Cache (90-day trust window, 5-minute cap per claim)
- Wiki Directory Containment (every file path starts with `wiki/`)

---

## Templates

### Discovery Prompt — Standard (paste into NotebookLM, one notebook at a time)

```
You have access to all sources in this notebook. I need you to map the full subject landscape covered across the entire corpus.

Return exactly 25 subjects covered across all sources, ranked strictly by volume of source material — the subjects with the most source coverage come first, the least come last. Do not rank by importance or relevance. Rank only by how much material in this corpus covers each subject.

For each subject, provide:
1. A one-sentence description of what the subject covers across the sources
2. A corpus depth rating: Rich (5+ sources), Moderate (2–4 sources), or Thin (1 source)

Format each entry as:
[NUMBER]. [Subject Title] — [one-sentence description] [DEPTH: Rich/Moderate/Thin]

Be specific with subject titles. Vague titles like "Injuries" are too broad — prefer "Hamstring Injury Recovery Timeline and Return-to-Production Curves" or similar specificity.

Return just the numbered list. No preamble, no closing summary.
```

### 3-Subject Followup Prompt (Phase 1 step 3 — generated per session triple, paste into NotebookLM)

```
Synthesize everything across all sources in the notebook on the following three subjects. Address each subject separately under its own labeled header. For each subject, prioritize depth over breadth — I want the strongest, most actionable guidance the corpus contains, not a survey of opinions.

Weighting rules (apply to all subjects):
- Claims supported by 3 or more sources carry the most weight. Treat them as settled knowledge.
- Claims supported by 1–2 sources should be presented but flagged as less corroborated.
- When sources contradict, present the contradiction directly with the strongest evidence on each side. Do not hide disagreements.

For each subject, cover:
1. Core mechanics and principles — how it actually works at the implementation or design level
2. Specific platform-by-platform behavior where the sources document it
3. Edge cases, failure patterns, and known pitfalls
4. Best-practice guidance the sources converge on, with corroboration weight noted
5. Open questions or unresolved tensions in the corpus

No code or implementation snippets. Plain language only. No preambles or promotional language. If the corpus has limited material on a subject, say so directly rather than padding.

---

SUBJECT A: [SUBJECT A TITLE FROM QUEUE]

[SUBJECT A DESCRIPTION FROM QUEUE]

---

SUBJECT B: [SUBJECT B TITLE FROM QUEUE]

[SUBJECT B DESCRIPTION FROM QUEUE]

---

SUBJECT C: [SUBJECT C TITLE FROM QUEUE]

[SUBJECT C DESCRIPTION FROM QUEUE]
```

### Triple Subject Completion Report (output after housekeeping)

Output exactly this and nothing more:

```
SUBJECTS COMPLETED: [subject A title] | [subject B title] | [subject C title]
QUEUE ENTRIES: [N.M], [N.M+1], and [N.M+2]
BLOCKS PLANNED: [N]
BLOCKS COMPLETED: [N]
ACTION: [Created/Updated {page-name} | Created/Updated {page-name} | ...]
CATEGORIES: [all categories touched]
PAGES TOUCHED: [count]
TAGS: [new tags created, or NONE]
KEY TAKEAWAY A: [1 sentence — strongest guidance subject A contributed]
KEY TAKEAWAY B: [1 sentence — strongest guidance subject B contributed]
KEY TAKEAWAY C: [1 sentence — strongest guidance subject C contributed]
SESSION: [FRESH/WARM/HOT/STOP] — [X] blocks executed, [Y] pages read
QUEUE STATUS: [N PENDING | N IN_PROGRESS | N COMPLETED | N SKIPPED]
RISK: [only when: contradiction resolved, confidence downgraded, or a NotebookLM claim rejected after verification. Omit for clean ingests.]
DEFERRED: [only when blocks were dropped or marked partial. Omit if all blocks completed.]
```

---

## Edge Cases

**Fewer than 3 PENDING entries remain.** Process however many remain — 1 or 2. Generate a reduced followup prompt with only the available subjects. Output a completion report with only the available subjects' KEY TAKEAWAYs.

**First subject synthesis is unexpectedly very large.** If executing subjects pushes the session to HOT status, complete the current subject and run housekeeping for completed subjects only. Mark remaining subjects back to PENDING. Output a partial report noting which subjects are deferred.

**NotebookLM returns thin output for a subject.** Mark that queue entry COMPLETED with a note: "Insufficient corpus depth — no wiki update warranted."

**A subject is already fully covered in existing pages.** Mark it SKIPPED with a note citing which pages cover it. Pull the next PENDING entry to keep the session triple at 3 subjects.

**The followup response contradicts existing wiki content.** Standard verification rules apply: check the verification cache, web search if needed.

**An entry shows IN_PROGRESS but no session is actively working it.** The previous session ended without completing it. Reset to PENDING and include it in the next triple.

---

## Self-Healing Commit Sequence

After every ingest session, the following files must be updated (as applicable) in the housekeeping block.

| File | Update trigger | What to update |
| ---- | -------------- | -------------- |
| `wiki/topics/{category}/_index.md` | Any page created or updated in that category | Add/update the page entry |
| `wiki/index.md` | Any new page created | Increment page count in the Page Count table |
| `wiki/tags.md` | Any new tag created | Add the tag to the correct section |
| `wiki/verification-cache.md` | Any factual claim verified or conflict resolved | Add/update the cache entry |
| `wiki/_queue_master.md` | Current batch file just hit 100% COMPLETED or SKIPPED | Set current file → COMPLETED, next file → ACTIVE |
| `wiki/WIKI_ROADMAP.md` | A full notebook just completed | Update Ingestion Order table and Progress Tracker |

---

_End of wiki/DISCOVERY_PROTOCOL.md_
