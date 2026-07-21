EXECUTION ENVIRONMENT: This file is used in any dedicated wiki-maintenance session, regardless of environment — Claude Desktop with GitHub MCP, Claude.ai chat, Cowork, or Claude Code (VS Code, terminal, repo already cloned). Nick moves between all of these depending on where he's working from at the time; none is the "real" environment and none is excluded. The distinction that matters is session *type* (dedicated wiki-maintenance session vs. ordinary feature-build/audit-fix session), not which product Nick opened. In Claude Desktop or Cowork with GitHub MCP: commit directly to main via GitHub MCP. In a Claude Code wiki-maintenance session: commit directly to main via local git. In Claude.ai chat without MCP: produce file content for Nick to commit manually.

# Fantasy Football Platform Wiki — Discovery Protocol

> The primary ingestion mode for building the Fantasy wiki from the chathub.gg 6-model panel.
> Single-source ingestion (defined in `wiki/WIKI_CHAT_CONTEXT.md`) remains available
> for one-off sources Nick drops directly into a session.
>
> Standard session cadence: 3 subjects per session. Nick starts a new session after every triple.
>
> Last Updated: 2026-07-17

---

## Mental Model

The wiki is a **guidance database for Claude Code** building the Fantasy Football Platform. It is not a research archive. What matters is that pages contain the strongest current guidance for Claude Code to use when building features.

**The pipeline:**

```
chathub.gg (6 independent AI models, run against the same prompt simultaneously)
        ↓
   Claude (judgment layer — convergence-filters the 6 responses, then synthesizes)
        ↓
   wiki/ topics (curated guidance database — committed to main)
        ↓
   Claude Code (consumer — reads wiki at session start before writing code)
```

chathub.gg fans a single prompt out to 6 independent models and returns 6 independent responses — there is no shared corpus, no shared memory between them, and no guarantee of agreement. You are the entire synthesis layer: you weigh which claims are corroborated across multiple models, discard claims only one model makes (especially specific-sounding but unverifiable claims like named platforms or exact source counts), and reconcile direct contradictions using judgment, not a lookup. Claude Code never sees chathub.gg, never sees the 6 raw responses, never sees which model said what — it only reads the curated pages.

### Why 6 independent models instead of one synthesis engine

A single synthesis source (one document, one model, one notebook) can only be right or wrong — there is nothing to check it against. Six independent models answering the same prompt gives you a natural corroboration signal: a claim 4+ models converge on is far more trustworthy than a claim only one model makes, even if that one claim sounds authoritative. This also surfaces disagreement directly — if one model says a subject has "zero source coverage" while two others deliver detailed, mutually consistent synthesis, that tension is informative and must be resolved through judgment (see Convergence-Filtering Standard below), not ignored.

---

## When to Use Discovery Protocol vs Single-Source Ingestion

**Discovery Protocol (this file):** Default mode. Used for systematically extracting everything wiki-worthy from the 100-subject queue. Subject-driven — you and Nick walk the ranked queue and pull a 6-model panel synthesis from chathub.gg for each triple of subjects.

**Single-Source Ingestion (`wiki/WIKI_CHAT_CONTEXT.md`):** One-off mode. Used when Nick drops a specific source directly into a session — a URL, a PDF, a pasted article, an AI response. The two-phase block system applies. The Discovery Protocol does not gate single-source ingests.

Both modes share: ingest plan display + block-by-block execution + verification cache for factual claims + size tier rules + split protocol + tag system + page quality standards.

---

## The Workflow

### Phase 0: Queue Initialization — Already Complete

All 100 subjects across all 4 notebooks were pre-populated into the 16 batch queue files at wiki initialization (2026-07-14). There is no per-notebook discovery step anymore — the subject list is fixed. Phase 0 never runs again unless Nick explicitly wants to add new subjects to a batch file (a manual queue edit, not a protocol step).

Individual subject entries live in batch queue files only. The master index (`wiki/_queue_master.md`) is a navigation index only — it never contains subject entries.

**Queue entry format** (in the relevant `wiki/_queue_nb{N}{a-d}.md` batch file):

```
### [N.M] [Subject Title]

- Status: PENDING
- Wiki Category: [one of the 4 valid category slugs]
- Description: [one sentence describing the subject]
- Notes: [corpus depth: Rich/Moderate/Thin] — [number] sources
```

Where N is the notebook number and M is the subject number within that notebook. The `Notes` field's corpus-depth rating is a legacy artifact from initial queue population — it is not re-derived from chathub.gg and should not be treated as authoritative once a subject is actually ingested.

### Phase 1: Per-Session Subject Loop (3 subjects per session)

Each session — fresh or continuing, any device — processes exactly 3 subjects before stopping. Nick starts a new session for the next triple. This is the standard cadence.

1. **Read `wiki/_queue_master.md`.** Find the first ACTIVE queue file. Read that file. Find the next three entries with `Status: PENDING`. If fewer than 3 PENDING entries remain in the entire ACTIVE file, process however many remain. If no ACTIVE file has any PENDING entries, the cycle is complete — report it and stop.

2. **Cross-check all three subjects against existing wiki coverage.** Read `wiki/index.md` and the relevant category `_index.md` files. Check pages by tag overlap and title relevance for each subject. If a subject is already fully covered at strength, mark that queue entry `SKIPPED` with a note citing which pages cover it and pull the next PENDING entry to maintain the triple of 3. Do not generate a panel prompt for skipped subjects.

3. **Mark all three entries `IN_PROGRESS`** in the active batch file in a single commit. Then generate the **3-Subject Panel Prompt** (template below) for Nick to paste into chathub.gg, where it fans out to all 6 configured models simultaneously.

4. **Wait.** Nick runs the prompt in chathub.gg and pastes each of the 6 model responses back into the session, one at a time.

5. **Convergence-filter and plan for all three subjects together.** Once all 6 responses are in, apply the Convergence-Filtering Standard (below) to each subject independently. Identify all wiki pages affected by all three subjects. Read each affected page in full. Produce a single Ingest Plan covering all blocks for all three subjects combined (max 10 content blocks total plus 1 housekeeping block). Display the plan and proceed immediately — do not wait for approval. **Increment `pages_read` for every page read.**

6. **Execute all blocks in sequence without gates.** Read target page, synthesize per quality standards, validate frontmatter against `wiki/schema.yml`, commit, verify SHA changed, report `BLOCK [N] DONE`, proceed immediately to the next block. **Increment `blocks_executed` after each block.**

7. **Housekeeping block** is always last and covers all three subjects. After all content blocks complete: update affected `_index.md` files, `wiki/index.md` page count table if any pages were added, `wiki/tags.md` if new tags were created, `wiki/verification-cache.md` if claims were verified or conflicts resolved, `wiki/WIKI_ROADMAP.md` Progress Tracker if a notebook just completed. Commit as one commit.

8. **Mark all three queue entries COMPLETED** in the active batch file in a single commit, with brief notes on what pages were created or updated for each. If the entries include the last PENDING entries in the batch file, also update `wiki/_queue_master.md`: set the current batch file → COMPLETED and set the next batch file → ACTIVE. Commit the master index update in the same or immediately following commit.

9. **Output the Triple Subject Completion Report** (format below).

10. **STOP.** The session is complete. Nick starts a new session for the next triple of subjects. Do not continue processing in the current session regardless of remaining context capacity.

---

## Convergence-Filtering Standard

Applied once all 6 chathub.gg responses for a triple are in hand, per subject:

- **2+ models agree on a specific claim (fact, threshold, formula, pitfall):** Include it. Treat 3+ agreement as strong/settled; 2-model agreement as corroborated but note lighter weight if it materially affects a Key Decision.
- **Only 1 model makes a claim:** Include only if it is a general principle or mechanic that is plausible and doesn't require independent verification (e.g., a well-known pitfall). Exclude specific-sounding but unverifiable claims made by only one model — named platforms/tools, exact source counts, precise correlation coefficients, named individuals — unless independently verifiable (web search, verification cache). Fabricated-sounding specificity from a single model is a known failure mode of AI panels and must not be laundered into the wiki as fact.
- **Models directly contradict each other** (e.g., one reports "zero coverage" for a subject while others deliver full synthesis): Do not average or split the difference. Weigh which side has actual corroboration (multiple independent models agreeing) versus which side is a lone outlier, and resolve in favor of corroboration. Note the contradiction and resolution in the session's `RISK:` line.
- **A response is a refusal or non-answer** (a model declines to synthesize, asks for source material, or otherwise produces no usable content): Discard it entirely. It does not count toward corroboration in either direction.
- **All 6 responses converge tightly:** Confidence: high is justified. **Partial convergence (2-3 of 6) with no direct contradiction:** Confidence: medium. **Thin, single-model, or heavily contradicted material:** Confidence: low, or fold into Open Questions instead of Core Knowledge/Key Decisions.

This filtering step replaces the old NotebookLM diff-against-corpus step. It is Claude's judgment call, not a mechanical rule — when genuinely uncertain, prefer medium confidence and an Open Questions entry over fabricating certainty.

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
- Nick wants to add new subjects to a batch file — a manual queue edit, not a protocol re-run

When the cycle ends, report it. Do not auto-start a new cycle.

---

## Synthesis Standards

All content quality standards from `wiki/WIKI_CHAT_CONTEXT.md` apply unchanged:

- Page Quality Standards (Summary 2–4 sentences, self-contained pages, zero code, Key Decisions tied to the Fantasy platform)
- Synthesis Standard (rewrite not copy, strip code, verify factual claims, no marketing language)
- Key Decisions Quality Standard (platform-specific decisions with reasoning)
- AI Source Handling (chathub.gg model responses are raw material, not authoritative — convergence-filter, synthesize, and verify per the Convergence-Filtering Standard above)
- Confidence Calibration (high/medium/low based on evidence quality and cross-model corroboration, not source age)
- Volatile Data Handling (date-stamp only pricing, regulatory, company status, feature availability)
- Size Tiers and Split Protocol (target 10–30KB, split at 35KB+, every split page stands alone)
- Tag System (max 15 per page, lowercase-hyphenated, use existing tags from `wiki/tags.md` first)
- Verification Cache (90-day trust window, 5-minute cap per claim)
- Wiki Directory Containment (every file path starts with `wiki/`)

---

## Templates

### 3-Subject Panel Prompt (Phase 1 step 3 — generated per session triple, paste into chathub.gg to fan out to all 6 configured models)

Every panel prompt opens with the same fantasy-football-expert framing so all 6 models share identical context regardless of session or device. This framing is football-only — it never mentions the wiki, the platform, Claude Code, or that the output feeds an ingestion pipeline. Platform-specific shaping happens entirely in Claude's synthesis step afterward, not in what the models are told.

```
You are a fantasy football analytics expert with deep, current knowledge of player evaluation, team scheme, league mechanics, and in-season roster management. Answer with maximum depth, rigor, and specificity — this is for serious analytical use, not a casual explainer.

Address the following three subjects separately, each under its own clearly labeled header. For each subject, prioritize depth over breadth — give the strongest, most actionable analysis you have, not a survey of opinions.

For each subject, cover:
1. Core mechanics and principles — how it actually works, including any relevant formulas or calculation methods
2. Documented differences in how major analytics platforms or data providers treat this metric or concept, where you have reliable knowledge of such differences
3. Edge cases, failure patterns, and known pitfalls
4. Best-practice guidance, noting where your confidence is high (well-established, widely agreed) versus lower (contested or less certain)
5. Open questions or unresolved tensions in current analysis

No code or implementation snippets. Plain language only. No preambles or promotional language. If you have limited reliable knowledge on a subject, say so directly rather than padding with generic content.

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

Nick pastes this once into chathub.gg, which runs it against all 6 configured models and returns 6 independent responses. Nick pastes each response back into the session individually, in any order. Discard any response that is a refusal or non-answer (see Convergence-Filtering Standard) — it does not need to be regenerated or replaced.

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
RISK: [only when: a cross-model contradiction was resolved, confidence was downgraded, or a single-model claim was rejected as unverifiable. Omit for clean ingests.]
DEFERRED: [only when blocks were dropped or marked partial. Omit if all blocks completed.]
```

---

## Edge Cases

**Fewer than 3 PENDING entries remain.** Process however many remain — 1 or 2. Generate a reduced panel prompt with only the available subjects. Output a completion report with only the available subjects' KEY TAKEAWAYs.

**First subject synthesis is unexpectedly very large.** If executing subjects pushes the session to HOT status, complete the current subject and run housekeeping for completed subjects only. Mark remaining subjects back to PENDING. Output a partial report noting which subjects are deferred.

**Most or all of the 6 panel responses are thin or low-value for a subject.** Mark that queue entry COMPLETED with a note: "Insufficient model consensus/depth — no wiki update warranted."

**A subject is already fully covered in existing pages.** Mark it SKIPPED with a note citing which pages cover it. Pull the next PENDING entry to keep the session triple at 3 subjects.

**The panel response contradicts existing wiki content.** Standard verification rules apply: check the verification cache, web search if needed.

**Fewer than 6 responses come back usable (some were refusals/non-answers).** Proceed with whatever usable responses remain — apply the Convergence-Filtering Standard against the smaller set, and lean toward medium/low confidence when corroboration is thin as a result.

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
