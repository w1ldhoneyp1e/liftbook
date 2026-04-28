# ADR 0002: Stack And Monorepo

## Status

Accepted

## Context

Liftbook is a mobile-first, offline-first workout journal. It should support guest/local usage, accounts later, and a custom backend for backup, sync, and future integrations.

## Decision

Use a pnpm monorepo.

Initial structure:

- `apps/web`: Next.js PWA.
- `apps/api`: custom backend API, added when backend implementation starts.
- `packages/domain`: shared domain types, schemas, and business rules.
- `packages/config`: shared project configuration if needed.

Frontend stack:

- Next.js with App Router.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- IndexedDB through Dexie for local offline persistence.

Backend direction:

- Custom TypeScript backend.
- Start modular and keep domain boundaries clear.
- Avoid distributed microservices until product and scale justify them.

## Consequences

- The repo is ready for web, backend, and shared packages.
- Next.js gives product structure without blocking offline-first design.
- shadcn/ui can work for mobile-first because components are local code and Tailwind-driven.
- More setup complexity than a single Vite app, but better fit for a future product with backend and integrations.

## References

- Next.js create-next-app docs: https://nextjs.org/docs/app/api-reference/cli/create-next-app
- shadcn/ui Next.js installation: https://ui.shadcn.com/docs/installation/next
- shadcn/ui Drawer docs: https://ui.shadcn.com/docs/components/drawer
