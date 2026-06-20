# Liftbook API

Minimal backend skeleton for account and sync contracts.

It now supports two backend storage paths:

- file-based local persistence for fast iteration;
- PostgreSQL-backed persistence for the real backend path.

The backend now tracks not only users and sessions, but also known client devices involved in sync.

Authorized API usage also updates `sessions.updated_at`, so session records behave like live server-side objects rather than write-once placeholders.

`cursor` should now be treated as an opaque server token that represents a position in the sync event log.

`pull` responses are page-based. The server limits how many sync events are returned at once and marks whether more pages are available with `hasMore`.

`push` is idempotent for the same logical change payload. If the client retries the exact same change, the backend reuses the existing sync event instead of creating a duplicate.

`push` batches are capped at 50 changes and each change must carry a valid ISO `updatedAt`. Empty batches are rejected with `400`.

Current-state sync records are now scoped per user internally, so two different users can safely have the same local entity ids without overwriting each other on the backend.

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
- `LIFTBOOK_SYNC_PULL_PAGE_SIZE`

Today:

- `LIFTBOOK_STORAGE_DRIVER=file` is the working default for local-only API storage.
- `LIFTBOOK_STORAGE_DRIVER=postgres` works when PostgreSQL is available and migrations have been applied.
- `LIFTBOOK_SYNC_PULL_PAGE_SIZE` controls how many events one `pull` page may return. Default: `100`.

## PostgreSQL Preparation

- Docker Compose service: [docker-compose.yml](/home/kirill-yashmetov/projects/liftbook/docker-compose.yml)
- Initial SQL sketch: [apps/api/db/migrations/0001_initial.sql](/home/kirill-yashmetov/projects/liftbook/apps/api/db/migrations/0001_initial.sql)
- Current-state records migration: [apps/api/db/migrations/0002_sync_records.sql](/home/kirill-yashmetov/projects/liftbook/apps/api/db/migrations/0002_sync_records.sql)
- Example env file: [.env.example](/home/kirill-yashmetov/projects/liftbook/.env.example)
- Local migration runner: [apps/api/scripts/run-migrations.mjs](/home/kirill-yashmetov/projects/liftbook/apps/api/scripts/run-migrations.mjs)

The migration runner now keeps a `schema_migrations` table and skips files that were already applied.

Lifecycle cleanup is available as a separate script:

```bash
pnpm cleanup:lifecycle
```

Default cleanup policy:

- expired sessions are removed when `expires_at` is in the past;
- sync events older than 90 days are removed by default;
- retention can be tuned with `LIFTBOOK_SESSION_RETENTION_DAYS` and `LIFTBOOK_SYNC_RETENTION_DAYS`.

For the current MVP 1 status and remaining scope, see:

- [docs/ru/mvp1-gap-review.md](/home/kirill-yashmetov/projects/liftbook/docs/ru/mvp1-gap-review.md)
- [docs/en/mvp1-gap-review.md](/home/kirill-yashmetov/projects/liftbook/docs/en/mvp1-gap-review.md)

Recommended local flow:

```bash
pnpm db:up
pnpm db:migrate
LIFTBOOK_STORAGE_DRIVER=postgres pnpm dev:api
pnpm --filter api smoke:sync
pnpm --filter api smoke:postgres:stack
```
