-- C-Links: a log of every tap, so the dashboard can show taps for a date
-- range. cards.tap_count stays as the lifetime total (it also holds taps
-- from before this log existed, which have no date).

create table public.taps (
  id         bigint generated always as identity primary key,
  card_id    uuid not null references public.cards (id) on delete cascade,
  tapped_at  timestamptz not null default now()
);

create index taps_tapped_at_card_id_idx on public.taps (tapped_at, card_id);

alter table public.taps enable row level security;

-- Partners can read the log. Rows are written only by tap_card below.
create policy "partners read taps"
  on public.taps
  for select
  to authenticated
  using (true);

-- The public short link calls this: it counts the tap, logs it, and returns
-- the destination, or null when the code does not exist.
create or replace function public.tap_card(card_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  dest text;
  card_uuid uuid;
begin
  update public.cards
     set tap_count = tap_count + 1,
         last_tapped_at = now()
   where code = card_code
  returning destination_url, id into dest, card_uuid;

  if card_uuid is not null then
    insert into public.taps (card_id) values (card_uuid);
  end if;

  return dest;
end;
$$;

-- Taps per card since a date, for the dashboard.
create or replace function public.taps_by_card(since timestamptz)
returns table (card_id uuid, taps bigint)
language sql
stable
as $$
  select t.card_id, count(*)
    from public.taps t
   where t.tapped_at >= since
   group by t.card_id;
$$;

revoke all on function public.taps_by_card(timestamptz) from public;
grant execute on function public.taps_by_card(timestamptz) to authenticated;
