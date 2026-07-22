-- Cryptographically random, unguessable spectator-link token (Schema Rule #6):
-- 32 random bytes hex-encoded (256 bits, URL-safe). Possession of the link is
-- the access control. Revocation/regeneration is a plain UPDATE to a fresh
-- token — no immutability constraint beyond not-null + unique. pgcrypto is
-- already installed in the extensions schema on this shared project, so no
-- create extension here.
create function public.generate_share_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select encode(extensions.gen_random_bytes(32), 'hex');
$$;

alter table public.leagues
  alter column share_token set default public.generate_share_token();
