-- C-Links: fuller stock history.
--   * each stock entry keeps the partner who made it and an optional note.
--     A correction (a negative number) must have a reason.
--   * a voided purchase keeps who voided it, so the Stock screen can show the
--     cards coming back.
--   * stock entries can only be added through record_stock_change, which
--     fills in the partner itself, so the partner cannot be faked.
-- The note also appears in the activity log.

alter table public.stock_log
  add column actor_id    uuid,
  add column actor_email text not null default '',
  add column note        text check (note is null or length(note) <= 200);

alter table public.purchases
  add column voided_by text;

drop policy "partners add to stock log" on public.stock_log;

drop function public.record_stock_change(integer);

-- Adds cards to the stock (positive) or corrects the count (negative, with a
-- reason). Fails, changing nothing, if the stock would go below zero.
create or replace function public.record_stock_change(
  qty integer,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  on_hand bigint;
  clean_note text := nullif(trim(note), '');
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if qty = 0 then
    raise exception 'Enter a number other than 0';
  end if;
  if qty < 0 and clean_note is null then
    raise exception 'Enter a reason for the correction';
  end if;

  perform pg_advisory_xact_lock(hashtext('c-links-stock'));

  on_hand := coalesce((select sum(quantity) from public.stock_log), 0)
           - coalesce((select sum(quantity) from public.purchases
                        where voided_at is null), 0);

  if on_hand + qty < 0 then
    raise exception 'Only % in stock', on_hand;
  end if;

  insert into public.stock_log (kind, quantity, actor_id, actor_email, note)
  values (
    case when qty > 0 then 'restock' else 'correction' end,
    qty,
    auth.uid(),
    coalesce(auth.jwt() ->> 'email', ''),
    clean_note
  );
end;
$$;

revoke all on function public.record_stock_change(integer, text) from public;
grant execute on function public.record_stock_change(integer, text) to authenticated;

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
         voided_reason = trim(reason),
         voided_by = coalesce(auth.jwt() ->> 'email', '')
   where id = purchase and voided_at is null;

  if not found then
    raise exception 'This purchase was not found or is already voided';
  end if;
end;
$$;

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
          || ' to stock' || coalesce(' (' || new.note || ')', '');
    else
      act := 'stock_corrected';
      txt := 'Corrected stock by ' || new.quantity
          || coalesce(' (' || new.note || ')', '');
    end if;
  end if;

  insert into public.activity (actor_id, actor_email, action, summary)
  values (auth.uid(), coalesce(auth.jwt() ->> 'email', ''), act, txt);

  return null;
end;
$$;
