create sequence if not exists sync_events_cursor_seq;

alter table sync_events
  add column if not exists sequence bigint;

alter table sync_events
  alter column sequence set default nextval('sync_events_cursor_seq');

with ordered_events as (
  select id
  from sync_events
  where sequence is null
  order by server_time asc, created_at asc, id asc
)
update sync_events
set sequence = nextval('sync_events_cursor_seq')
from ordered_events
where sync_events.id = ordered_events.id;

create unique index if not exists sync_events_sequence_idx
  on sync_events (sequence);
