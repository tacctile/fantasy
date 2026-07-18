# Queue File: Notebook 1 — Player Evaluation & Opportunity Metrics (Part A)

**Notebook:** Player Evaluation & Opportunity Metrics
**Wiki category:** player-evaluation
**Priority:** HIGHEST — foundational opportunity metrics everything else references
**Entry range:** 1.1–1.7 (7 entries)
**Generated:** 2026-07-14

---

### 1.1 Target Share

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: The percentage of a team's total targets directed at a specific receiver, the single most predictive per-game opportunity metric for wide receivers and tight ends.
- Notes: corpus depth: Rich — ~150 sources. Created player-evaluation/target-share (confidence: high, 3-way model convergence). Strengthened 2026-07-17 via chathub.gg 6-model panel redo (dropback denominator, YoY stability stat, vacated-targets pitfall).

---

### 1.2 Air Yards Share

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: A receiver's share of total team air yards (the distance the ball travels in the air on targets), capturing deep-ball opportunity and separation from catch-based metrics.
- Notes: corpus depth: Rich — ~150 sources. Created player-evaluation/air-yards-share (confidence: medium, 2-way model convergence). Strengthened 2026-07-17 via chathub.gg 6-model panel redo (RACR, intended-vs-completed distinction, backup-QB denominator trap); confidence upgraded to high.

---

### 1.3 Weighted Opportunity Rating (WOPR)

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: A composite metric combining target share and air yards share into a single opportunity score that better predicts fantasy production than either component alone.
- Notes: corpus depth: Rich — ~150 sources. Created player-evaluation/wopr (confidence: medium, 2-way model convergence). Strengthened 2026-07-17 via chathub.gg 6-model panel redo; resolved a coefficient contradiction (5-of-6 models confirmed canonical 1.5/0.7 formula against 1 outlier claiming 0.75/0.25).

---

### 1.4 Yards Per Route Run (YPRR)

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: Total receiving yards divided by routes run, an efficiency metric that normalizes production across receivers with different snap share and target volume.
- Notes: corpus depth: Rich — ~150 sources. Created player-evaluation/yprr (confidence: high, 6-way model convergence).

---

### 1.5 Route Participation Rate

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: The percentage of pass plays on which a receiver runs a route, distinguishing full-time slot receivers from red zone specialists and situational packages.
- Notes: corpus depth: Rich — ~150 sources. Created player-evaluation/route-participation-rate (confidence: high, 6-way model convergence).

---

### 1.6 Snap Share

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: The percentage of offensive snaps a player is on the field for, the foundational availability metric underlying all opportunity-based analysis.
- Notes: corpus depth: Rich — ~150 sources. Created player-evaluation/snap-share (confidence: high, 6-way model convergence).

---

### 1.7 Red Zone Target Share

- Status: IN_PROGRESS
- Wiki Category: player-evaluation
- Description: A receiver's share of team targets inside the opponent's 20-yard line, a high-leverage opportunity metric that predicts touchdown upside disproportionate to overall target share.
- Notes: corpus depth: Rich — ~150 sources

---

This file covers entries 1.1–1.7. When all entries are COMPLETED or SKIPPED, update `wiki/_queue_master.md`: set this file → COMPLETED, set `wiki/_queue_nb1b.md` → ACTIVE.

_End of wiki/_queue_nb1a.md_
