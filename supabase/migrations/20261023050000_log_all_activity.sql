-- C-Links: record everything in the activity log.
-- Adds what the first version missed:
--   * card edits say what changed (the old name, the new link)
--   * purchase edits and deletes are logged, not only new purchases
--   * sign-ins, sign-outs and written chips, which the app reports through
--     log_event below
-- Taps are not logged here: they come from the public, not from a partner,
-- and have their own log (taps).

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
      if new.label is distinct from old.label then
        changes := changes || ('name was ' || old.label);
      end if;
      if new.destination_url is distinct from old.destination_url then
        changes := changes || ('link changed to ' || new.destination_url);
      end if;
      act := 'card_edited';
      txt := 'Edited card ' || new.label
          || ' (' || array_to_string(changes, '; ') || ')';
    end if;

  elsif tg_table_name = 'purchases' then
    if tg_op = 'DELETE' then
      pur := old;
      act := 'purchase_deleted';
      txt := 'Deleted purchase for ';
    elsif tg_op = 'UPDATE' then
      pur := new;
      act := 'purchase_edited';
      txt := 'Edited purchase for ';
    else
      pur := new;
      act := 'purchase_recorded';
      txt := 'Recorded purchase for ';
    end if;
    select name into pkg_name from public.packages where key = pur.package_key;
    txt := txt || pur.customer_name || ': '
        || pur.quantity || case when pur.quantity = 1 then ' card' else ' cards' end
        || ', ' || coalesce(pkg_name, pur.package_key)
        || ', ₱' || to_char(pur.amount, 'FM999,999,999');

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

drop trigger log_purchases_activity on public.purchases;

create trigger log_purchases_activity
  after insert or update or delete on public.purchases
  for each row execute function public.log_activity();

-- Events only the app can see. The app names the event and, for a chip, the
-- card. The wording is built here, so a partner cannot write their own text
-- into the log.
create or replace function public.log_event(evt text, card uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  txt text;
  card_label text;
begin
  if auth.uid() is null then
    return;
  end if;

  if evt = 'sign_in' then
    txt := 'Signed in';
  elsif evt = 'sign_out' then
    txt := 'Signed out';
  elsif evt = 'chip_written' then
    select label into card_label from public.cards where id = card;
    txt := 'Wrote chip for card ' || coalesce(card_label, 'unknown');
  else
    raise exception 'Unknown event';
  end if;

  insert into public.activity (actor_id, actor_email, action, summary)
  values (auth.uid(), coalesce(auth.jwt() ->> 'email', ''), evt, txt);
end;
$$;

revoke all on function public.log_event(text, uuid) from public;
grant execute on function public.log_event(text, uuid) to authenticated;
