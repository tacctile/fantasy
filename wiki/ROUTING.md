# wiki/ROUTING.md
# Navigation protocol for Claude Code wiki consumption
# Read this to understand how to find the right wiki page fast

---

## Primary Navigation Path

1. Read `wiki/index.md` — identify the correct category
2. Read `wiki/topics/[category]/_index.md` — find the specific page
3. Read only that page — nothing else unless the prompt allows more

Never read wiki pages without first consulting the index.
Never read more than 3 wiki pages in a single session unless the prompt explicitly allows it.

---

## Secondary Navigation — Tag-Based Discovery

When a task spans multiple categories, use tags to find related pages:

1. Identify 2-3 key tags relevant to the task
2. Scan category `_index.md` files for pages carrying those tags
3. Read the highest-confidence pages first
4. Stop at 3 pages total

---

## Conflict Resolution

If a wiki page contradicts the prompt REQUIREMENTS:
- REQUIREMENTS win. Always.
- Flag the contradiction in the completion report
- Do not silently ignore it

If two wiki pages contradict each other:
- Use the higher-confidence page
- Flag the conflict in the completion report

---

## Category Routing Guide

| Task Type | Primary Category | Secondary Category |
| --------- | ---------------- | ------------------ |
| Target share / air yards / WOPR / YPRR | Player Evaluation | — |
| Snap share / route participation / opportunity metrics | Player Evaluation | — |
| Red zone targets / goal-line carries | Player Evaluation | Team & Scheme |
| Carry share / touches / backfield usage | Player Evaluation | Team & Scheme |
| Catch rate / YAC / aDOT / drop rate | Player Evaluation | — |
| Explosive play rate / yards after contact | Player Evaluation | — |
| FPOE / xFP / VORP / VBD | Player Evaluation | League Mechanics |
| TE alignment / route tree / target quality | Player Evaluation | Team & Scheme |
| Rookie metrics / college dominator / RAS / athletic testing | Player Evaluation | League Mechanics |
| QB EPA / CPOE / scramble rate | Player Evaluation | Team & Scheme |
| Team pass rate / PROE / neutral game script | Team & Scheme | — |
| Pace of play / plays per game | Team & Scheme | — |
| Offensive line quality / continuity / injuries | Team & Scheme | In-Season Management |
| Play-action / RPO / personnel groupings / motion | Team & Scheme | — |
| Red zone efficiency / third-down rate (team) | Team & Scheme | — |
| Coaching tendencies / OC play-calling / scheme identity | Team & Scheme | In-Season Management |
| Target distribution / backfield committee structure | Team & Scheme | Player Evaluation |
| DvP / opponent defense efficiency / DVOA | Team & Scheme | In-Season Management |
| Vegas lines / implied totals / point spread | Team & Scheme | In-Season Management |
| Weather / home-away / travel splits | Team & Scheme | In-Season Management |
| Depth chart stability / backup QB impact | Team & Scheme | In-Season Management |
| PPR / half-PPR / standard scoring formats | League Mechanics | — |
| TE premium / Superflex / 2QB value | League Mechanics | Player Evaluation |
| Roster construction / flex / league size | League Mechanics | — |
| Dynasty vs. redraft vs. keeper frameworks | League Mechanics | — |
| Best ball strategy | League Mechanics | — |
| ADP / ECR / positional scarcity / tier breaks | League Mechanics | — |
| VBD / Zero-RB / Hero-RB / Robust-RB strategy | League Mechanics | Player Evaluation |
| Late-round QB / stacking / handcuff strategy | League Mechanics | — |
| Auction draft / FAAB / waiver wire | League Mechanics | In-Season Management |
| Trade value calculation | League Mechanics | In-Season Management |
| Bye week management / playoff schedule strength | League Mechanics | In-Season Management |
| Rookie draft capital / breakout / bust modeling | League Mechanics | Player Evaluation |
| Start/sit decisions / weekly projections | In-Season Management | Player Evaluation |
| ROS rankings | In-Season Management | League Mechanics |
| Injury status / practice participation tracking | In-Season Management | — |
| Injury type recovery timelines | In-Season Management | — |
| Return-to-production curves post-injury | In-Season Management | Player Evaluation |
| Age curve / decline modeling / workload risk | In-Season Management | Player Evaluation |
| Contract year / suspension / legal status | In-Season Management | — |
| Snap/target trend alerts / role changes | In-Season Management | Player Evaluation |
| Next-man-up / injury replacement value | In-Season Management | Player Evaluation |
| Game script sensitivity / garbage-time production | In-Season Management | Team & Scheme |
| Positional run / reach vs. value detection | In-Season Management | League Mechanics |
| Points for/against luck analysis | In-Season Management | League Mechanics |
| Strength of schedule (positional, ROS) | In-Season Management | Team & Scheme |
| Coaching changes mid-season | In-Season Management | Team & Scheme |
| Short-week / Thursday / prime-time / post-bye splits | In-Season Management | Team & Scheme |
| Divisional matchup tendencies | In-Season Management | Team & Scheme |
| Rookie integration rate | In-Season Management | Player Evaluation |
| Consistency score / boom-bust rate | In-Season Management | Player Evaluation |
| Multi-platform ADP divergence | In-Season Management | League Mechanics |
| Sleeper endpoint structure / player ID format / rate limits | Sleeper API | — |
| ESPN cookie auth / undocumented view params / rate limits | ESPN API | — |
| League scoping conventions / player ID mapping / league_config data model | Schema Reference | — |

---

## Session Budget

| Condition | Max Wiki Pages |
| --------- | -------------- |
| Standard session | 3 |
| Prompt explicitly allows more | As specified |
| Audit session | 5 |
| Wiki ingestion session | N/A — wiki write sessions only |

---

## What Claude Code Never Does With Wiki — During Feature-Build/Audit-Fix Sessions

- Never writes to any wiki file
- Never modifies any wiki file
- Never deletes any wiki file
- Never creates wiki pages
- Never updates frontmatter
- Never updates _index.md files
- Never updates wiki/index.md page counts

This restriction applies to ordinary feature-build and audit-fix sessions, regardless of environment. It is not an environment restriction — Nick runs feature-build/audit-fix sessions and wiki-maintenance sessions from the same three environments (VS Code/Claude Code, Cowork, claude.ai), picking whichever fits at the time. What distinguishes the two is session *type*, declared at the start of the session (per `MASTER_CONTEXT.md`'s SESSION TYPE field and Prompt Format), not which product happens to be open.

All wiki maintenance happens through a dedicated wiki-maintenance session following `wiki/DISCOVERY_PROTOCOL.md` and `wiki/MAINTAINER.md` — never as a side effect of a feature-build or audit-fix session. A dedicated wiki-maintenance session may be run through Cowork, Claude Desktop with GitHub MCP, claude.ai chat, or Claude Code — all four are valid.

If a feature-build or audit-fix session identifies wiki content that appears missing, outdated, or incorrect, it notes this in its completion report under a `WIKI NOTE:` heading rather than acting on it directly. An explicit Rule 22 exception in the prompt's REQUIREMENTS block, or a dedicated wiki-maintenance session, are the only paths to an actual wiki edit.

---

## Discovery Queue

`wiki/_queue_master.md` is the navigation index for all planned wiki topics. It lists 16 batch queue files with their status (ACTIVE / LOCKED / COMPLETED). The ACTIVE batch file contains the current set of subjects being ingested. Claude Code may read `wiki/_queue_master.md` and the ACTIVE batch file to understand what wiki coverage exists or is planned for a given subject area.

Claude Code never modifies `_queue_master.md` or any `_queue_nbN*.md` file during a feature-build/audit-fix session — they are read-only in that mode like all other wiki files. During a dedicated wiki-maintenance session, these files are read and updated as part of the normal ingestion protocol, same as in Cowork/Desktop/claude.ai.

---

## Governance Files — For Wiki Maintenance Only

These files govern how the wiki is built and maintained. Not read during feature-build/audit-fix sessions, in any environment:

- `wiki/WIKI_CHAT_CONTEXT.md` — drop-in context file for wiki maintenance sessions
- `wiki/DISCOVERY_PROTOCOL.md` — primary ingestion workflow
- `wiki/MAINTAINER.md` — maintainer reference and pre-commit checklist
- `wiki/WIKI_ROADMAP.md` — living ingestion status dashboard

These files contain protocols for whichever session is doing wiki maintenance — Claude Code included, when that's the session type in play — not guidance for building features.

---

_End of wiki/ROUTING.md_
