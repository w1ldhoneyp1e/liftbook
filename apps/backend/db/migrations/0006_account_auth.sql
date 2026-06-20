alter table users
  add column if not exists email text,
  add column if not exists password_hash text,
  add column if not exists password_salt text,
  add column if not exists updated_at timestamptz not null default now();

update users
set updated_at = created_at
where updated_at is null;

create unique index if not exists users_email_lower_unique_idx
  on users (lower(email))
  where email is not null;
