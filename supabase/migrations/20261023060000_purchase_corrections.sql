-- C-Links: fix mistakes in purchases.
--   * void a purchase: the cards go back into stock and the sale stops
--     counting as sold or revenue. The row stays, with who and why in the
--     activity log, so the history is intact.
--   * edit a purchase: the customer name only. A wrong package or number of
--     cards is voided and recorded again, which keeps the stock honest.
--   * card edits and deletes keep the old link in the activity log.
-- Purchases can now only be changed through these functions, not directly.

alter table public.purchases
  add column voided_at     timestamptz,
  add column voided_reason text;

drop policy "partners manage purchases" on public.purchases;

create policy "partners read purchases"
  on public.purchases
  for select
  to authenticated
  using (true);

-- Stock on hand: cards received minus cards bought, voided purchases left out.
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
           - coalesce((select sum(quantity) from public.purchases
                        where voided_at is null), 0);

  if on_hand + qty < 0 then
    raise exception 'Only % in stock', on_hand;
  end if;

  insert into public.stock_log (kind, quantity)
  values (case when qty > 0 then 'restock' else 'correction' end, qty);
end;
$$;

-- Now security definer: purchases are written only through these functions.
create or replace function public.record_purchase(
  customer text,
  pkg text,
  qty integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.packages;
  on_hand bigint;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if length(trim(customer)) = 0 then
    raise exception 'Enter a customer';
  end if;

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
           - coalesce((select sum(quantity) from public.purchases
                        where voided_at is null), 0);

  if qty > on_hand then
    raise exception 'Only % in stock', on_hand;
  end if;

  insert into public.purchases (customer_name, quantity, package_key, amount)
  values (trim(customer), qty, pkg, p.price * qty / p.bundle_size);
end;
$$;

create or replace function public.void_purchase(purchase uuid, reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if length(trim(reason)) = 0 then
    raise exception 'Enter a reason';
  end if;

  perform pg_advisory_xact_lock(hashtext('c-links-stock'));

  update public.purchases
     set voided_at = now(),
         voided_reason = trim(reason)
   where id = purchase and voided_at is null;

  if not found then
    raise exception 'This purchase was not found or is already voided';
  end if;
end;
$$;

create or replace function public.edit_purchase_customer(
  purchase uuid,
  customer text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if length(trim(customer)) = 0 then
    raise exception 'Enter a customer';
  end if;

  update public.purchases
     set customer_name = trim(customer)
   where id = purchase and voided_at is null;

  if not found then
    raise exception 'This purchase was not found or is voided';
  end if;
end;
$$;

revoke all on function public.record_purchase(text, text, integer) from public;
grant execute on function public.record_purchase(text, text, integer) to authenticated;
revoke all on function public.void_purchase(uuid, text) from public;
grant execute on function public.void_purchase(uuid, text) to authenticated;
revoke all on function public.edit_purchase_customer(uuid, text) from public;
grant execute on function public.edit_purchase_customer(uuid, text) to authenticated;

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
  changes text[] := '{}';
  pur public.purchases;
  detail text;
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
      txt := 'Deleted card ' || old.label || ' (link was ' || old.destination_url
          || ', ' || old.tap_count
          || case when old.tap_count = 1 then ' tap' else ' taps' end || ')';
    else
      -- Taps also update the card; only edits by a partner are logged.
      if new.label is not distinct from old.label
         and new.destination_url is not distinct from old.destination_url then
        return null;
      end if;
      if new.label is distinct from old.label then
        changes := changes || ('name was ' || old.label);
      end if;
      if new.destination_url is distinct from old.destination_url then
        changes := changes || ('link changed from ' || old.destination_url
                               || ' to ' || new.destination_url);
      end if;
      act := 'card_edited';
      txt := 'Edited card ' || new.label
          || ' (' || array_to_string(changes, '; ') || ')';
    end if;

  elsif tg_table_name = 'purchases' then
    if tg_op = 'DELETE' then
      pur := old;
    else
      pur := new;
    end if;
    select name into pkg_name from public.packages where key = pur.package_key;
    detail := pur.customer_name || ': '
           || pur.quantity || case when pur.quantity = 1 then ' card' else ' cards' end
           || ', ' || coalesce(pkg_name, pur.package_key)
           || ', ₱' || to_char(pur.amount, 'FM999,999,999');

    if tg_op = 'INSERT' then
      act := 'purchase_recorded';
      txt := 'Recorded purchase for ' || detail;
    elsif tg_op = 'DELETE' then
      act := 'purchase_deleted';
      txt := 'Deleted purchase for ' || detail;
    elsif old.voided_at is null and new.voided_at is not null then
      act := 'purchase_voided';
      txt := 'Voided purchase for ' || detail || '. Reason: ' || new.voided_reason;
    elsif new.customer_name is distinct from old.customer_name then
      act := 'purchase_edited';
      txt := 'Edited purchase for ' || detail || ' (name was ' || old.customer_name || ')';
    else
      return null;
    end if;

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
