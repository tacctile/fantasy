# BUILD_PROTOCOL.md
**Autonomous per-session build workflow — tacctile/fantasy**
**Parent:** `.claude/MASTER_CONTEXT.md`

> The primary execution mode for building the app against the registered `.claude/build/` files.
> Standard session cadence: one atomic checklist item per session. Nick starts a new session after every item.
>
> Last Updated: 2026-07-21

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
   Claude Code (finds the next unchecked item, clarifies, builds, checks it off)
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
6. Within that build file, find the **first unchecked `[ ]` item, in the order it's listed in the file.** That is this session's entire scope. Nothing else in the file, nothing from a later wave.
7. Read that item's referenced wiki pages (each build file's own `WIKI PAGES TO CONSULT` section, max 3 unless the item genuinely needs more).
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

Once any Manual Setup Flag is cleared (or none applies), ask Nick 3–5 questions **specific to this one checklist item** — never generic, never a restatement of the item itself. Good questions are things the build file could not have predicted at scoping time:

- Values/credentials confirmed as ready in `MANUAL_SETUP_CHECKLIST.md` (e.g. "What's the Supabase project URL now that it's created?")
- Judgment calls the checklist item leaves open (e.g. "The item says 'confirm ESPN league visibility' — do you have the league ID(s) ready, or should I ask you per-league as I reach each one?")
- Anything in `nick_pending` in `STATE.yml` that blocks or informs this specific item
- Naming/config preferences not dictated by `MASTER_CONTEXT.md` (file/table names it doesn't already fix, env var values, etc.)

Do not ask questions the build file, `MASTER_CONTEXT.md`, or the wiki already answer — re-asking settled context wastes Nick's time and is itself a prompt-quality failure (see PROMPT SCORE rubric in `COMPLETION_TEMPLATES.md`). If a genuinely atomic item has zero open questions, say so plainly and proceed straight to building rather than manufacturing filler questions.

Wait for Nick's answers before writing any code.

---

## Build (after clarification)

1. Build **only** the one checklist item identified in step 6 above. Do not pull in adjacent items "while you're in there" — if the work naturally reveals a second item should come next, note it in the completion report's `NEXT LOGICAL TASK` field, don't do it in the same session.
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
8. Commit and push to `main`. Unlike the wiki side (which batches pushes), build-side commits push every session — Nick is executing sequentially and wants GitHub current after each atomic step.

---

## Exit Conditions

- **All items across all six build files are checked and every file's Status is 🟢 Complete:** the v1 roadmap is built. Report this plainly and stop — do not invent new scope.
- **An item is blocked** (`[!]`) on something only Nick can resolve (an account, a credential, a decision): say so in the completion report's `NEXT LOGICAL TASK` and in `nick_pending`, and stop — do not guess past a real blocker.
- **A build file's dependency isn't actually satisfied** (e.g. Wave 2 file is next in order but Wave 1's schema was never actually deployed, only checked off on paper): flag this explicitly rather than proceeding on a false assumption. Verify against the live Supabase project /Vercel deploy, not just checklist marks, when a wave boundary is crossed.

---

## Edge Cases

**`STATE.yml` says a build file is in current focus but every item in it is already checked.** The previous session finished that file without updating `STATE.yml`'s pointer to the next one. Move to the next file in roadmap order and proceed normally — this is a stale-pointer situation, not a blocker.

**Two adjacent unchecked items look like they could be done together in one pass (e.g. two migrations in the same section).** Still one session, one item, one commit — atomicity is the point of this whole system. If they are trivially small, ask Nick directly whether he wants to fold them into a single session; don't decide unilaterally.

**A checklist item references a wiki page that doesn't exist yet.** Note it as a `WIKI NOTE` in the completion report per existing project rules — do not attempt to write wiki content from within a build session (Wiki Protocol in `MASTER_CONTEXT.md` is read-only during feature-build sessions).

**Nick drops this file into a session with no prior context (e.g. a brand-new device or a Claude.ai/web session).** The Session Start Protocol above is self-contained — it only requires reading files already committed to the repo. No prior conversation history is needed.

---

_End of .claude/BUILD_PROTOCOL.md_
