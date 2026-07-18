# Queue File: Notebook 1 — Player Evaluation & Opportunity Metrics (Part B)

**Notebook:** Player Evaluation & Opportunity Metrics
**Wiki category:** player-evaluation
**Entry range:** 1.8–1.13 (6 entries)
**Generated:** 2026-07-14

---

### 1.8 Goal-Line Carry Share

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: A running back's share of carries inside the opponent's 5-yard line, a high-leverage opportunity metric that predicts rushing touchdown upside independent of overall carry volume.
- Notes: corpus depth: Rich — ~150 sources. Created player-evaluation/goal-line-carry-share (confidence: medium) via chathub.gg 6-model panel; converged on mobile-QB suppression, small-sample volatility, team-vs-RB-only denominator distinction. Several single-model claims (named teams/players, exact numeric thresholds, hardcoded conversion coefficients) excluded per Convergence-Filtering Standard.

---

### 1.9 Carries Per Game / Carry Share

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: A running back's average carries per game and percentage of team rushing attempts, the primary opportunity baseline for evaluating backfield role and workload.
- Notes: corpus depth: Rich — ~150 sources. Created player-evaluation/carries-per-game (confidence: medium) via chathub.gg 6-model panel; converged on CPG/carry-share complementarity, denominator ambiguity (games-active vs. games-with-carry; kneel handling), game-script distortion. Several single-model claims (r-values, exact workhorse thresholds) excluded per Convergence-Filtering Standard.

---

### 1.10 Touches Per Game

- Status: IN_PROGRESS
- Wiki Category: player-evaluation
- Description: Total combined carries and receptions per game, measuring the full workload allocated to a skill player and serving as a composite opportunity signal.
- Notes: corpus depth: Rich — ~150 sources

---

### 1.11 Catch Rate / Contested Catch Rate

- Status: IN_PROGRESS
- Wiki Category: player-evaluation
- Description: The percentage of targets a receiver converts to receptions, split into clean-catch and contested scenarios, measuring reliability and the ability to produce on difficult throws.
- Notes: corpus depth: Rich — ~150 sources

---

### 1.12 Yards After Catch (YAC)

- Status: IN_PROGRESS
- Wiki Category: player-evaluation
- Description: Receiving yards accumulated after the catch, distinguishing scheme-generated production (manufactured touches) from after-the-catch athleticism and broken-tackle ability.
- Notes: corpus depth: Rich — ~150 sources

---

### 1.13 Average Depth of Target (aDOT)

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: The average distance downfield a receiver is targeted, indicating route tree depth, separation at various levels, and expected volatility versus floor in fantasy production.
- Notes: corpus depth: Rich — ~150 sources. Created player-evaluation/average-depth-of-target; convergence-filtered from 6-model panel; flagged aDOT stability and fantasy correlation claims for verification.

---

This file covers entries 1.8–1.13. When all entries are COMPLETED or SKIPPED, update `wiki/_queue_master.md`: set this file → COMPLETED, set `wiki/_queue_nb1c.md` → ACTIVE.

_End of wiki/_queue_nb1b.md_
