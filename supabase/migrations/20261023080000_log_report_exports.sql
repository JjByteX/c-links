-- C-Links: log exported reports.
-- log_event takes one more value, report_exported, with a short description
-- of what was exported (the report and its dates). The wording around it is
-- built here and the description is cut to 120 characters.

drop function public.log_event(text, uuid);

create or replace function public.log_event(
  evt text,
  card uuid default null,
  detail text default null
)
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
  elsif evt = 'report_exported' then
    txt := 'Exported ' || left(coalesce(nullif(trim(detail), ''), 'a report'), 120);
  else
    raise exception 'Unknown event';
  end if;

  insert into public.activity (actor_id, actor_email, action, summary)
  values (auth.uid(), coalesce(auth.jwt() ->> 'email', ''), evt, txt);
end;
$$;

revoke all on function public.log_event(text, uuid, text) from public;
grant execute on function public.log_event(text, uuid, text) to authenticated;
