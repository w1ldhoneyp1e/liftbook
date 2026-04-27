# Liftbook API

Minimal backend skeleton for account and sync contracts.

It intentionally has no external runtime dependencies yet. The goal is to make the future backend boundary concrete without choosing database, auth provider, or framework too early.

```bash
pnpm --filter api dev
```

Default URL: `http://localhost:4000`.

## Routes

- `GET /health`
- `POST /v1/auth/guest`
- `POST /v1/sync/push`
- `GET /v1/sync/pull`
