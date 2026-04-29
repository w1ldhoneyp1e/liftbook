create table if not exists sync_records (
  record_key text primary key,
  user_id text references users(id) on delete cascade,
  client_id text not null,
  entity_type text not null,
  local_id text not null,
  operation text not null,
  payload jsonb,
  server_time timestamptz not null,
  server_version text not null,
  updated_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sync_records_user_id_idx
  on sync_records (user_id);

create index if not exists sync_records_entity_local_idx
  on sync_records (entity_type, local_id);
