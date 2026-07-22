# 01_foundation.md
**Wave 1 — Foundation**
**Status:** 🟡 In progress
**Registered:** 2026-07-21

---

## Scope

Supabase schema (with `league_id`, `platform`, `season_year`, Sleeper-anchored player identity, `league_config`, `share_token` per `MASTER_CONTEXT.md` Schema Rules), env/secrets setup, initial Vercel deploy. Nothing beyond this — no ingestion logic, no ESPN cookie auth flow, no RLS spectator-read policies (those are Wave 4's concern once the spectator surface actually exists). This wave proves the schema is correct and the app deploys; it does not populate real data.

This build file was scoped by convergence-filtering 6 independent AI model responses (chathub-style panel) against the project's actual `BUILD_INDEX.md` Wave 1 bullet, per the same methodology used for `wiki/` discovery ingestion. Full panel responses are not retained here — this file is the synthesized, project-scoped result.

---

## WIKI PAGES TO CONSULT

Read these before starting, per Session-Start Protocol (max 3 unless the task genuinely needs more):

- `wiki/topics/schema-reference/league-identity-and-scoping.md` — `platform_league_uuid` primary-key pattern, `previous_platform_league_uuid` continuity
- `wiki/topics/schema-reference/player-identity-mapping.md` — Sleeper-anchored crosswalk table shape and population order
- `wiki/topics/schema-reference/league-configuration-data-model.md` — `league_config` raw + derived column shape

---

## Checklist

### Project scaffold
- [x] Initialize Next.js (App Router, TypeScript strict, `src/` directory) via `create-next-app`
- [x] Configure `tsconfig.json` so `@/*` resolves to `src/*` — verify with one trivial cross-directory import
- [x] Install and initialize shadcn/ui; configure `components.json` for CSS-variable theming
- [x] Configure `globals.css` with shadcn token set (`--background`, `--foreground`, `--radius`, `--card`, `--border`, etc.) — zero inline hex anywhere
- [x] Install `lucide-react` as the sole icon library
- [x] Confirm Tailwind default spacing scale only (no arbitrary pixel values) and `font-variant-numeric: tabular-nums` available for data displays

### Supabase project + migration workflow
- [x] Create the Supabase project; capture `SUPABASE_URL`, anon key, service-role key — project `tszssadgsxjoymcttlwd` pre-existed per MANUAL_SETUP_CHECKLIST; URL + publishable key pulled via Supabase connector, secret key handed over by Nick; all three captured in gitignored `.env.local`. Standardized on the modern key pair (`sb_publishable_...` as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `sb_secret_...` as `SUPABASE_SECRET_KEY`) rather than legacy anon/service_role JWTs, per Nick's Clarify-step decision
- [x] Install Supabase CLI, `supabase login`, `supabase link` to the project — CLI 2.109.1 as npm dev dependency (version pinned in `package.json`, invoked via `npx supabase`); Nick ran the interactive `supabase login`; linked to `tszssadgsxjoymcttlwd` (db password deliberately skipped at link — needed later at first `supabase db push`, tracked in MANUAL_SETUP_CHECKLIST)
- [x] `supabase init` to establish the local `supabase/migrations/` directory as the canonical schema-change path — `supabase/config.toml` committed; `migrations/` appears with the first migration
- [x] Confirm the baseline-migration rule is understood: never edit the baseline directly, always `supabase migration new` for every subsequent change (this applies from Wave 1 onward, permanently) — confirmed; no migrations exist yet, so the first schema item creates the baseline via `supabase migration new` and every change after that gets its own new migration file

### Schema — platform + identity foundation
- [x] Migration: `platform` Postgres enum type, values `sleeper` and `espn` (extensible enum, never a boolean) — `20260722035454_create_platform_enum.sql`, applied to live DB and verified 2026-07-21
- [x] Migration: `players` table, `sleeper_player_id` (text) as primary key, plus name/position/team/status/metadata columns — this is the Sleeper-anchored canonical identity store, per `schema-reference/player-identity-mapping.md` — `20260722035457_create_players_table.sql`, applied live 2026-07-21; RLS enabled at creation (deny-by-default; auth user + owner-write policies remain the integrity-section item's scope); shared `set_updated_at()` trigger function created here. Corrected same day by `20260722042128_add_players_sleeper_reference_fields.sql` after verification against `sleeper-api/players-endpoint` + `sleeper-api/player-data-quirks`: `fantasy_positions text[]`, `search_rank`, `injury_status`, `search_full_name`, `birth_date` promoted to first-class columns per wiki-assigned roles (relevance-filter quartet; status/injury_status two-field availability rule; last-resort name-match key)
- [x] Migration: `player_id_crosswalk` table keyed on `sleeper_player_id`, with nullable string columns `espn_player_id`, `gsis_id`, `yahoo_id`, `sportradar_id`, `pfr_id` (all stored/compared as strings, never numeric — Sleeper D/ST abbreviations and dash-formatted GSIS IDs would be corrupted by integer casting) — unique constraint on `espn_player_id` where not null. D/ST entities get their own crosswalk row anchored on Sleeper's team-abbreviation-style `player_id` (e.g. `"DET"`), with `espn_player_id` populated from ESPN's separate D/ST `playerId` — never derived from or compared against `proTeamId`. This is a schema-only migration in Wave 1; the population/reconciliation pipeline (Sleeper direct → nflverse/DynastyProcess crosswalk → local ESPN reconciliation pass → last-resort flagged name matching) is Wave 2's concern, per `schema-reference/player-identity-mapping.md`. — `20260722035500_create_player_id_crosswalk.sql`, applied live 2026-07-21; partial unique index on `espn_player_id` where not null, FK → `players` on delete cascade, RLS enabled at creation

### Schema — league + config
- [x] Migration: `leagues` table — `platform_league_uuid` (internally-generated UUID) as primary key, `platform` enum, `season_year`, `native_league_id` (text — Sleeper's `league_id` string or ESPN's `leagueId` integer, stored as-received, never used as a join key), `previous_platform_league_uuid` (nullable self-reference, populated by walking Sleeper's `previous_league_id` chain at ingestion and left null for ESPN), display name, `share_token` (text, unique, not null), owner reference, timestamps. Every other table's `league_id` column in this and later waves is a foreign key to `leagues.platform_league_uuid` — that FK is what "league_id" means everywhere in this project's schema rules and build files. No fixed league-count assumption anywhere in schema or code. Per `schema-reference/league-identity-and-scoping.md`. — `20260722044457_create_leagues_table.sql`, applied live 2026-07-21 (folded with the share_token generation item per Nick's approval). Display name column is `name` (Nick's Clarify decision, matches Sleeper's top-level field); `owner_id uuid` nullable FK → `auth.users(id)` on delete set null, backfilled when the integrity item creates the admin user (Nick's Clarify decision); unique `(platform, native_league_id, season_year)` per the ADR's one-row-per-platform-season-league rule; RLS enabled at creation; `set_updated_at` trigger attached
- [x] Migration: `share_token` generation — Postgres function using `pgcrypto`/`gen_random_bytes` (or equivalent) producing a cryptographically random, unguessable token; trigger or column default so every league row gets one automatically at creation. Must be revocable/regeneratable later (Wave 4 concern for the regenerate UI, but the schema must not prevent it — no immutability constraint on this column beyond not-null+unique). — `20260722044500_create_share_token_generation.sql`, applied live 2026-07-21; `public.generate_share_token()` returns 32 random bytes hex-encoded via `extensions.gen_random_bytes` (pgcrypto v1.3 pre-installed on the shared project — no create extension), set as the column default; verified live: 64-char hex, distinct per call
- [x] Migration: `league_config` table, keyed by `league_id` (FK to `leagues.platform_league_uuid`), storing scoring settings and roster slots as JSONB ("raw" provider-native shape), plus a small derived/normalized subset (PPR value, TE-premium flag, superflex flag, slot counts) — per `schema-reference/league-configuration-data-model.md`. Never hardcode scoring/roster assumptions in application code. — `20260722045532_create_league_config_table.sql`, applied live 2026-07-21. `league_id uuid` doubles as PK (1:1 with leagues; the ADR's "keyed by platform_league_uuid"), FK on delete cascade (Nick's Clarify decision); no `platform`/`season_year` duplication — ADR-exact three-column shape per Nick's Clarify decision, the 1:1 parent leagues row already carries both; `scoring_settings_raw`/`roster_settings_raw`/`derived_config` jsonb all not null (Nick's Clarify decision); timestamps + `set_updated_at` trigger; RLS enabled at creation. Verified live: columns/nullability, PK+FK-cascade, RLS, trigger, migration history row

### Schema — league-scoped state
- [ ] Migration: `rosters` table — `league_id` (FK to `leagues.platform_league_uuid`), `platform`, `season_year`, team/roster identifiers, owner metadata
- [ ] Migration: `roster_players` (or equivalent join) — resolves to `sleeper_player_id`, never a platform-specific player ID directly
- [ ] Migration: `matchups` table — `league_id` (FK to `leagues.platform_league_uuid`), `platform`, `season_year`, week, participant/score fields
- [ ] Migration: `standings` table — `league_id` (FK to `leagues.platform_league_uuid`), `platform`, `season_year`, wins/losses/points-for/points-against
- [ ] Migration: `player_scores` table — composite scoping on `(league_id, sleeper_player_id, season_year, week)` where `league_id` is a FK to `leagues.platform_league_uuid`, since fantasy value is never a single global number (Schema Rule #1)

### Schema — draft state (shared, not staged)
- [ ] Migration: `draft_state` table, keyed by `league_id` (FK to `leagues.platform_league_uuid`) — pick number, round, drafted `sleeper_player_id`, target roster, `source` (`manual` | `sleeper_poll` | `espn_poll`), timestamps, unique constraint on `(league_id, pick_number)` for first-write-wins semantics. Manual click-to-draft (Wave 3b), Sleeper live polling (Wave 2's write path, Wave 3b's live consumption), and ESPN live polling (Wave 3b) all write to this single table — no separate code paths, no staged manual-first/poller-later sequencing. This table only needs to exist correctly in Wave 1; the write logic itself is Wave 2 (Sleeper/ESPN poll paths) and Wave 3b (manual path).

### Schema — integrity
- [ ] Add foreign keys from every league-scoped table back to `leagues.platform_league_uuid`, and from every player-scoped table back to `players.sleeper_player_id`
- [ ] Add indexes on `league_id` (i.e. `leagues.platform_league_uuid` and every FK referencing it), `platform`, `season_year`, `sleeper_player_id`, `share_token`, and the crosswalk's `espn_player_id` column
- [ ] Set up Supabase Auth for Nick as the sole admin user, email/password — create the one auth user, no signup flow, no other users created by this app. (Correction 2026-07-21: the Supabase project is the shared multi-app `prolabel` database, whose auth namespace already contains 2 pre-existing users from another app — the fantasy admin user is created alongside them, and every owner-write policy must match Nick's specific `auth.uid()`, never the blanket `authenticated` role.) Enable Row Level Security on every table created this wave. Write owner-only write policies matching `auth.uid()` against that one user. Do NOT build share_token-based spectator read policies yet — that's Wave 4 scope, once the spectator surface exists to actually use them; Wave 1 only needs RLS *enabled* with owner-write policies so nothing is silently open by default.

### Types + client wiring
- [ ] Generate TypeScript types from the live schema (`supabase gen types typescript`) into a committed types file
- [ ] Create Supabase client utilities: browser client, server client (RSC/route-handler), both typed against the generated schema — named exports, per Code Conventions

### Env, secrets, deploy
- [ ] Create `.env.local` (gitignored) and a committed `.env.example` with placeholders for Supabase URL/anon key/service-role key. ESPN `espn_s2`/`SWID` placeholders included in `.env.example` now even though ESPN auth flow itself is Wave 2 — the env contract should exist before the wave that consumes it.
- [ ] Create Vercel project, link to the repository
- [ ] Configure Supabase secrets in Vercel (Production + Preview environments)
- [ ] Trigger initial Vercel deploy — confirm build succeeds
- [ ] Add a minimal server-side health-check route that performs a trivial authenticated Supabase read, to prove the deployed environment (not just local) can actually reach the database — this is the wave's actual completion gate, not just "build succeeded"

---

## Explicitly NOT in this wave

- ESPN cookie-auth flow / credential storage (Wave 2)
- Any Sleeper or ESPN data ingestion/sync logic (Wave 2)
- Share-token-gated spectator RLS read policies or the spectator route surface itself (Wave 4)
- Manual or automated draft-pick write logic (Wave 3) — only the `draft_state` table shape is created here
- Any UI beyond the default scaffolded shell needed to prove the deploy works

---

## Session-End requirements (per COMPLETION_TEMPLATES.md)

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s inventory sections (they're currently placeholders — this is the wave that first populates them) and `DESIGN_SYSTEM.md`'s token values (currently placeholders — Wave 1 is where real token values get decided against a real UI, per that file's own Status note).
