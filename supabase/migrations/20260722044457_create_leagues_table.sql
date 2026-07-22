-- League identity root (Schema Rules #1/#2/#3/#6). Every league-scoped table's
-- league_id in this and later waves is a FK to platform_league_uuid — an
-- internally-generated UUID, never a provider's native ID: Sleeper mints a new
-- league_id every season (chained via previous_league_id) while ESPN keeps one
-- stable leagueId across seasons, so no native-ID-as-PK convention fits both.
-- One row per platform-season-league combination. native_league_id is stored
-- as-received for re-querying the source API and debugging only — never a
-- join key.
create table public.leagues (
  platform_league_uuid uuid primary key default gen_random_uuid(),
  platform public.platform not null,
  season_year integer not null,
  native_league_id text not null,
  -- Populated by walking Sleeper's previous_league_id chain at ingestion and
  -- resolving each hop to its platform_league_uuid; always null for ESPN
  -- (season continuity is implicit in its single stable leagueId). The chain
  -- can be genuinely absent — a manually recreated league severs it.
  previous_platform_league_uuid uuid
    references public.leagues (platform_league_uuid) on delete set null,
  name text not null,
  share_token text not null unique,
  -- Nullable until the fantasy admin auth user exists (Schema — integrity
  -- item). Shared prolabel auth namespace: policies must match Nick's
  -- specific auth.uid(), never the blanket authenticated role.
  owner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, native_league_id, season_year)
);

alter table public.leagues enable row level security;

create trigger set_updated_at
  before update on public.leagues
  for each row execute function public.set_updated_at();
