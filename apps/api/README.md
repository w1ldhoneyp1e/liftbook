# Liftbook API

Minimal backend skeleton for account and sync contracts.

It now supports two backend storage paths:

- file-based local persistence for fast iteration;
- PostgreSQL-backed persistence for the real backend path.

The backend now tracks not only users and sessions, but also known client devices involved in sync.

Authorized API usage also updates `sessions.updated_at`, so session records behave like live server-side objects rather than write-once placeholders.

`cursor` should now be treated as an opaque server token that represents a position in the sync event log.

The storage layer already goes through a driver boundary, so a future PostgreSQL adapter can replace the file store without rewriting auth/sync routes.

```bash
pnpm --filter api dev
```

Default URL: `http://localhost:4000`.

Default local storage: `apps/api/.data/store.json`.

Local PostgreSQL can be started from the repo root:

```bash
pnpm db:up
pnpm db:migrate
```

## Routes

- `GET /health`
- `POST /v1/auth/guest`
- `POST /v1/sync/push`
- `GET /v1/sync/pull`

## Notes

- `push` and `pull` require `Authorization: Bearer <accessToken>`.
- `pull` also requires `clientId` in the query string.
- The storage path can be overridden with `LIFTBOOK_DATA_FILE`.
- The storage driver is selected with `LIFTBOOK_STORAGE_DRIVER` and supports `file` and `postgres`.

## Configuration

Supported environment variables:

- `PORT`
- `LIFTBOOK_STORAGE_DRIVER`
- `LIFTBOOK_DATA_FILE`
- `DATABASE_URL`

Today:

- `LIFTBOOK_STORAGE_DRIVER=file` is the working default for local-only API storage.
- `LIFTBOOK_STORAGE_DRIVER=postgres` works when PostgreSQL is available and migrations have been applied.

## PostgreSQL Preparation

- Docker Compose service: [docker-compose.yml](/home/kirill-yashmetov/projects/liftbook/docker-compose.yml)
- Initial SQL sketch: [apps/api/db/migrations/0001_initial.sql](/home/kirill-yashmetov/projects/liftbook/apps/api/db/migrations/0001_initial.sql)
- Current-state records migration: [apps/api/db/migrations/0002_sync_records.sql](/home/kirill-yashmetov/projects/liftbook/apps/api/db/migrations/0002_sync_records.sql)
- Example env file: [.env.example](/home/kirill-yashmetov/projects/liftbook/.env.example)
- Local migration runner: [apps/api/scripts/run-migrations.mjs](/home/kirill-yashmetov/projects/liftbook/apps/api/scripts/run-migrations.mjs)

The migration runner now keeps a `schema_migrations` table and skips files that were already applied.

Recommended local flow:

```bash
pnpm db:up
pnpm db:migrate
LIFTBOOK_STORAGE_DRIVER=postgres pnpm dev:api
```
