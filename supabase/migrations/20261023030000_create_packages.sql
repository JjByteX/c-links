-- C-Links: sales packages.
-- Every purchase is logged against a package. The package sets the price, and
-- the amount is saved on the purchase so later price changes do not rewrite
-- old sales. bundle_size is how many cards one price covers (5 for the
-- business bundle, 1 for per-card packages). min_quantity is the fewest cards
-- the package can be bought in.

create table public.packages (
  key           text primary key,
  name          text not null,
  price         integer not null check (price > 0),
  bundle_size   integer not null default 1 check (bundle_size > 0),
  min_quantity  integer not null default 1 check (min_quantity > 0),
  sort_order    integer not null
);

alter table public.packages enable row level security;

create policy "partners read packages"
  on public.packages
  for select
  to authenticated
  using (true);

insert into public.packages (key, name, price, bundle_size, min_quantity, sort_order)
values
  ('standard', 'Standard NFC Card',        99, 1,  1, 1),
  ('custom',   'Custom-Designed NFC Card', 150, 1,  1, 2),
  ('social',   'Social Starter Card',       79, 1,  1, 3),
  ('business', 'Business/Group Bundle',    650, 5,  5, 4),
  ('bulk',     'Bulk/Event Package',        85, 1, 20, 5);

-- Purchases made before packages existed are counted as standard cards.
alter table public.purchases
  add column package_key text references public.packages (key),
  add column amount integer check (amount >= 0);

update public.purchases
   set package_key = 'standard',
       amount = quantity * 99;

alter table public.purchases
  alter column package_key set not null,
  alter column amount set not null;

-- Logs the purchase at the package price. Fails, changing nothing, when the
-- cards do not fit the package or there are fewer in stock than bought.
drop function public.record_purchase(text, integer);

create or replace function public.record_purchase(
  customer text,
  pkg text,
  qty integer
)
returns void
language plpgsql
as $$
declare
  p public.packages;
  on_hand bigint;
begin
  select * into p from public.packages where key = pkg;
  if not found then
    raise exception 'Unknown package';
  end if;

  if qty < p.min_quantity then
    raise exception 'Minimum is % cards for this package', p.min_quantity;
  end if;
  if qty % p.bundle_size <> 0 then
    raise exception 'Cards must come in groups of %', p.bundle_size;
  end if;

  perform pg_advisory_xact_lock(hashtext('c-links-stock'));

  on_hand := coalesce((select sum(quantity) from public.stock_log), 0)
           - coalesce((select sum(quantity) from public.purchases), 0);

  if qty > on_hand then
    raise exception 'Only % in stock', on_hand;
  end if;

  insert into public.purchases (customer_name, quantity, package_key, amount)
  values (customer, qty, pkg, p.price * qty / p.bundle_size);
end;
$$;

revoke all on function public.record_purchase(text, text, integer) from public;
grant execute on function public.record_purchase(text, text, integer) to authenticated;
