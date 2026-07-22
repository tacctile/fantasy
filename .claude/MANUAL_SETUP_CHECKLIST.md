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
- [x] **Have the database password ready for the first `supabase db push`.** Reset 2026-07-21 via Project Settings → Database and saved to Nick's password manager. Handed over 2026-07-21 as `SUPABASE_DB_PASSWORD` in gitignored `.env.local` and used for the first migration push (identity-foundation migrations). Note: the auto-permission classifier blocks Claude-executed DB writes (`supabase db push` and the connector's `apply_migration`) — Nick ran the push himself in a terminal; future migration sessions either repeat that handoff or Nick adds a Bash allow rule for `npx supabase db push`.
- [x] **Create a Vercel project and connect it to `tacctile/fantasy`.** Done 2026-07-21 — project named `fantasy`, connected to GitHub repo `tacctile/fantasy`, Next.js framework preset auto-detected correctly.
- [x] **Paste Supabase secrets into Vercel's environment variables** (Production + Preview). Done 2026-07-21 — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` all added for Production and Preview environments.
- [~] **Decide the admin authentication mechanism.** Confirmed: Supabase Auth, email/password, one user (Nick), no signup flow. Decided 2026-07-21 — email is Nick's real email (nick@prolabelco.com), password chosen by Nick and saved to his password manager. Not yet handed to a build session — the Wave 1 RLS/auth session will ask for both live (value names to request: "fantasy app admin email" / "fantasy app admin password").

## Wave 2 — Data Pipeline

- [ ] **Have at least one real (or throwaway test) Sleeper league ID ready.** No account/auth needed for Sleeper — just the league ID itself, so the sync has something real to pull.
- [ ] **Decide whether an ESPN league is public or private** for each ESPN league you plan to connect (public leagues skip cookie auth entirely — check this before assuming you need cookies).
- [ ] **For any private ESPN league: generate `espn_s2` and `SWID` cookies.** Log into ESPN Fantasy in a browser, open dev tools → cookies, copy both values. Hand back per private league.
- [ ] **Have the real ESPN league ID(s) + season year ready** for any ESPN league you're connecting.
- [ ] **Confirm/generate the Vercel Cron secret token** that protects the cron routes from public invocation (build session can generate this — you just need to confirm it's stored, since it gates a publicly reachable URL).

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

- **2026-07-21 — `.claude/logs/` gitignore negation approved.** The repo-root `.gitignore` line 2 bare `logs` pattern ignored `.claude/logs/`, so session logs never reached GitHub. Nick authorized adding `!.claude/logs/` to `.gitignore`. **Resolved:** verified applied 2026-07-21 — `.gitignore` line 3 contains `!.claude/logs/` and all session logs are git-tracked. No action remains.
- **2026-07-21 — Supabase project is the shared `prolabel` catch-all; fantasy stays in it, with a strict no-touch history policy.** The linked project `tszssadgsxjoymcttlwd` turned out to be Nick's intentional shared multi-app project ("prolabel"): ~49 live tables from other apps (todd chat, elliott pricing, trip planner, loan/valuation), 23 pre-existing migration-history versions, and 2 pre-existing auth users. Nick decided fantasy remains in it (no new project). Consequences, permanent: (1) the 23 foreign history versions are mirrored locally as empty `*_prolabel_shared_history_stub.sql` files so `supabase db push` recognizes remote history without ever writing to it — if new foreign versions appear later, add another stub, never "repair"; (2) `supabase migration repair` and `supabase db reset` are forbidden against this database — repair deletes other apps' shared history rows, reset would destroy their live data; (3) owner-write RLS policies must match Nick's specific `auth.uid()`, never the blanket `authenticated` role, because the auth namespace is shared.

---

_End of .claude/MANUAL_SETUP_CHECKLIST.md_
