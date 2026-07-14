# Fantasy Football Platform Wiki — Session Context Monitor

> **Tracks context health for wiki maintenance sessions**
>
> **Rules are IN-MEMORY only — counters are never written to disk between sources**
>
> **Reference this file at session start. Initialize counters to zero. Never commit counter values.**

---

## Why This Exists

Every wiki maintenance session runs inside a context window with a fixed limit. As a session reads more pages and executes more blocks, the available context shrinks. Near the limit, synthesis quality degrades — the AI begins to miss nuance, skip cross-checks, and produce lower-quality page content without being aware of it.

These limits trigger well before the hard context window ceiling. The goal is to ensure every topic receives the same synthesis quality as the first topic in the session — no degradation, no shortcuts, no rushed pages at the end of a long session. When the monitor says HOT, the right move is to finish the current block cleanly and start fresh rather than push through and get poor output on the last few pages.

---

## Session Counters

Initialize both counters to zero at the start of every session. These values live only in working memory — they are never written to any file.

| Counter | Tracks | Limit |
| ------- | ------ | ----- |
| `blocks_executed` | Content blocks committed during Phase 2 | 10 |
| `pages_read` | Wiki content pages read (pages under `wiki/topics/` only) | 20 |

**System files do not count toward `pages_read`.** Reading `schema.yml`, `session-state.md`, `tags.md`, `verification-cache.md`, `_queue_master.md`, any `_queue_nbN*.md` file, `index.md`, and category `_index.md` files does not increment the counter. Only substantive content pages under `wiki/topics/` count.

**Housekeeping blocks do not count toward `blocks_executed`.** The final housekeeping block (updating indexes, tags, verification cache) is excluded from the block counter.

---

## Status Levels

| Status | Blocks Executed | Pages Read | Meaning |
| ------ | --------------- | ---------- | ------- |
| **FRESH** | 0–4 | 0–9 | Full capacity. Process topics at normal pace. |
| **WARM** | 5–7 | 10–15 | Nearing the zone. Still good. Begin watching. |
| **HOT** | 8–9 | 16–19 | Quality may degrade. Finish current block cleanly. Recommend fresh session for next topic. |
| **STOP** | ≥10 | ≥20 | Context limit reached. Do not accept another topic. Tell Nick to start a fresh session. |

Either counter reaching its threshold determines the status — the higher-severity threshold wins.

---

## Behavior at Each Level

**FRESH:** Proceed normally. No warnings needed.

**WARM:** Continue processing. Append `SESSION: WARM` to the completion report. No behavior change required yet.

**HOT:** Complete the current block and run housekeeping. Append `SESSION: HOT — Context is running hot. Recommend starting a fresh session for the next topic.` to the completion report. Do not start another topic in this session.

**STOP:** Do not accept another source or topic. Tell Nick directly: "Context limit reached. Start a fresh session before continuing." Append `SESSION: STOP — Context limit reached. Start a fresh session before ingesting more topics.` to any output. This is not optional.

---

## Status Appended to Every Completion Report

Every ingest completion report includes this line:

```
SESSION: [FRESH/WARM/HOT/STOP] — [blocks_executed] blocks executed, [pages_read] pages read
```

This line appears on every report without exception. It tells Nick where the session stands so he can decide whether to continue or start fresh.

---

## Limits Are Conservative by Design

The block limit of 10 and page read limit of 20 are set conservatively. The actual context window is larger. These limits exist to preserve synthesis quality — not to maximize throughput. A session that processes 8 blocks with high-quality output is better than one that processes 14 blocks with degrading quality on the last 6.

If Nick explicitly requests more output and the session is HOT, acknowledge the request, note the risk, and proceed — but flag it clearly. The STOP threshold is absolute and cannot be overridden.

---

_End of wiki/session-state.md_
