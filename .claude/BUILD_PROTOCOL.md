# BUILD_PROTOCOL.md
**Autonomous per-session build workflow — tacctile/fantasy**
**Parent:** `.claude/MASTER_CONTEXT.md`

> The primary execution mode for building the app against the registered `.claude/build/` files.
> Standard session cadence: one folded unit per session, per the Folding Policy below. Nick starts a new session after every folded unit.
>
> Last Updated: 2026-07-22

---

## Mental Model

The build files (`.claude/build/01_foundation.md` through `06_report_and_tools.md`) are a pre-scoped, dependency-ordered execution queue. All the planning work — convergence-filtering 6-model panels per wave, writing atomic checklists — already happened. This protocol exists so a session never has to be told which wave, which item, or what the project even is — it works that out for itself from files already in the repo, the same way `wiki/DISCOVERY_PROTOCOL.md` lets a wiki-maintenance session self-locate in the subject queue.

**The pipeline:**

```
.claude/BUILD_INDEX.md (wave roadmap + registry)
        ↓
.claude/STATE.yml (exactly where the last session left off)
        ↓
.claude/build/NN_*.md (the current wave's atomic checklist)
        ↓
   Claude Code (finds the next unchecked item, declares the fold, clarifies per item, builds, checks off)
        ↓
   commit + push, STATE.yml updated, session ends
```

Nick's job is reduced to: start a session, drop this file in (or just say "read BUILD_PROTOCOL.md and let's go"), answer a handful of pointed clarifying questions, then let it build. When it's done, start a new session and repeat.

---

## Session Start Protocol — Do This First, Every Session

1. Read `.claude/MASTER_CONTEXT.md` — rules, stack, constraints (already required by the project's own Session-Start Protocol)
2. Read `.claude/STATE.yml` — find `current_build_files` and the last-known progress
3. Read `.claude/BUILD_INDEX.md` — confirm the wave roadmap and registry haven't changed since `STATE.yml` was last written
3a. Read `.claude/MANUAL_SETUP_CHECKLIST.md` — know what's already done and what's still open before reaching the Manual Setup Flag check below
4. Read `wiki/index.md` and `wiki/ROUTING.md` — identify the relevant wiki category for the current wave (per existing Session-Start Protocol)
5. Open the build file for the **first wave, in roadmap order (01 → 02 → 03a → 03b → 04 → 05 → 06), that is not fully checked off.** Do not skip ahead even if a later wave's file exists and looks tempting — dependency order is load-bearing (Wave 2 needs Wave 1's schema live, Wave 3b needs Wave 3a + Wave 2's ESPN integration, etc.)
6. Within that build file, find the **first unchecked `[ ]` item, in the order it's listed in the file.** That item anchors this session's scope; the Folding Policy below determines how many immediately following items fold into the same session. Declare the fold in chat before Clarify. Nothing outside the declared fold, nothing from a later wave.
7. Read that item's referenced wiki pages (each build file's own `WIKI PAGES TO CONSULT` section, max 3 unless the item genuinely needs more — and the Wiki Coverage Rule below always overrides any budget for coverage-check reads).
8. Proceed to the Clarify step below.

---

## Manual Setup Flag — check this BEFORE the Clarify step

`.claude/MANUAL_SETUP_CHECKLIST.md` is the standing, exhaustive list of every account/credential/human-only decision across all six waves, pre-walked and written up in advance so Nick can work through it in a plain chat rather than a Fable build session.

Before clarifying or building the current checklist item, check whether it depends on anything in `MANUAL_SETUP_CHECKLIST.md` for this item's wave, and read that item's state precisely — there are three, not two, and treating `[~]` as either extreme is the exact failure mode this section exists to prevent:

- **`[x]` (done):** proceed straight to Clarify below — nothing further needed.
- **`[~]` (ready, awaiting handoff):** the account/project/decision already exists — only the actual credential/value hasn't been handed over yet. Do NOT stop the session. Proceed to Clarify and ask for the specific value as one of the pointed questions (e.g. "the Supabase project already exists — what's the service-role key?"). Update the item to `[x]` once the value is actually used.
- **`[ ]` (open) or missing from the list entirely:** the account/decision itself doesn't exist yet — this is the only state that halts a session. STOP before writing any code. Output a clearly labeled block:

  ```
  MANUAL SETUP REQUIRED before this step can proceed:
  - [exactly what needs to be created/decided]
  - [exactly what value/credential to hand back, and where it plugs in]

  This does not need Claude Code — handle it in a plain chat, then bring the result back here.
  ```

  Then add the item to `MANUAL_SETUP_CHECKLIST.md` under its wave (if it wasn't already listed) and stop the session — do not proceed to Clarify or Build until Nick confirms the manual step is done.

This keeps every "go create an account / go copy a cookie" moment out of the build session entirely, so Nick only spends Fable usage on sessions that are actually building something.

---

## Clarify (3–5 pointed questions, every session)

Once any Manual Setup Flag is cleared (or none applies), ask Nick 3–5 questions **specific to the current checklist item** — never generic, never a restatement of the item itself. In a folded session (see Folding Policy below), Clarify runs per item: each decision-dense item gets its own batch, asked immediately before that item is built — never one compressed mega-batch covering the whole fold upfront. Good questions are things the build file could not have predicted at scoping time:

- Values/credentials confirmed as ready in `MANUAL_SETUP_CHECKLIST.md` (e.g. "What's the Supabase project URL now that it's created?")
- Judgment calls the checklist item leaves open (e.g. "The item says 'confirm ESPN league visibility' — do you have the league ID(s) ready, or should I ask you per-league as I reach each one?")
- Anything in `nick_pending` in `STATE.yml` that blocks or informs this specific item
- Naming/config preferences not dictated by `MASTER_CONTEXT.md` (file/table names it doesn't already fix, env var values, etc.)

Do not ask questions the build file, `MASTER_CONTEXT.md`, or the wiki already answer — re-asking settled context wastes Nick's time and is itself a prompt-quality failure (see PROMPT SCORE rubric in `COMPLETION_TEMPLATES.md`). If a genuinely atomic item has zero open questions, say so plainly and proceed straight to building rather than manufacturing filler questions.

Wait for Nick's answers before writing that item's code.

---

## Wiki Coverage Rule — non-negotiable (added 2026-07-21)

This is a standing constraint, not a suggestion. It is Absolute Rule 12 in `MASTER_CONTEXT.md`; this section is the canonical full text.

**Pre-implementation coverage map — before any code, every build session.** After Clarify and before implementation begins, explicitly enumerate every decision the current checklist item requires (field names, values, shapes, constraints, logic), and for EACH one state which wiki page covers it. Record this map in the session log (summarized in the completion report) BEFORE beginning implementation — never reconstructed retroactively. If any decision has no identified wiki page, search `wiki/ROUTING.md` and `wiki/index.md` for a matching category at that point — not after the code is written.

**The rule.** Before writing any schema, logic, or decision that isn't explicitly and fully specified by an already-read wiki page, you MUST check `wiki/ROUTING.md` and `wiki/index.md` for a more specific category that might cover it — even if it means exceeding the build file's listed pages or the standard page budget. A build file's WIKI PAGES list is a starting point, not a ceiling. If you find yourself inventing a field name, a value, a shape, or any decision not explicitly stated in an already-read wiki page, that is the signal to go find the correct wiki page BEFORE writing code — not after. This applies with no exceptions: not remaining page budget, not session time pressure, not how "obvious" the missing decision seems from general/training knowledge.

**Genuine silence.** Only proceed on general knowledge if a genuine ROUTING.md/index.md search comes up empty — and say so explicitly at decision time (in the session log as the decision is made, and in the completion report), not at the end. Never silently fill a gap with general knowledge and disclose it only in a post-hoc audit.

**Report line.** Every completion report must include the line `WIKI COVERAGE CHECK: [complete / gap found and flagged / gap found and NOT checked before writing code]` (defined in `COMPLETION_TEMPLATES.md`). The third value is a standing failure and must never appear in any report after 2026-07-21.

---

## Folding Policy — what one session builds (canonical text; adopted 2026-07-22)

This policy defines the atomic unit of a build session. It is restated as Absolute Rule 1 in `MASTER_CONTEXT.md` and in `BUILD_INDEX.md`'s Wave Roadmap atomicity line; this section is the canonical full text. It replaces the original one-item-per-session cadence after two capacity audits (2026-07-22, see `.claude/logs/`) found that pace more conservative than necessary inside a sub-section — and actively counterproductive in later waves, where single checklist items (an HTTP client with no consumer, a UI component with no screen) are not independently verifiable on their own.

**The fold unit.** Starting from the first unchecked item, a session folds consecutive checklist items up to whichever of these the section's items actually compose:

- **up to 3 decision-dense items** (items expected to generate Clarify questions), or
- **one full sub-section of mechanical items** (verify/index/config/generate steps), or
- **one independently verifiable artifact's full item set** — a single service, screen region, security surface, or algorithm pipeline whose items cannot be meaningfully verified in isolation (e.g. 03a's six draft-board data-layer items are one query service; a Wave 5 feature's calc service + visualization + states are one feature).

**Fold conditions (all must hold):**

1. Same sub-section, or adjacent sub-sections whose WIKI PAGES footprint is identical. A fold never spans into a new wiki category — needing one mid-session is a hard stop.
2. Folding compresses session overhead only — never per-item artifacts. Every folded item keeps its own: pre-implementation coverage-map rows (item-specific citations; never "same as previous item" where the item has platform- or entity-specific fields), Clarify batch (asked immediately before that item is built), migration/commit granularity where applicable, live/functional verification pass, and build-file checklist annotation.
3. The fold is declared in chat at session start, before Clarify — and never extended mid-session.

**Hard stops — finish the current item and end the session rather than fold past:**

- a boundary requiring a new wiki category
- a `MANUAL_SETUP_CHECKLIST.md` dependency in `[ ]`/missing state (per the Manual Setup Flag section above; `[~]` items don't stop a fold — ask for the value in that item's Clarify batch)
- the first touch of a new external service (e.g. first Vercel deploy, first authenticated ESPN call)
- any live verification failure
- any Clarify answer that contradicts an already-shipped decision (amend-and-stop)

**Live-behavior ceiling.** In sections whose failure modes are timing-dependent rather than visible in a compile or a single manual test (Wave 3b's client-side live sync and active-draft polling orchestration), the cap is 2–3 items regardless of artifact cohesion, so the mandated race/isolation tests get full attention instead of tail compression.

**Named singleton exceptions — always their own session, folded with nothing:**

1. **Wave 2 — ESPN↔Sleeper crosswalk resolution.** Open-ended live-data failure modes; flagged as a potential build blocker since Wave 1.
2. **Wave 2 — first authenticated ESPN call / cookie handling.** Fragile-API discovery plus the credential handoff.
3. **Wave 3b — draft queue + auto-pick.** Live draft-day semantics; local-only auto-pick's interaction with first-write-wins deserves undivided attention. (The section's prior read-only contradiction was resolved 2026-07-22 — see `03b_draft_assistant_live_draft.md`.)
4. **Wave 4 — scoring engine core.** Every displayed number in the app flows through it; the pure function + tests + batch job fold as one unit and share their session with nothing.
5. **Wave 4 — share-token RLS policies + spectator data loader.** The data-exposure boundary, on the shared prolabel DB with owner policies pinned to Nick's specific `auth.uid()`; fold the boundary's items and its boundary tests together, nothing else.

**Quality tripwire (Nick's review signal).** In a folded session's report and log, every item carries item-specific wiki citations (or an explicit declared-silence line) and its own disclosed judgment calls. A later item showing zero of both while earlier items show several is tail compression — the item was pattern-stamped, not reasoned through. Treat it as a policy violation and shrink the next session's fold.

---

## Build (after clarification)

1. Build **only** the items in the fold declared at session start (Folding Policy above), one at a time in checklist order — Clarify → build → verify per item. Do not pull in items beyond the declared fold "while you're in there" — if the work naturally reveals what should come next, note it in the completion report's `NEXT LOGICAL TASK` field; the fold is never extended mid-session.
2. Follow every applicable rule in `MASTER_CONTEXT.md` (Schema Rules, Code Conventions, Design Token Discipline, Data Source Architecture) and the build file's own scope/exclusions.
3. Check the item off (`[ ]` → `[x]`) in the build file. If the item was partially completed or blocked, use `[~]` (in-progress), `[!]` (blocked), or `[>]` (deferred) per the checklist item-state legend in `BUILD_INDEX.md` — never mark `[x]` unless it's genuinely done.
4. If every item in the current build file is now checked, mark that file's `**Status:**` header 🟢 Complete and update its row in `BUILD_INDEX.md`'s Build Files Registry.

---

## Session-End Steps (mandatory, every session)

Follow `MASTER_CONTEXT.md`'s existing Session-End Steps in full:

1. Update `.claude/STATE.yml` completely (overwrite, never patch) — `current_focus` names the wave/item just completed and the next unchecked item; `current_build_files` reflects which build file(s) are actively in play; `nick_pending` reflects anything genuinely blocking the next session.
2. Write the verbose internal log to `.claude/logs/YYYY-MM-DD_NN.md`.
3. Add a `PROGRESS.md` entry only if this session crossed an actual milestone threshold (full checklist completion, first working infra activation, etc.) — most single-item sessions do not qualify.
4. Update `ARCHITECTURE.md` / `DESIGN_SYSTEM.md` if structure or tokens changed.
5. Update the build file's checklist item state (done in the Build step above, but confirm it's committed).
6. Include a `WIKI NOTE:` in the completion report if wiki content appeared missing, outdated, or incorrect.
7. Report using the `feature-build` template from `COMPLETION_TEMPLATES.md` (or `non-code` if the item was governance/config rather than app code).
8. Commit and push to `main`. Unlike the wiki side (which batches pushes), build-side commits push every session — Nick is executing sequentially and wants GitHub current after each session's folded unit.

---

## Exit Conditions

- **All items across all six build files are checked and every file's Status is 🟢 Complete:** the v1 roadmap is built. Report this plainly and stop — do not invent new scope.
- **An item is blocked** (`[!]`) on something only Nick can resolve (an account, a credential, a decision): say so in the completion report's `NEXT LOGICAL TASK` and in `nick_pending`, and stop — do not guess past a real blocker.
- **A build file's dependency isn't actually satisfied** (e.g. Wave 2 file is next in order but Wave 1's schema was never actually deployed, only checked off on paper): flag this explicitly rather than proceeding on a false assumption. Verify against the live Supabase project /Vercel deploy, not just checklist marks, when a wave boundary is crossed.

---

## Edge Cases

**`STATE.yml` says a build file is in current focus but every item in it is already checked.** The previous session finished that file without updating `STATE.yml`'s pointer to the next one. Move to the next file in roadmap order and proceed normally — this is a stale-pointer situation, not a blocker.

**Two adjacent unchecked items look like they could be done together in one pass (e.g. two migrations in the same section).** Apply the Folding Policy above: if they fall inside one fold unit and no hard stop or named singleton intervenes, folding them is the standard cadence — declare the fold at session start. Items beyond the cap wait for the next session. If it's genuinely ambiguous whether the items compose one verifiable artifact, ask Nick rather than deciding unilaterally.

**A checklist item references a wiki page that doesn't exist yet.** Note it as a `WIKI NOTE` in the completion report per existing project rules — do not attempt to write wiki content from within a build session (Wiki Protocol in `MASTER_CONTEXT.md` is read-only during feature-build sessions).

**Nick drops this file into a session with no prior context (e.g. a brand-new device or a Claude.ai/web session).** The Session Start Protocol above is self-contained — it only requires reading files already committed to the repo. No prior conversation history is needed.

---

_End of .claude/BUILD_PROTOCOL.md_
