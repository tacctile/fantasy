# ARCHITECTURE.md
**Satellite context file — detailed directory structure, systems, and APIs**

**Parent:** `.claude/MASTER_CONTEXT.md`

**Last Updated:** 2026-07-22

---

## Status

Wave 1 Project scaffold complete: Next.js app shell exists and builds. Supabase project + migration workflow section complete: project linked, credentials captured, `supabase/` workspace initialized. Schema — platform + identity foundation section complete: `platform` enum, `players`, and `player_id_crosswalk` are live in the database (verified 2026-07-21). Schema — league + config section complete: `leagues`, `generate_share_token()`, and `league_config` are live (verified 2026-07-21). Schema — league-scoped state section complete: `rosters`, `roster_players`, `matchups`, `standings`, and `player_scores` are live (verified 2026-07-22). Schema — draft state section complete: `draft_state` + `draft_pick_source` enum are live (verified 2026-07-22). Schema — integrity section complete (verified 2026-07-22): FK sweep confirmed all 18 FKs shipped at table creation (no migration), 17 integrity indexes live, and the RLS owner-policy layer live — `fantasy_owner_all` on all ten tables, full owner CRUD pinned to the admin `auth.uid()` via `is_fantasy_admin()`; the entire Wave 1 schema block is now built. Types/client wiring and env/deploy sections remain. Remaining inventory sections (Service API Reference, Type Definitions, CI/CD Pipeline, Testing Infrastructure) are populated as Wave 1's later items and subsequent waves actually build things — not fabricated in advance. Update this file at session end whenever structure changes, per `MASTER_CONTEXT.md`'s Session-End Steps.

---

## Source Directory Structure

```
src/
  app/
    layout.tsx      — root layout; registers Geist (--font-sans) + Geist Mono (--font-geist-mono), imports globals.css
    page.tsx        — placeholder shell proving tokens/@-alias/lucide/tabular-nums; replaced by real surfaces in later waves
    globals.css     — Tailwind v4 entry + full shadcn token set (see DESIGN_SYSTEM.md)
    favicon.ico
  components/
    ui/             — shadcn-generated components (button.tsx so far); never hand-edited casually
  lib/
    utils.ts        — cn() class-merge helper (shadcn), named export
public/             — static assets (default scaffold SVGs, replaceable)
```

## Build Configuration

- **Next.js 16.2.11** — App Router, `src/` directory, Turbopack (default), TypeScript strict (`tsconfig.json`: `strict: true`, `isolatedModules: true`)
- **Path alias:** `@/*` → `./src/*` (tsconfig `paths`; verified by real cross-directory import)
- **Tailwind CSS v4** (`@tailwindcss/postcss`) — CSS-first config: no `tailwind.config.*` file; theme lives in `globals.css` via `@theme inline`. Default spacing scale only.
- **shadcn/ui** — CLI 4.x, `components.json`: style `base-nova`, `cssVariables: true`, base color neutral, `iconLibrary: lucide`, aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`
- **ESLint** — flat config (`eslint.config.mjs`), `eslint-config-next`
- **Package manager:** npm (package-lock.json committed). Node 24.x locally.
- **Scripts:** `dev` (turbopack), `build`, `start`, `lint`

---

## Code Conventions

These conventions are declared in `MASTER_CONTEXT.md` and repeated here as the satellite reference. Follow them when adding or editing code; update both locations if either changes (Dual-Location Instruction Rule).

**Imports:**
- Cross-directory imports use the `@/` alias.
- Same-directory and sibling-directory imports use relative paths.
- Never use `@/` to reach a sibling file.
- Never use `../`-walking imports.

**Exports:**
- React components: default exports.
- Services, hooks, stores, utilities, types: named exports.
- Type-only exports: `export type`.

**Barrel exports (`index.ts`):**
- Directory-level public surface, where present.
- Import from the directory, not the file, when an `index.ts` exists.
- Re-export new public symbols from an existing `index.ts` rather than creating a new one.

**TypeScript:** no `any` without explicit justification.

**JSX runtime:** default React JSX runtime (Next.js standard, no custom pragma).

---

## Supabase Infrastructure

- **Project:** `tszssadgsxjoymcttlwd` — `https://tszssadgsxjoymcttlwd.supabase.co` (linked 2026-07-21). **This is Nick's shared multi-app "prolabel" project, not a fantasy-dedicated one** — it hosts live tables and data from several other apps (todd chat, elliott pricing, trip planner, loan/valuation) plus 2 pre-existing auth users. Confirmed intentional by Nick 2026-07-21; see Shared-Database Constraints below and the decision of record in `MANUAL_SETUP_CHECKLIST.md`.
- **CLI:** `supabase@2.109.1` as npm dev dependency — invoked via `npx supabase`, version pinned in `package.json` so all three of Nick's environments resolve the same CLI
- **Local workspace:** `supabase/` (created by `supabase init`) — `config.toml` committed; `supabase/migrations/` is the canonical schema-change path once the first migration exists; `supabase/.temp/` (holds the linked project-ref) is gitignored by Supabase's own `supabase/.gitignore`
- **Link state:** linked to `tszssadgsxjoymcttlwd`; database password handed over 2026-07-21 as `SUPABASE_DB_PASSWORD` in gitignored `.env.local`. Note: a project-level Bash allow rule for `npx supabase db push*` (`.claude/settings.json`, added 2026-07-21 with Nick's approval) lets Claude run migration pushes directly; the CLI reads `SUPABASE_DB_PASSWORD` from the environment (sourced from `.env.local` in-shell, never echoed). The connector's `apply_migration` remains blocked — pushes go through the CLI.
- **API keys:** standardized on the modern key pair — publishable (`sb_publishable_...`) for client-side, secret (`sb_secret_...`) for server-side — not the legacy anon/service_role JWTs. Both validated live against `rest/v1/` (secret key returns 200 with a non-browser client; Supabase actively rejects secret keys sent from browser-like user agents).

## Database Schema (live)

Fantasy-owned objects in the shared `public` schema, all created via `supabase migration new` + push (migration files in `supabase/migrations/`):

- **`platform`** — Postgres enum, values `sleeper` | `espn` (extensible via `alter type ... add value` in a new migration; never a boolean)
- **`players`** — Sleeper-anchored canonical identity store. `sleeper_player_id text` PK (text, never numeric — D/ST rows use team abbreviations like `'DET'`), `full_name`/`first_name`/`last_name`/`position`/`team`/`status`/`injury_status`/`search_full_name` text, `fantasy_positions text[]`, `search_rank integer`, `birth_date date`, `metadata jsonb`, timestamps. All non-PK columns nullable (Sleeper field presence is uneven). `status` and `injury_status` are independent fields that must be read together (see `sleeper-api/player-data-quirks`); no `bye_week` column by design — byes derive from team schedule at read time. RLS enabled; `fantasy_owner_all` owner policy live (see RLS policy layer below)
- **`player_id_crosswalk`** — mapping layer keyed on `sleeper_player_id` (PK, FK → `players` on delete cascade); nullable text columns `espn_player_id`, `gsis_id`, `yahoo_id`, `sportradar_id`, `pfr_id`; partial unique index on `espn_player_id` where not null. RLS enabled; `fantasy_owner_all` owner policy live (see RLS policy layer below). Population pipeline is Wave 2
- **`leagues`** — league identity root. `platform_league_uuid uuid` PK (default `gen_random_uuid()`) — the value every league-scoped table's `league_id` FK points to; never a provider's native ID. `platform` enum, `season_year integer`, `native_league_id text` (stored as-received, re-query/debug only, never a join key), `previous_platform_league_uuid` nullable self-FK on delete set null (Sleeper `previous_league_id` chain resolved at ingestion; always null for ESPN), `name text`, `share_token text` not null unique (default `generate_share_token()`), `owner_id uuid` nullable FK → `auth.users(id)` on delete set null (backfilled when the integrity item creates the admin user), timestamps. Unique `(platform, native_league_id, season_year)` — one row per platform-season-league combination. RLS enabled; `fantasy_owner_all` owner policy live (see RLS policy layer below)
- **`league_config`** — league configuration as data (Schema Rule #5), shape per the `schema-reference/league-configuration-data-model` ADR. `league_id uuid` PK doubling as FK → `leagues.platform_league_uuid` on delete cascade (1:1 extension of the league row — `platform`/`season_year` deliberately not duplicated; the parent row carries both). `scoring_settings_raw jsonb` + `roster_settings_raw jsonb` (provider-native payloads stored as-received: Sleeper `scoring_settings`/`roster_positions`+settings, ESPN scoring payload/`lineupSlotCounts`), `derived_config jsonb` (normalized subset — PPR value, TE-premium flag, superflex flag, active/bench/IR slot counts, league size — computed at ingestion and re-derived on every refresh; derivation is Wave 2), all three not null; timestamps. RLS enabled; `fantasy_owner_all` owner policy live (see RLS policy layer below)
- **`rosters`** — league-scoped team identity. Composite PK `(league_id, native_roster_id)` — the wiki-decided identity pair; `league_id uuid` FK → `leagues.platform_league_uuid` on delete cascade; `native_roster_id integer` as-received (Sleeper `roster_id` / ESPN `teamId`, both wire integers); `platform` enum + `season_year integer` (Schema Rules #2/#3 — duplicated here, unlike league_config, because rosters is N:1 with leagues); `owner_native_id text` nullable (Sleeper `owner_id` / ESPN `primaryOwner` — orphaned rosters are a normal state, ownership never part of the key), `co_owner_native_ids text[]` not null default `'{}'` (full co-owner list, primary never by array position); nullable `team_name`/`owner_display_name` display columns (mutable attributes, never join keys; populated by Wave 2 sync); timestamps. No standings figures or player arrays — those belong to the standings and roster_players tables. RLS enabled; `fantasy_owner_all` owner policy live (see RLS policy layer below)
- **`roster_slot`** — Postgres enum, values `starter` | `bench` | `reserve` | `taxi` — the normalized cross-platform roster role, resolved once at Wave 2 ingestion (Sleeper bench = three-way subtraction of `players` minus `starters`/`reserve`/`taxi`; ESPN `lineupSlotId` 20→bench, 21→reserve, active slots→starter; `taxi` is Sleeper-only)
- **`roster_players`** — roster membership join, one row per rostered player per team. Composite PK `(league_id, native_roster_id, sleeper_player_id)`; `league_id uuid` FK → `leagues.platform_league_uuid`, composite FK `(league_id, native_roster_id)` → `rosters`, `sleeper_player_id text` FK → `players` — all on delete cascade. Always keyed by `sleeper_player_id` (canonical identity; ESPN `playerId` resolves through `player_id_crosswalk` at ingestion; D/ST rows carry team-abbreviation IDs). `platform` enum + `season_year integer` (N:1 with leagues, rosters precedent); `slot roster_slot` not null; nullable native detail `starter_slot_index integer` (Sleeper starters[] order, meaningful only against league_config's slot layout — check-constrained to sleeper starters) and `espn_lineup_slot_id integer` (raw as-received — check-constrained to espn); `unique (league_id, sleeper_player_id)` so one player on two rosters in a league fails loudly at sync. Current-snapshot semantics — no `week` column; historical lineups belong to matchups. No acquisition metadata by decision (no registered v1 consumer). RLS enabled; `fantasy_owner_all` owner policy live (see RLS policy layer below)
- **`matchups`** — weekly matchup participant rows, one row per roster per week (Sleeper's native response grain; ESPN schedule entries split into two rows per side at ingestion). Composite PK `(league_id, week, native_roster_id)`; `league_id uuid` FK → `leagues.platform_league_uuid` + composite FK `(league_id, native_roster_id)` → `rosters`, both on delete cascade; `platform` enum + `season_year integer` (N:1 duplication precedent). Dual period columns per the espn-api matchup ADR — never collapsed: `week integer` (NFL stat-accumulation interval: Sleeper week / ESPN `scoringPeriodId`) and `matchup_period integer` (fantasy contest interval: ESPN `matchupPeriodId`; check-enforced `= week` on Sleeper rows, which have no native contest-interval ID — a multi-week ESPN playoff round shares one `matchup_period` across its weeks). `native_matchup_id integer` nullable — weekly pairing key as-received (Sleeper `matchup_id` / ESPN schedule entry id, both wire integers); null = bye; pairings are reconstructed by grouping on `(league_id, week, native_matchup_id)` with group-size validation, never forced into home/away pairs. `is_home boolean` nullable (ESPN-only, check-constrained). Scores: `points numeric` nullable (platform-computed weekly total as-received), `custom_points numeric` (Sleeper-only commissioner override, check-constrained), stored generated `effective_points = coalesce(custom_points, points)` — the wiki precedence rule realized once in schema. Finality: `fetched_at timestamptz` nullable + `is_final boolean not null default false` — neither platform signals finality; Wave 2+ sync stamps reads and promotes per our own policy (games complete + correction window + stable repeat reads). No ESPN live/projected columns yet (exact field names are an open wiki question — added by a Wave 2 migration once verified live). RLS enabled; `fantasy_owner_all` owner policy live (see RLS policy layer below)
- **`standings`** — season-cumulative standings, current snapshot only (Wave 2 sync overwrites in place; no weekly history — v1 rejects season-over-season views, and per-week points live on matchups). Composite PK `(league_id, native_roster_id)` mirroring rosters; `league_id uuid` FK → `leagues.platform_league_uuid` + composite FK `(league_id, native_roster_id)` → `rosters`, both on delete cascade; `platform` enum + `season_year integer` (N:1 duplication precedent). `wins`/`losses`/`ties` integer + `points_for`/`points_against` numeric — all not null default 0 (a fresh league genuinely is 0-0 with 0.00 points; zero is a true state, not missing data). Points columns hold the single recombined decimal (Sleeper's split `fpts`/`fpts_decimal` pair recombined at ingestion per the roster-endpoint ADR — the wire pair is never stored); ESPN totals land as-received from the mTeam view. ESPN rank/playoff-seed and Sleeper waiver/transaction counters excluded by decision (no registered v1 consumer; ESPN's exact record field names are an open wiki question — Wave 2 adds them via new migration once verified live). No `fetched_at` — standings have no finality concept. RLS enabled; `fantasy_owner_all` owner policy live (see RLS policy layer below)
- **`player_scores`** — per-player weekly fantasy scores, one row per rostered player per league row per week (a player's fantasy value is always `(player, league)` — Schema Rule #1). PK `(league_id, sleeper_player_id, week)` with `season_year` duplicated as a non-PK column (a leagues row is already per-season); `league_id uuid` FK → `leagues.platform_league_uuid`, `sleeper_player_id text` FK → `players`, composite FK `(league_id, native_roster_id)` → `rosters` — all on delete cascade; `platform` enum (N:1 duplication precedent). `week` is the NFL stat-accumulation interval (Sleeper week / ESPN `scoringPeriodId`) — contest-interval grouping stays on matchups. Sources: Sleeper matchup endpoint's `players_points` map (league-scored by Sleeper, never the generic `pts_std`/`pts_ppr` presets); ESPN player stat records selected at ingestion by all three discriminators (`scoringPeriodId` + `statSourceId` + `statSplitTypeId`) so projections/season splits are never mistaken for weekly actuals. Full per-week attribution: `native_roster_id integer` not null (every row is inherently a rostered player — free-agent scores never appear in these payloads; this is the only historical per-week attribution record, since roster_players is current-snapshot and mRoster can't reconstruct past weeks) + `was_starter boolean` not null (Sleeper starters[] membership / ESPN lineupSlotId within the league's active slot set per league_config). `points numeric` not null — as-received, zero is as-received, negatives legitimate; ESPN projected/live columns excluded by decision (field names are an open wiki question — Wave 2 adds them via new migration once verified live). Finality mirrors matchups: `fetched_at timestamptz` nullable + `is_final boolean not null default false`, promoted only by our own sync policy. RLS enabled; `fantasy_owner_all` owner policy live (see RLS policy layer below)
- **`draft_pick_source`** — Postgres enum, values `manual` | `sleeper_poll` | `espn_poll` — which write path recorded a draft pick (app-internal provenance, not a wire value)
- **`draft_state`** — shared draft-pick log, one row per completed pick per league row. All three write paths (manual click-to-draft, Sleeper polling, ESPN polling) write to this one table. PK `(league_id, pick_number)` — the first-write-wins guarantee itself: first writer of a pick number wins, later writers conflict; rows are immutable under that semantic, so there is no `fetched_at`/`is_final` machinery. `league_id uuid` FK → `leagues.platform_league_uuid`, `sleeper_player_id text` FK → `players` (ESPN `playerId` resolves through `player_id_crosswalk` at ingestion), composite FK `(league_id, native_roster_id)` → `rosters` — all on delete cascade. `pick_number`/`round` integer as-received (Sleeper `pick_no`/`round`, ESPN `overallPickNumber`/`roundId` — never reconstructed from snake-order arithmetic; reversal rounds, keepers, traded picks, and commissioner edits all break the formula silently). `native_roster_id integer` not null — Sleeper `roster_id` (the ownership field — never `draft_slot`/`picked_by`) / ESPN `teamId`; the manual path always selects the receiving team. `source draft_pick_source` not null, check-constrained so poll sources match their platform (`source_matches_platform`). `platform` enum + `season_year integer` (N:1 duplication precedent). `native_draft_id text` nullable, sleeper-only check — Sleeper `draft_id` provenance as-received (drafts arrays carry never-deleted aborted/restarted drafts; the Wave 2 poller records its season/type/status selection here); null for ESPN and manual picks. `amount numeric` nullable — auction winning bid (Sleeper `metadata.amount` string coerced at ingestion / ESPN `bidAmount`; the only meaningful value signal in auctions, where pick order is nomination order); null for snake/linear picks. Snake/linear + auction formats only — dynasty multi-draft seasons are out of scope by decision, one draft per league row assumed. `is_keeper`/`draft_slot`/`picked_by` excluded by decision (no registered v1 consumer). Write logic is Wave 2 (poll paths) + Wave 3b (manual). RLS enabled; `fantasy_owner_all` owner policy live (see RLS policy layer below)
- **`generate_share_token()`** — returns 32 random bytes hex-encoded (64 chars, 256 bits) via `extensions.gen_random_bytes` (pgcrypto, pre-installed on the shared project); `search_path = ''`. Default on `leagues.share_token`; revocation/regeneration is a plain UPDATE — no immutability constraint
- **`set_updated_at()`** — shared trigger function (`search_path = ''`), `before update` trigger on all ten tables
- **`is_fantasy_admin()`** — stable, `search_path = ''`; true iff `auth.uid()` equals the fantasy admin's UUID (`1d5dab52-9b93-4544-a99b-6d4dc3c84a66` — the pre-existing prolabel auth user nick@prolabelco.com, created 2026-05-15 and reused as fantasy admin by Nick's 2026-07-22 ruling; a duplicate email cannot exist in the shared namespace). The single rotation point for admin identity — every fantasy policy calls it
- **RLS policy layer** — one `fantasy_owner_all` policy per fantasy table (all ten): `FOR ALL TO authenticated`, `using`/`with check` = `(select public.is_fantasy_admin())` (InitPlan-wrapped, evaluated once per statement). Full owner CRUD pinned to Nick's specific `auth.uid()` — never the blanket `authenticated` role (Shared-Database Constraints). Everything else is deny-by-default; verified live: the other prolabel user and `anon` both rejected (42501). No spectator policies yet — share-token READ policies are Wave 4 scope
- **Integrity indexes** — 17 single-column `idx_*` indexes: `leagues.previous_platform_league_uuid` (the one unindexed FK → `platform_league_uuid`), `sleeper_player_id` on `roster_players`/`player_scores`/`draft_state`, and `platform` + `season_year` on the six N:1 tables plus `season_year` on `leagues`. No duplicate index anywhere a PK/unique btree already leads with the column (Postgres prefix rule); `leagues.owner_id` deliberately unindexed (outside the item's list, trivial table)

## Shared-Database Constraints (prolabel)

The database is shared with other live apps. Standing rules for every future session:

- **Never run `supabase db reset`** against the linked project — it would destroy other apps' live data.
- **Never run `supabase migration repair`** — it edits the shared `supabase_migrations.schema_migrations` ledger and would erase other apps' history rows.
- The 23 pre-existing foreign history versions are mirrored as empty `*_prolabel_shared_history_stub.sql` files in `supabase/migrations/` so `db push` recognizes remote history without writing to it. If a future push refuses because new foreign versions appeared remotely, add another empty stub for each — never repair.
- Fantasy table names must not collide with existing prolabel tables; check `list_tables` before naming a genuinely new table family.
- Owner-write RLS policies must match Nick's specific `auth.uid()`, never the blanket `authenticated` role — the auth namespace contains other apps' users.

## Environment Variables

Live values in gitignored `.env.local`; the committed `.env.example` contract is a later Wave 1 checklist item (not yet created).

| Variable | Exposure | Purpose |
| -------- | -------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | modern publishable key (replaces legacy anon JWT) |
| `SUPABASE_SECRET_KEY` | server only — never `NEXT_PUBLIC_` | modern secret key (replaces legacy service_role JWT) |
| `SUPABASE_DB_PASSWORD` | CLI only — never shipped | database password for `supabase db push` (read by the Supabase CLI) |

## Supabase Migration Rule

Never edit the baseline migration. All schema changes go through `supabase migration new`. This is a hard operational constraint, not a style preference — applies from Wave 1 onward.

---

_End of ARCHITECTURE.md_
