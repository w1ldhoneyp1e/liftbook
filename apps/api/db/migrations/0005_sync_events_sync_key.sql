alter table sync_events
  add column if not exists sync_key text;

update sync_events
set sync_key = encode(
  digest(
    coalesce(user_id, '') || ':' ||
      client_id || ':' ||
      entity_type || ':' ||
      local_id || ':' ||
      operation || ':' ||
      updated_at::text || ':' ||
      coalesce(payload::text, 'null'),
    'sha1'
  ),
  'hex'
)
where sync_key is null;

alter table sync_events
  alter column sync_key set not null;

create unique index if not exists sync_events_sync_key_idx
  on sync_events (sync_key);
