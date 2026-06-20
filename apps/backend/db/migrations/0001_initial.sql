create extension if not exists pgcrypto;

create table if not exists users (
  id text primary key,
  kind text not null,
  locale text not null,
  created_at timestamptz not null default now()
);

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  client_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  access_token text not null unique,
  token_type text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists sync_events (
  id text primary key,
  record_key text not null,
  user_id text references users(id) on delete set null,
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

create index if not exists sync_events_server_time_idx
  on sync_events (server_time);

create index if not exists sync_events_client_id_idx
  on sync_events (client_id);

create index if not exists sync_events_record_key_idx
  on sync_events (record_key);
