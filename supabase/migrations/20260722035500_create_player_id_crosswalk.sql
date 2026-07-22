-- Player ID crosswalk keyed on the canonical sleeper_player_id — a mapping
-- layer, not a parallel identity table (Schema Rule #4). Every ID column is
-- text and compared as a string, never numeric — Sleeper D/ST abbreviations
-- and dash-formatted GSIS IDs would be silently corrupted by integer casting.
-- Population/reconciliation pipeline is Wave 2; this is schema only.
create table public.player_id_crosswalk (
  sleeper_player_id text primary key
    references public.players (sleeper_player_id) on delete cascade,
  espn_player_id text,
  gsis_id text,
  yahoo_id text,
  sportradar_id text,
  pfr_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_id_crosswalk enable row level security;

-- Unique only where present — most rows will lack some external mapping.
create unique index player_id_crosswalk_espn_player_id_key
  on public.player_id_crosswalk (espn_player_id)
  where espn_player_id is not null;

create trigger set_updated_at
  before update on public.player_id_crosswalk
  for each row execute function public.set_updated_at();
