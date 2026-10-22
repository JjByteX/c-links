-- C-Links: cards and the public tap function.
-- Every signed-in user is a partner. Public sign-ups must be disabled in
-- the Supabase dashboard (Authentication settings), see open-questions #7.

create table public.cards (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique
                  default lower(substr(md5(random()::text || clock_timestamp()::text), 1, 8))
                  check (code ~ '^[a-z0-9]{8}$'),
  label           text not null check (length(trim(label)) > 0),
  destination_url text not null check (destination_url ~* '^https?://'),
  tap_count       integer not null default 0,
  last_tapped_at  timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.cards enable row level security;

-- Partners (signed in) manage cards. The public (anon) cannot read the table.
create policy "partners manage cards"
  on public.cards
  for all
  to authenticated
  using (true)
  with check (true);

-- The public short link calls this: it counts the tap and returns the
-- destination, or null when the code does not exist.
create or replace function public.tap_card(card_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  dest text;
begin
  update public.cards
     set tap_count = tap_count + 1,
         last_tapped_at = now()
   where code = card_code
  returning destination_url into dest;
  return dest;
end;
$$;

revoke all on function public.tap_card(text) from public;
grant execute on function public.tap_card(text) to anon, authenticated;
