-- Extensible platform enum, never a boolean (Schema Rule #2).
-- A future platform is added via `alter type public.platform add value ...`
-- in a new migration — never by restructuring tables.
create type public.platform as enum ('sleeper', 'espn');
