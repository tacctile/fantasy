# Player Evaluation

Core statistical models for assessing player performance, opportunity share, and efficiency.

| Page | Description | Confidence |
| ---- | ------------ | ---------- |
| [target-share](target-share.md) | Percentage of team pass attempts directed at a player — the strongest per-game opportunity metric for WR/TE. | high |
| [air-yards-share](air-yards-share.md) | Player's share of team air yards — isolates downfield/vertical opportunity from catch-based outcomes. | medium |
| [wopr](wopr.md) | Composite of target share and air yards share (1.5×TS + 0.7×AY) — single-number opportunity predictor. | medium |
| [yprr](yprr.md) | Receiving yards per route run — per-opportunity efficiency, unstable below ~150-200 routes. | high |
| [route-participation-rate](route-participation-rate.md) | Percentage of team pass plays a player runs a route on — bridges snap share and target share. | high |
| [snap-share](snap-share.md) | Percentage of team offensive snaps a player is on the field for — foundational but weakest standalone opportunity signal. | high |
| [touches-per-game](touches-per-game.md) | Combined carries and receptions per game — strongest repeatable predictor of fantasy floor once role is established; must be decomposed by carry/reception split and paired with snap share. | high |
| [red-zone-target-share](red-zone-target-share.md) | Player's share of team red-zone pass attempts — touchdown-upside multiplier best read as a tiered inside-20/10/5 breakdown, not one blanket bucket. | medium |
| [goal-line-carry-share](goal-line-carry-share.md) | Running back's share of team carries inside the 5-yard line — cleanest predictor of rushing TD upside, heavily suppressed by mobile-QB sneak usage. | medium |
| [carries-per-game](carries-per-game.md) | Running back's raw rushing volume and share of team carries — the workload baseline, paired with CPG for absolute weekly expectation. | medium |
| [average-depth-of-target](average-depth-of-target.md) | Average air-yard distance from line of scrimmage to target point — a role descriptor encoding receiver usage depth and expected weekly variance. | medium |
| [catch-rate](catch-rate.md) | Receptions divided by targets — a mixed efficiency metric requiring split by target depth; never standalone; paired with separation, aDOT, and expected catch rate for signal. | high |
| [contested-catch-rate](contested-catch-rate.md) | Conversion rate on targets with defender within one yard — describes high-leverage performance; requires 30+ contested targets to stabilize; provider definitions vary significantly. | medium |
| [explosive-play-rate](explosive-play-rate.md) | Percentage of touches gaining 15+ yards — measures ceiling and big-play upside; low year-over-year stability requires aggressive regression. | medium |
| [missed-tackles-forced](missed-tackles-forced.md) | Frequency of failed tackle attempts caused by ball carrier — isolates elusiveness and contact-avoidance skill; ~0.45-0.55 year-over-year stability. | medium |
| [yards-after-contact](yards-after-contact.md) | Yardage gained after first defensive contact in rushing plays — more stable than yards per carry; reveals runner-skill-driven vs. scheme-driven production. | medium |
| [drop-rate](drop-rate.md) | Drops divided by catchable targets — measures receiver hands while removing QB error; most inconsistently recorded stat; requires 40-50 targets to stabilize; weak year-over-year persistence (r² ~0.35-0.40). | medium |
| [first-read-target-rate](first-read-target-rate.md) | Share of dropbacks a receiver is the QB's designed primary read — a role-confirmation and offensive-intent signal, not a standalone talent metric; denominator (opportunity vs. target-share vs. conversion) varies by provider. | medium |
| [qb-designed-rush-scramble-rate](qb-designed-rush-scramble-rate.md) | Splits QB rush attempts into scheme-driven designed runs (stable fantasy floor) versus pressure/coverage-driven scrambles (volatile ceiling); RPO and read-option classification is the main charting battleground. | medium |
| [qb-epa-cpoe](qb-epa-cpoe.md) | EPA per dropback (total situational value) and CPOE (accuracy over expectation) — the two leading QB efficiency metrics; both confounded by supporting cast and scheme, the central unresolved "attribution problem." | medium |
| [expected-fantasy-points](expected-fantasy-points.md) | Model-derived estimate of fantasy points a player should score given their opportunity profile — isolates role quality from execution efficiency. | high |
| [fantasy-points-over-expected](fantasy-points-over-expected.md) | Difference between actual and expected fantasy points — measures efficiency and luck residual; highly volatile but useful for identifying regression candidates. | high |
| [value-over-replacement](value-over-replacement.md) | A player's fantasy production above replacement-level; core framework for draft valuation and trade analysis accounting for positional scarcity. | high |
