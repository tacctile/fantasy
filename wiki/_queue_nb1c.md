# Queue File: Notebook 1 — Player Evaluation & Opportunity Metrics (Part C)

**Notebook:** Player Evaluation & Opportunity Metrics
**Wiki category:** player-evaluation
**Entry range:** 1.14–1.19 (6 entries)
**Generated:** 2026-07-14

---

### 1.14 Explosive Play Rate / Breakaway Run Rate

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: The rate at which a skill player generates plays of 15+ yards (receivers) or 15+ yard runs (backs), measuring big-play upside and boom-week potential.
- Notes: corpus depth: Rich — ~150 sources. Created player-evaluation/explosive-play-rate; convergence-filtered from 6-model panel; flagged threshold standardization and year-over-year stability claims for verification.

---

### 1.15 Missed Tackles Forced / Yards After Contact

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: The number of missed tackles a ball carrier forces and yards gained after initial contact, measuring elusiveness and contact balance independent of blocking quality.
- Notes: corpus depth: Rich — ~150 sources. Created player-evaluation/missed-tackles-forced and player-evaluation/yards-after-contact; convergence-filtered from 6-model panel; flagged provider variance and year-over-year stability claims for verification.

---

### 1.16 Fantasy Points Over Expected (FPOE)

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: The difference between a player's actual fantasy points scored and the expected fantasy points given their opportunity profile, identifying outperformers and underperformers relative to their role.
- Notes: Created player-evaluation/fantasy-points-over-expected; convergence-filtered from 6-model panel; high-confidence mechanics, medium-confidence on empirical coefficients; flagged year-over-year stability claims for future verification.

---

### 1.17 Expected Fantasy Points (xFP)

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: A model-derived estimate of how many fantasy points a player should score given their opportunity inputs, providing a regression baseline and floor/ceiling calibration tool.
- Notes: Created player-evaluation/expected-fantasy-points; convergence-filtered from 6-model panel; high-confidence mechanics and platform variance; flagged TD modeling precision and defensive adjustment questions for future verification.

---

### 1.18 Value Over Replacement Player (VORP/VBD)

- Status: COMPLETED
- Wiki Category: player-evaluation
- Description: A player's fantasy production above the baseline replacement-level player at their position, the foundational metric for draft valuation and trade analysis.
- Notes: Created player-evaluation/value-over-replacement; convergence-filtered from 6-model panel; high-confidence core formula and league-dependence; flagged dynamic replacement-level calibration and superflex baseline questions for future verification.

---

### 1.19 Drop Rate

- Status: IN_PROGRESS
- Wiki Category: player-evaluation
- Description: The percentage of catchable targets a receiver fails to complete, measuring reliability and identifying negative regression candidates whose target volume exceeds their production.
- Notes: corpus depth: Rich — ~150 sources. Marked IN_PROGRESS 2026-07-17 for 3-subject panel prompt.

---

This file covers entries 1.14–1.19. When all entries are COMPLETED or SKIPPED, update `wiki/_queue_master.md`: set this file → COMPLETED, set `wiki/_queue_nb1d.md` → ACTIVE.

_End of wiki/_queue_nb1c.md_
