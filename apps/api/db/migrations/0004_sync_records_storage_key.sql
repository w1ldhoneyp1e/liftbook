alter table sync_records
  add column if not exists storage_key text;

update sync_records
set storage_key = user_id || ':' || record_key
where storage_key is null;

alter table sync_records
  alter column storage_key set not null;

alter table sync_records
  drop constraint if exists sync_records_pkey;

alter table sync_records
  add constraint sync_records_pkey primary key (storage_key);

create unique index if not exists sync_records_storage_key_idx
  on sync_records (storage_key);
