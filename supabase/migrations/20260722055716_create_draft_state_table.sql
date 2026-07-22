-- Shared draft-pick log (Schema Rules #1/#2/#3/#4). One row per completed
-- pick per league row. Manual click-to-draft (Wave 3b), Sleeper live
-- polling (Wave 2's write path), and ESPN live polling (Wave 3b) all
-- write to this one table — no separate code paths, no staged
-- manual-first/poller-later sequencing. The primary key IS the
-- first-write-wins guarantee: the first writer of a (league_id,
-- pick_number) row wins and later writers conflict. Rows are immutable
-- under that semantic, so there is no fetched_at/is_final
-- correction-window machinery here (unlike matchups/player_scores —
-- a recorded pick is never re-fetched into a different value).
-- Snake/linear and auction formats only; dynasty multi-draft seasons are
-- explicitly out of scope, so one draft per league row is assumed.

-- Which write path recorded the pick. App-internal provenance, not a
-- wire value.
create type public.draft_pick_source as enum ('manual', 'sleeper_poll', 'espn_poll');

create table public.draft_state (
  league_id uuid not null
    references public.leagues (platform_league_uuid) on delete cascade,
  -- Overall 1-indexed pick number: Sleeper pick_no / ESPN
  -- overallPickNumber, as-received — never reconstructed from
  -- snake-order arithmetic (reversal rounds, keepers, traded picks, and
  -- commissioner edits all break the naive formula silently).
  pick_number integer not null,
  -- Sleeper round / ESPN roundId, as-received (same ground-truth rule).
  -- In auction drafts this reflects nomination order, not value.
  round integer not null,
  -- Drafted player, always the canonical Sleeper ID (Schema Rule #4).
  -- ESPN playerId resolves through player_id_crosswalk at ingestion.
  sleeper_player_id text not null
    references public.players (sleeper_player_id) on delete cascade,
  -- The roster that receives the player: Sleeper roster_id — the
  -- ownership field, never draft_slot (original board column, wrong for
  -- traded picks) or picked_by (the clicking human, wrong for
  -- commissioner/autopicks) — / ESPN teamId. The manual path always
  -- selects the receiving team.
  native_roster_id integer not null,
  source public.draft_pick_source not null,
  platform public.platform not null,
  season_year integer not null,
  -- Which platform draft produced the pick: Sleeper draft_id as-received
  -- (a league's drafts array can carry aborted/restarted drafts that are
  -- never deleted — Wave 2's poller selects by season/type/status, and
  -- this records its choice). Null for ESPN (mDraftDetail has no
  -- distinct draft ID) and for manual picks.
  native_draft_id text,
  -- Auction winning bid: Sleeper metadata.amount (a string on the wire,
  -- coerced at ingestion) / ESPN bidAmount. Null for snake/linear picks.
  -- In auctions this is the only meaningful value signal — pick_number
  -- and round carry nomination order there.
  amount numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- The build item's first-write-wins unique constraint, serving as the
  -- natural PK per rosters/matchups/player_scores precedent.
  primary key (league_id, pick_number),
  foreign key (league_id, native_roster_id)
    references public.rosters (league_id, native_roster_id) on delete cascade,
  constraint native_draft_id_sleeper_only
    check (native_draft_id is null or platform = 'sleeper'),
  constraint source_matches_platform
    check (
      source = 'manual'
      or (source = 'sleeper_poll' and platform = 'sleeper')
      or (source = 'espn_poll' and platform = 'espn')
    )
);

alter table public.draft_state enable row level security;

create trigger set_updated_at
  before update on public.draft_state
  for each row execute function public.set_updated_at();
