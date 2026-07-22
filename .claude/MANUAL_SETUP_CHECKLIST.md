# MANUAL_SETUP_CHECKLIST.md
**Every manual, human-only step across the entire v1 roadmap — tacctile/fantasy**
**Parent:** `.claude/MASTER_CONTEXT.md`, `.claude/BUILD_PROTOCOL.md`

> Generated 2026-07-21 by walking all six registered build files (`.claude/build/01_foundation.md` through `06_report_and_tools.md`) end to end, extracting every step that requires Nick's hands, browser, account access, or a decision only he can make — as opposed to anything Claude Code can do itself.
>
> Purpose: work through this list in a plain chat (not a build session) so account creation, credential copying, and small decisions don't burn Fable usage on what is really just conversation. Anything checked off here means the *account/credential/decision* exists and is ready to hand to a build session when that wave reaches the item that needs it — it does not mean the wave itself is built.
>
> This list can and will grow small gaps as building actually happens (expected, not a failure) — new manual items surface via the "MANUAL SETUP REQUIRED" flag in `BUILD_PROTOCOL.md`'s Clarify step, and should be appended here when they do.

---

## How to use this

- Nothing on this list blocks *starting* the build (Wave 1 can begin immediately). Items are ordered by when the wave that needs them is expected to run — work top to bottom, but it's fine to get ahead of the build if you want everything ready up front.
- `[ ]` open, `[x]` done, `[>]` deferred until its wave is actually reached (fine to leave ESPN cookies for later, for instance, since real ESPN leagues may not exist yet).
- When an item is done, note the credential/value name (not the secret itself) so a build session knows it's ready to ask for — never paste real secrets into this file.

---

## Wave 1 — Foundation

- [ ] **Create a Supabase account + project.** Decide: org name, project name, region, database password, free vs. paid tier. Hand back to the build session: `SUPABASE_URL`, anon key, service-role key.
- [ ] **Run `supabase login`** when the build session prompts for it — this opens a browser auth flow only you can complete. Confirm which Supabase project to `supabase link` to.
- [ ] **Create a Vercel account + project**, authorize/connect it to the `tacctile/fantasy` GitHub repo. Decide: project name, team (if any).
- [ ] **Paste Supabase secrets into Vercel's environment variables** (Production + Preview) — values come from the Supabase step above.

## Wave 2 — Data Pipeline

- [ ] **Have at least one real (or throwaway test) Sleeper league ID ready.** No account/auth needed for Sleeper — just the league ID itself, so the sync has something real to pull.
- [ ] **Decide whether an ESPN league is public or private** for each ESPN league you plan to connect (public leagues skip cookie auth entirely — check this before assuming you need cookies).
- [ ] **For any private ESPN league: generate `espn_s2` and `SWID` cookies.** Log into ESPN Fantasy in a browser, open dev tools → cookies, copy both values. Hand back per private league.
- [ ] **Have the real ESPN league ID(s) + season year ready** for any ESPN league you're connecting.
- [ ] **Confirm/generate the Vercel Cron secret token** that protects the cron routes from public invocation (build session can generate this — you just need to confirm it's stored, since it gates a publicly reachable URL).

## Wave 3a — Draft Assistant (Static Board)

- [ ] No new accounts/credentials. Just confirm which of your real leagues (from Wave 2) and which ADP source (Sleeper ADP, ingested automatically) should populate the board.

## Wave 3b — Draft Assistant (Live Draft)

- [ ] **Be present to toggle "draft active" on/off** at the real start/end of your actual live draft — this is a real-time action during the draft itself, not something to prepare in advance.
- [ ] **Be ready to make a live judgment call** if ESPN rate-limits or blocks during your real draft (e.g., approve backing off polling frequency) — an in-the-moment decision, nothing to set up now.

## Wave 4 — League Dashboard

- [ ] **Confirm each real league's actual scoring settings** (PPR/half-PPR/TE-premium/superflex, roster slots) match what gets pulled in — a factual check against your real league setup once this wave is live.
- [ ] **Decide when/whether to share the read-only spectator link** with leaguemates once it exists — your call, not a technical step.

## Wave 5 — Eye Candy

- [ ] No new manual/account steps.

## Wave 6 — Report + Tools

- [ ] **Decide when to generate the season report and share the link** with leaguemates — a real-world action once the feature exists.
- [ ] **Personal choice, optional:** custom PWA app icon/branding if you want something other than a default.
- [ ] **Actually install the PWA** ("Add to Home Screen") on your own device(s) once it's built, to use and verify it.

## Cross-cutting — comes up whenever it comes up

- [ ] **Be ready to decide on paid-tier upgrades** if/when Supabase or Vercel free-tier limits are hit (compute, storage, bandwidth, cron invocations) — a billing decision only you can authorize, no need to pre-decide now.

---

## Appending new items mid-build

When a `BUILD_PROTOCOL.md` session flags a "MANUAL SETUP REQUIRED" item that isn't already listed above, add it here under the relevant wave before the build session continues, so this file always stays the single complete picture — not just what was known at the start.

---

_End of .claude/MANUAL_SETUP_CHECKLIST.md_
