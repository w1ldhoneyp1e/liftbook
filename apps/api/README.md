# Liftbook API

Minimal backend skeleton for account and sync contracts.

It intentionally has no external runtime dependencies yet. The current version persists guest sessions and sync events to a local JSON file so the API can survive restarts before we move to PostgreSQL.

The storage layer already goes through a driver boundary, so a future PostgreSQL adapter can replace the file store without rewriting auth/sync routes.

```bash
pnpm --filter api dev
```

Default URL: `http://localhost:4000`.

Default local storage: `apps/api/.data/store.json`.

Local PostgreSQL can be started from the repo root:

```bash
pnpm db:up
```

## Routes

- `GET /health`
- `POST /v1/auth/guest`
- `POST /v1/sync/push`
- `GET /v1/sync/pull`

## Notes

- `push` and `pull` require `Authorization: Bearer <accessToken>`.
- The storage path can be overridden with `LIFTBOOK_DATA_FILE`.
- The storage driver is selected with `LIFTBOOK_STORAGE_DRIVER` and currently supports `file` and the `postgres` placeholder.

## Configuration

Supported environment variables:

- `PORT`
- `LIFTBOOK_STORAGE_DRIVER`
- `LIFTBOOK_DATA_FILE`
- `DATABASE_URL`

Today:

- `LIFTBOOK_STORAGE_DRIVER=file` is the working default.
- `LIFTBOOK_STORAGE_DRIVER=postgres` is a prepared boundary and currently returns a clear not-implemented error.

## PostgreSQL Preparation

- Docker Compose service: [docker-compose.yml](/home/kirill-yashmetov/projects/liftbook/docker-compose.yml)
- Initial SQL sketch: [apps/api/db/migrations/0001_initial.sql](/home/kirill-yashmetov/projects/liftbook/apps/api/db/migrations/0001_initial.sql)
- Example env file: [.env.example](/home/kirill-yashmetov/projects/liftbook/.env.example)
