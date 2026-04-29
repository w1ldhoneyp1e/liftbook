# Liftbook API

Minimal backend skeleton for account and sync contracts.

It intentionally has no external runtime dependencies yet. The current version persists guest sessions and sync events to a local JSON file so the API can survive restarts before we move to PostgreSQL.

```bash
pnpm --filter api dev
```

Default URL: `http://localhost:4000`.

Default local storage: `apps/api/.data/store.json`.

## Routes

- `GET /health`
- `POST /v1/auth/guest`
- `POST /v1/sync/push`
- `GET /v1/sync/pull`

## Notes

- `push` and `pull` require `Authorization: Bearer <accessToken>`.
- The storage path can be overridden with `LIFTBOOK_DATA_FILE`.
