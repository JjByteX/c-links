-- C-Links: dated stock log.
-- Replaces the single stock number with a log of cards received. In stock is
-- now cards received minus cards bought, so every change has a date.
-- The old stock figure becomes the first entry (the opening count).

create table public.stock_log (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('opening', 'restock', 'correction')),
  quantity    integer not null check (quantity <> 0),
  created_at  timestamptz not null default now()
);

alter table public.stock_log enable row level security;

-- Partners can read and add entries. Entries are never edited or deleted.
create policy "partners read stock log"
  on public.stock_log
  for select
  to authenticated
  using (true);

create policy "partners add to stock log"
  on public.stock_log
  for insert
  to authenticated
  with check (true);

-- Opening count: what is in stock now plus everything already bought, dated
-- just before the first purchase.
insert into public.stock_log (kind, quantity, created_at)
select 'opening',
       s.quantity + coalesce((select sum(quantity) from public.purchases), 0),
       coalesce((select min(created_at) from public.purchases), now())
         - interval '1 second'
  from public.stock s
 where s.quantity + coalesce((select sum(quantity) from public.purchases), 0) > 0;

drop table public.stock;

-- Adds cards to the stock (positive) or corrects the count (negative).
-- Fails, changing nothing, if the stock would go below zero.
create or replace function public.record_stock_change(qty integer)
returns void
language plpgsql
as $$
declare
  on_hand bigint;
begin
  if qty = 0 then
    raise exception 'Enter a number other than 0';
  end if;

  perform pg_advisory_xact_lock(hashtext('c-links-stock'));

  on_hand := coalesce((select sum(quantity) from public.stock_log), 0)
           - coalesce((select sum(quantity) from public.purchases), 0);

  if on_hand + qty < 0 then
    raise exception 'Only % in stock', on_hand;
  end if;

  insert into public.stock_log (kind, quantity)
  values (case when qty > 0 then 'restock' else 'correction' end, qty);
end;
$$;

revoke all on function public.record_stock_change(integer) from public;
grant execute on function public.record_stock_change(integer) to authenticated;

-- Logs the purchase. Fails, changing nothing, when there are fewer cards in
-- stock than the customer bought.
create or replace function public.record_purchase(customer text, qty integer)
returns void
language plpgsql
as $$
declare
  on_hand bigint;
begin
  perform pg_advisory_xact_lock(hashtext('c-links-stock'));

  on_hand := coalesce((select sum(quantity) from public.stock_log), 0)
           - coalesce((select sum(quantity) from public.purchases), 0);

  if qty > on_hand then
    raise exception 'Only % in stock', on_hand;
  end if;

  insert into public.purchases (customer_name, quantity)
  values (customer, qty);
end;
$$;

revoke all on function public.record_purchase(text, integer) from public;
grant execute on function public.record_purchase(text, integer) to authenticated;
