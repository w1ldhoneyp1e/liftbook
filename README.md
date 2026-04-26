# Liftbook

Liftbook is a mobile-first, offline-first workout journal for gym training.

The first product goal is simple: open the app on an iPhone during a workout and quickly log exercises, sets, reps, and weight. The app should show what the user did for the same exercise in previous workouts, even without an internet connection.

## Product Direction

- Personal workout journal first.
- Free for the target user.
- Mobile-first UX for real gym usage.
- Offline-first data model: local data is primary during use, sync happens later.
- Account support should appear early, but the workout flow must remain usable without network access.
- UI text must be translatable.
- Built with future integration in mind, especially as a standalone service or feature inside a larger corporate HR/training product.

## Current Decisions

- Product name: Liftbook
- Repository name: liftbook
- Initial architecture: modular monolith with clear domain boundaries and future service extraction in mind.
- App direction: PWA with all core workout flows available offline.
- Repository structure: pnpm monorepo.
- Web app: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui.
- Backend direction: custom backend, added when sync/account work starts.

## Development

```bash
pnpm install
pnpm dev
pnpm lint
pnpm build
```

The web application lives in `apps/web`.

## Docs

- [Product brief](docs/product-brief.md)
- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Domain model draft](docs/domain-model.md)
- [Exercise catalog plan](docs/exercise-catalog.md)
- [MVP UX flow](docs/ux-flow.md)
- [Day screen MVP spec](docs/day-screen-spec.md)
- [MVP roadmap](docs/mvp-roadmap.md)
- [Refactor backlog](docs/refactor-backlog.md)
- [ADR 0001: initial technical direction](docs/adr/0001-initial-technical-direction.md)
- [ADR 0002: stack and monorepo](docs/adr/0002-stack-and-monorepo.md)
