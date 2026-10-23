-- C-Links: activity log of who did what.
-- Changes to cards, purchases and the stock log are recorded by triggers, so
-- no screen can forget to log them. Each row keeps the partner's email as it
-- was at the time. Partner accounts are created through the server, which
-- writes its own row. The log can be read by partners and never edited or
-- deleted. Changes made without a signed-in partner, like running the seed
-- in the SQL Editor, are not logged.

create table public.activity (
  id           bigint generated always as identity primary key,
  actor_id     uuid,
  actor_email  text not null default '',
  action       text not null,
  summary      text not null,
  created_at   timestamptz not null default now()
);

create index activity_created_at_idx on public.activity (created_at desc);

alter table public.activity enable row level security;

create policy "partners read activity"
  on public.activity
  for select
  to authenticated
  using (true);

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  act text;
  txt text;
  pkg_name text;
begin
  if auth.uid() is null then
    return null;
  end if;

  if tg_table_name = 'cards' then
    if tg_op = 'INSERT' then
      act := 'card_added';
      txt := 'Added card ' || new.label;
    elsif tg_op = 'DELETE' then
      act := 'card_deleted';
      txt := 'Deleted card ' || old.label;
    else
      -- Taps also update the card; only edits by a partner are logged.
      if new.label is not distinct from old.label
         and new.destination_url is not distinct from old.destination_url then
        return null;
      end if;
      act := 'card_edited';
      txt := 'Edited card ' || new.label;
    end if;

  elsif tg_table_name = 'purchases' then
    select name into pkg_name from public.packages where key = new.package_key;
    act := 'purchase_recorded';
    txt := 'Recorded purchase for ' || new.customer_name || ': '
        || new.quantity || case when new.quantity = 1 then ' card' else ' cards' end
        || ', ' || coalesce(pkg_name, new.package_key)
        || ', ₱' || to_char(new.amount, 'FM999,999,999');

  elsif tg_table_name = 'stock_log' then
    if new.kind = 'opening' then
      return null;
    elsif new.quantity > 0 then
      act := 'stock_added';
      txt := 'Added ' || new.quantity
          || case when new.quantity = 1 then ' card' else ' cards' end
          || ' to stock';
    else
      act := 'stock_corrected';
      txt := 'Corrected stock by ' || new.quantity;
    end if;
  end if;

  insert into public.activity (actor_id, actor_email, action, summary)
  values (auth.uid(), coalesce(auth.jwt() ->> 'email', ''), act, txt);

  return null;
end;
$$;

create trigger log_cards_activity
  after insert or update or delete on public.cards
  for each row execute function public.log_activity();

create trigger log_purchases_activity
  after insert on public.purchases
  for each row execute function public.log_activity();

create trigger log_stock_log_activity
  after insert on public.stock_log
  for each row execute function public.log_activity();
