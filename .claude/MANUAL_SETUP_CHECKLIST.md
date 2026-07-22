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
- Three states, not two — this distinction matters and a build session must treat them differently:
  - `[ ]` **open** — the account/decision itself doesn't exist yet. A build session hitting this MUST stop and flag it per `BUILD_PROTOCOL.md`'s Manual Setup Flag.
  - `[~]` **ready, awaiting handoff** — the account/project/decision already exists, but the actual credential/value hasn't been pasted into a build session yet. A build session hitting this should NOT stop — it asks for the value as one of its Clarify-step questions and proceeds once given.
  - `[x]` **done** — the value has actually been handed to and used by a build session (or there's nothing left to hand off).
- When an item reaches `[~]` or `[x]`, note the credential/value name (not the secret itself) so a build session knows what to ask for — never paste real secrets into this file.

---

## Wave 1 — Foundation

- [x] **Supabase account + project already exist** (https://supabase.com/dashboard/project/tszssadgsxjoymcttlwd). Handed over 2026-07-21: `SUPABASE_URL` + publishable key pulled via the Supabase connector, secret key pasted by Nick — all captured in gitignored `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`).
- [x] **Run `supabase login`** — done 2026-07-21; project `tszssadgsxjoymcttlwd` is what got `supabase link`ed (verified via `supabase/.temp/project-ref`).
- [x] **Have the database password ready for the first `supabase db push`.** Reset 2026-07-21 via Project Settings → Database and saved to Nick's password manager. Handed over 2026-07-21 as `SUPABASE_DB_PASSWORD` in gitignored `.env.local` and used for the first migration push (identity-foundation migrations). Note: the auto-permission classifier initially blocked Claude-executed DB writes, so the first push was run by Nick in a terminal. Resolved 2026-07-21: Nick approved a project-level Bash allow rule for `npx supabase db push*` (committed in `.claude/settings.json`) — Claude now runs migration pushes directly (verified live with the leagues/share_token push); no per-session handoff needed.
- [x] **Create a Vercel project and connect it to `tacctile/fantasy`.** Done 2026-07-21 — project named `fantasy`, connected to GitHub repo `tacctile/fantasy`, Next.js framework preset auto-detected correctly.
- [x] **Paste Supabase secrets into Vercel's environment variables** (Production + Preview). Done 2026-07-21 — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` all added for Production and Preview environments.
- [x] **Decide the admin authentication mechanism.** Confirmed: Supabase Auth, email/password, one user (Nick), no signup flow. Decided 2026-07-21 — email is Nick's real email (nick@prolabelco.com). Resolved 2026-07-22 by the Wave 1 integrity session: an auth user with that email already existed in the shared prolabel namespace (created 2026-05-15, one of the 2 pre-existing users — a duplicate email cannot be created), and Nick ruled to reuse it as the fantasy admin. No password handoff was needed — the RLS policies pin to the user's UUID (`1d5dab52-9b93-4544-a99b-6d4dc3c84a66`) via `public.is_fantasy_admin()`. The password for that account is whatever Nick has saved for it; if forgotten, reset via dashboard before the first real sign-in (the env/deploy health-check item or the first owner UI).

## Wave 2 — Data Pipeline

- [x] **Have at least one real (or throwaway test) Sleeper league ID ready.** No account/auth needed for Sleeper — just the league ID itself, so the sync has something real to pull. Handed over and used live 2026-07-22: `1257464256710856704` ("10 enter 1 Leaves" — Nick's season-2025, status-complete league; fully ingested). Note: Sleeper mints a new league ID per season renewal — when the 2026 renewal exists, connect it by running the same sync runners with the new ID (no new manual setup needed).
> **⛔ The three ESPN items below are BLOCKED on external timing, not on Nick (recorded 2026-07-22).** The 2026 season hasn't opened — ESPN leagues are commissioner-locked until season setup, so visibility can't be checked and league IDs/cookies can't be gathered for leagues that don't yet exist in an accessible state. Expected to clear ~2026-08-19 → 2026-09-02 (Nick's 4–6-week estimate from 2026-07-22); re-check mid-August. Until then: never guess visibility, never fabricate placeholder ESPN league IDs (Nick's explicit instruction — this waits on real data from real leagues). The ESPN sub-sections in `02_data_pipeline.md` are marked `[!]` blocked (Nick-signed, 2026-07-22), so build sessions self-locate past them to the first non-ESPN `[ ]` item — the cron/polling sub-section — then Wave 3a, which `BUILD_INDEX.md`'s dependency notes already declare ESPN-independent.

- [ ] **Decide whether an ESPN league is public or private** for each ESPN league you plan to connect (public leagues skip cookie auth entirely — check this before assuming you need cookies). — *blocked on external timing, see note above*
- [ ] **For any private ESPN league: generate `espn_s2` and `SWID` cookies.** Log into ESPN Fantasy in a browser, open dev tools → cookies, copy both values. Hand back per private league. — *blocked on external timing, see note above*
- [ ] **Have the real ESPN league ID(s) + season year ready** for any ESPN league you're connecting. — *blocked on external timing, see note above*
- [x] **Confirm/generate the Vercel Cron secret token** that protects the cron routes from public invocation (build session can generate this — you just need to confirm it's stored, since it gates a publicly reachable URL). — *Done 2026-07-22: the cron-sub-section build session generated the 64-hex `CRON_SECRET`, stored it in gitignored `.env.local`, documented the contract in `.env.example`, and Nick pasted it into Vercel (Production only, his Clarify choice). Confirmed in use live: deployed cron routes reject without it (401) and ran real syncs with it (200).*

## Wave 3a — Draft Assistant (Static Board)

- [ ] **Confirm the real ADP source before ADP ingestion is built.** No Sleeper API wiki page documents a public ADP endpoint — verify one actually exists before the build session writes ingestion against it; if not, decide a real alternative source (e.g. FantasyPros) and obtain any API key it requires.
- [ ] Confirm which of your real leagues (from Wave 2) should populate the board.

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

## Decisions of record (non-checklist)

- **2026-07-22 — Vercel stays on Hobby for now; cron cadence is daily until season start (Nick).** Vercel Hobby caps cron jobs at 2 per project, once daily each — the build file's 15-minute league-state cadence requires Pro (~$20/mo). Nick's Clarify decision: stay on Hobby with daily crons (player catalog 09:00 UTC, league-state 10:00 UTC) through the offseason, and revisit at season start — the same window the ESPN block clears — choosing then between a Pro upgrade or an alternative trigger. The cron-schedule item in `02_data_pipeline.md` stays `[~]` with a dated note until the sub-daily cadence ships. Related: scheduled league-state runs sync only the current NFL week's matchups (per `/state/nfl`; offseason runs skip matchups entirely), and the draft fast path is an authenticated route with no schedule entry until Wave 3b — both also Nick's Clarify decisions this session.
- **2026-07-22 — Wave 2 ESPN work blocked on external timing; build path re-routed around it (Nick).** All three Wave 2 ESPN manual items are unresolvable until ESPN leagues open for the 2026 season — commissioners have them locked down until season setup, expected ~2026-08-19 → 2026-09-02 (Nick's 4–6-week estimate from 2026-07-22). Nick's explicit instructions: record the dated blocker; never guess league visibility or fabricate placeholder ESPN league IDs to keep moving — ESPN work waits on real data from real leagues. In the meantime the build proceeds in existing file order through the ESPN-independent remainder: `02_data_pipeline.md`'s cron/polling sub-section (its routes wire the already-complete Sleeper orchestrator; ESPN sync joins the same path when unblocked), then Wave 3a, which `BUILD_INDEX.md` already declares needs only Wave 1 + Wave 2's Sleeper sync — gated solely on Wave 3a's own manual items (ADP source; which leagues populate the board), which are plain-chat-resolvable now, not season-gated. Wave 3b remains genuinely ESPN-blocked. The 9 ESPN items in `02_data_pipeline.md` stay `[!]` until the manual items clear; flip them back to `[ ]` at that point so build sessions self-locate onto them again.
- **2026-07-21 — `.claude/logs/` gitignore negation approved.** The repo-root `.gitignore` line 2 bare `logs` pattern ignored `.claude/logs/`, so session logs never reached GitHub. Nick authorized adding `!.claude/logs/` to `.gitignore`. **Resolved:** verified applied 2026-07-21 — `.gitignore` line 3 contains `!.claude/logs/` and all session logs are git-tracked. No action remains.
- **2026-07-22 — Fantasy admin identity is the pre-existing prolabel auth user.** The Wave 1 integrity session discovered nick@prolabelco.com already existed as an auth user in the shared namespace (created 2026-05-15). Nick ruled: reuse it as the fantasy admin rather than minting a second account under a different email. All fantasy owner policies pin to its `auth.uid()` through `public.is_fantasy_admin()` — rotating the admin later is a one-line change to that function. Consequence to know: any session authenticated as this user (including from Nick's other prolabel apps) carries fantasy owner rights — accepted as consistent with the shared-project decision below.
- **2026-07-21 — Supabase project is the shared `prolabel` catch-all; fantasy stays in it, with a strict no-touch history policy.** The linked project `tszssadgsxjoymcttlwd` turned out to be Nick's intentional shared multi-app project ("prolabel"): ~49 live tables from other apps (todd chat, elliott pricing, trip planner, loan/valuation), 23 pre-existing migration-history versions, and 2 pre-existing auth users. Nick decided fantasy remains in it (no new project). Consequences, permanent: (1) the 23 foreign history versions are mirrored locally as empty `*_prolabel_shared_history_stub.sql` files so `supabase db push` recognizes remote history without ever writing to it — if new foreign versions appear later, add another stub, never "repair"; (2) `supabase migration repair` and `supabase db reset` are forbidden against this database — repair deletes other apps' shared history rows, reset would destroy their live data; (3) owner-write RLS policies must match Nick's specific `auth.uid()`, never the blanket `authenticated` role, because the auth namespace is shared.

---

_End of .claude/MANUAL_SETUP_CHECKLIST.md_
