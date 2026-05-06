# Liftbook

Liftbook is a mobile-first, offline-first workout journal for gym training.

Current status:

- MVP 1 is released on a single VPS
- the main workout flow works offline-first
- sync and account support exist in basic form
- current work is focused on MVP 2 polish and next features

## Development

```bash
pnpm install
pnpm dev
pnpm dev:api
pnpm lint
pnpm build
```

The web application lives in `apps/web`.
The API skeleton lives in `apps/api`.

## Docs

- [Релиз на VPS](docs/ru/deploy-release.md)
- [Backlog](docs/ru/backlog.md)
- [План MVP 2](docs/ru/mvp2-plan.md)
- [Email confirmation](docs/ru/email-confirmation-plan.md)
