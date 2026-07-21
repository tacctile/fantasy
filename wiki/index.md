# Fantasy Football Platform — Wiki Index

> **Read-only knowledge base for Claude Code**
>
> **Rules:**
> - Claude Code reads this file first to navigate the wiki
> - Never read wiki pages blindly — always navigate via this index
> - Maximum 3 wiki pages per Claude Code session
> - This file is maintained automatically — updated on every page create or category add
> - Claude Code never writes to, modifies, or deletes any wiki file

---

## Navigation

| Category | Path | Description |
| -------- | ---- | ----------- |
| Player Evaluation | `wiki/topics/player-evaluation/` | Core statistical models for assessing player performance, opportunity share, and efficiency. Target share, air yards, WOPR, YPRR, snap share, route participation, touches per game, red zone target share, goal-line carry share, carries per game, catch rate, contested catch rate, drop rate, YAC, aDOT, explosive play rate, FPOE, xFP, VORP, college metrics, and athletic testing. |
| Team & Scheme | `wiki/topics/team-scheme/` | Team-level context that determines player opportunity and value. Pass rate, PROE, pace, offensive line quality, play-action, RPO, personnel groupings, motion, red zone efficiency, coaching tendencies, scheme identity, target distribution, backfield structure, DvP, Vegas lines, weather, home/away splits, and depth chart stability. |
| League Mechanics | `wiki/topics/league-mechanics/` | Scoring formats, draft strategy, and league structure. PPR/half-PPR/standard, TE premium, Superflex/2QB, roster construction, positional scarcity, ADP, VBD, Zero-RB/Hero-RB, stacking, handcuffs, auction draft, FAAB, waiver strategy, breakout/bust modeling, dynasty vs. redraft vs. keeper, best ball, trade value, bye week management, and playoff schedule strength. |
| In-Season Management | `wiki/topics/in-season-management/` | Weekly decisions, injury tracking, and situational data. Start/sit projections, ROS rankings, injury status, recovery timelines, age curves, workload risk, snap/target trend alerts, next-man-up value, game script sensitivity, strength of schedule, coaching changes, short-week effects, consistency scores, and ADP divergence. |
| Sleeper API | `wiki/topics/sleeper-api/` | Sleeper platform integration reference: endpoint structure, rate limits, auth (none required), and data-shape quirks for player identity, stats, and league data. In progress — 6 of 18 planned subjects ingested (authentication, league endpoint, roster endpoint, matchup endpoint, draft endpoint, users endpoint). |
| ESPN API | `wiki/topics/espn-api/` | ESPN platform integration reference: cookie-based auth (espn_s2/SWID), undocumented view parameters, rate limits, and endpoint structure for rosters, draft state, standings, and matchups. Queued — ingestion begins after Sleeper API notebook completes. |

---

## How to Navigate

1. Identify the category relevant to the current task
2. Read the category `_index.md` to find the right page
3. Read only the specific page needed — not the whole category
4. Cross-links in the `related` frontmatter field point to related pages
5. Tags in page frontmatter enable cross-category discovery

---

## Page Count

| Category | Pages |
| -------- | ----- |
| Player Evaluation | 26 |
| Team & Scheme | 24 |
| League Mechanics | 25 |
| In-Season Management | 23 |
| Sleeper API | 6 |
| ESPN API | 0 |
| **Total** | **104** |

---

## Governance Files

System files that manage the wiki itself. Claude Code does not read these during feature build sessions.

| File | Purpose |
| ---- | ------- |
| `wiki/schema.yml` | Canonical schema — all structural rules for wiki pages |
| `wiki/tags.md` | Controlled tag vocabulary |
| `wiki/_queue_master.md` | Discovery queue master index — navigation index pointing to the batch queue files |
| `wiki/session-state.md` | Context health monitor for wiki maintenance sessions |
| `wiki/verification-cache.md` | Verified factual claims — 90-day trust window |
| `wiki/WIKI_CHAT_CONTEXT.md` | Drop-in context file for any wiki maintenance session on any device |
| `wiki/DISCOVERY_PROTOCOL.md` | Primary ingestion workflow — chathub.gg 6-model panel discovery |
| `wiki/MAINTAINER.md` | Maintainer reference, pre-commit checklist, ingestion runs |
| `wiki/ROUTING.md` | Navigation protocol for Claude Code wiki consumption |
| `wiki/WIKI_ROADMAP.md` | Notebook plan and ingestion order — do not modify |
| `wiki/templates/canonical-page.md` | Template for domain-knowledge, architecture, product-spec, market-analysis, operations, ux-research pages |
| `wiki/templates/decision-record.md` | Template for decision-record pages |
| `wiki/templates/debugging-lesson.md` | Template for debugging-lesson pages |

All planned wiki topics are tracked via `wiki/_queue_master.md` (master navigation index) and batch queue files (`wiki/_queue_nb1a.md` through `wiki/_queue_nb6c.md`). The master index shows which queue file is ACTIVE. The ACTIVE batch file shows the topmost PENDING subject and all ingestion statuses for that set. Any session on any device reads the master, opens the ACTIVE batch file, and knows exactly where ingestion stands.

---

## Frontmatter Template

Every wiki page starts with this frontmatter:

```yaml
---
title: "Page Title"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "YYYY-MM-DD"
confidence: medium
tags:
  - tag-one
  - tag-two
related:
  - player-evaluation/related-page
---
```

---

_End of wiki/index.md_
