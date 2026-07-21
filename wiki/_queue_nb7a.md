# Queue File: Notebook 7 — Schema Reference

**Notebook:** Schema Reference
**Wiki category:** schema-reference
**Priority:** SEVENTH — Wave 1 unblock, decision-record mode (not domain-knowledge synthesis)
**Entry range:** 7.1–7.3 (3 entries)
**Generated:** 2026-07-21
**LOCKED until:** `wiki/_queue_nb6c.md` reaches COMPLETED (i.e. all of Sleeper AND ESPN ingestion finished)

---

## Why This Notebook Is Different

Notebooks 1–6 synthesize from external sources — fantasy analytics consensus or published third-party API behavior — that a chathub.gg 6-model panel can actually research and converge on. Schema-reference has no external ground truth: it is this platform's own internal data model. There is nothing to look up: it must be **decided**, not synthesized.

Consequences for how this notebook runs, once unlocked:

- **Page type is `decision-record`, not `domain-knowledge`.** Required body sections per `wiki/schema.yml`: Context, Decision, Rationale, Rejected Alternatives, Date — not Summary/Core Knowledge/Key Decisions.
- **The chathub.gg panel is still useful, but only as input, not as the answer.** Reframe the panel prompt around data-architecture best practices for multi-provider fantasy-sports platforms (schema normalization patterns, ID-mapping pitfalls, multi-tenant scoping conventions) — not fantasy football analysis and not "what should Nick's schema be" (no external model can answer that). Claude and Nick make the actual decision; the panel just stress-tests it.
- **Each entry is a real platform decision**, not a knowledge page. Follow the Key Decisions Quality Standard from `wiki/WIKI_CHAT_CONTEXT.md`: "The platform will do X because [reason]. Alternative Y was considered and rejected because [reason]."
- **This should be a dedicated working session with Nick**, not a pure ingest-and-commit loop — these decisions are hard to unwind once Claude Code builds against them.

---

## Why It's Gated on Both Sleeper AND ESPN

All three subjects below depend on facts from both API notebooks:

- Player identity mapping is explicitly "Sleeper-anchored" per the category's own `_index.md`, but the crosswalk and fallback behavior can't be finalized until ESPN's proprietary player-ID inconsistencies (subject 6.15) are known — deciding this on Sleeper facts alone risks rework once ESPN lands.
- League configuration normalization needs both `sleeper-api/league-endpoint.md` and ESPN's equivalent (subjects 6.9–6.10, 6.7–6.8) to know what has to be reconciled into one internal shape.
- League scoping needs Sleeper's season-renewal/`previous_league_id` chaining (already known) plus ESPN's season/versioning model (subject 6.13) to avoid a Sleeper-only design that breaks on the second provider.

---

### 7.1 Multi-Platform League Identity and Scoping

- Status: PENDING
- Wiki Category: schema-reference
- Description: How the platform keys and scopes league records internally across multiple source platforms without collision — including how Sleeper's per-season `league_id` renewal/`previous_league_id` chaining and ESPN's season/versioning model are each mapped into one internal league-identity and season-history convention.
- Notes: (locked — do not ingest until Notebook 6 completes)

---

### 7.2 Platform-Agnostic Player Identity Mapping

- Status: PENDING
- Wiki Category: schema-reference
- Description: The platform's own canonical internal player ID scheme, anchored on Sleeper's `player_id` per existing crosswalk research (`sleeper-api/player-id-crosswalk.md`, `sleeper-api/dst-and-free-agents.md`), with defined join/fallback behavior once ESPN's proprietary player IDs are added as a second provider, including DST and free-agent edge cases.
- Notes: (locked — do not ingest until Notebook 6 completes)

---

### 7.3 League Configuration Data Model

- Status: PENDING
- Wiki Category: schema-reference
- Description: How to normalize each platform's league-settings shape (Sleeper's `settings`/`scoring_settings`/`roster_positions`, and ESPN's equivalent once researched) into one internal `league_config` schema flexible enough for platform-specific quirks without leaking provider-specific structure into the application layer.
- Notes: (locked — do not ingest until Notebook 6 completes)

---

When `wiki/_queue_nb6c.md` reaches COMPLETED, update `wiki/_queue_master.md`: set this file → ACTIVE. Run this notebook as a dedicated decision-making session with Nick, not a solo panel-and-commit loop — see "Why This Notebook Is Different" above before starting.

_End of wiki/_queue_nb7a.md_
