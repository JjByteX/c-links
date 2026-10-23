-- C-Links: card stock and the customers who bought.
-- One stock row (id is always true) holds how many cards are in stock.
-- Recording a purchase lowers the stock and logs the customer in one step.

create table public.stock (
  id          boolean primary key default true check (id),
  quantity    integer not null default 0 check (quantity >= 0),
  updated_at  timestamptz not null default now()
);

insert into public.stock default values;

create table public.purchases (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text not null check (length(trim(customer_name)) > 0),
  quantity       integer not null check (quantity > 0),
  created_at     timestamptz not null default now()
);

alter table public.stock enable row level security;
alter table public.purchases enable row level security;

create policy "partners manage stock"
  on public.stock
  for all
  to authenticated
  using (true)
  with check (true);

create policy "partners manage purchases"
  on public.purchases
  for all
  to authenticated
  using (true)
  with check (true);

-- Lowers the stock and logs the purchase together. Fails, changing nothing,
-- when there are fewer cards in stock than the customer bought.
create or replace function public.record_purchase(customer text, qty integer)
returns void
language plpgsql
as $$
declare
  remaining integer;
begin
  update public.stock
     set quantity = quantity - qty,
         updated_at = now()
   where id and quantity >= qty
  returning quantity into remaining;

  if not found then
    select quantity into remaining from public.stock where id;
    raise exception 'Only % in stock', remaining;
  end if;

  insert into public.purchases (customer_name, quantity)
  values (customer, qty);
end;
$$;

revoke all on function public.record_purchase(text, integer) from public;
grant execute on function public.record_purchase(text, integer) to authenticated;
