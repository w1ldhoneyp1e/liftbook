# Backend Research

Date: 2026-04-28

This document tracks the backend direction before we replace the current in-memory API skeleton with a persistent service.

## Current Recommendation

Use a TypeScript modular monolith with PostgreSQL as the primary database.

Recommended first production stack:

- Runtime/API: Fastify or NestJS on Node.js.
- Database: PostgreSQL.
- Data access: Prisma or Drizzle.
- Auth: start with guest accounts and later add email/OAuth without changing the offline-first write path.
- Sync: append-only `sync_events` plus current-state tables for workouts, exercise entries, custom exercises, and settings.

My current preference for Liftbook:

- **Fastify + PostgreSQL + Prisma** if we want a small service with explicit architecture and fast iteration.
- **NestJS + PostgreSQL + Prisma** if the backend is expected to quickly grow into a larger team-owned platform with many modules, guards, queues, integrations, and formal application layers.

## Why PostgreSQL

Liftbook data is relational enough to benefit from PostgreSQL:

- Users own workouts.
- Workout days contain exercise entries.
- Exercise entries contain sets.
- Custom exercises belong to users.
- Sync events need ordering, cursors, and durable storage.

PostgreSQL also gives us transactions, indexes, JSON fields for sync payloads, and good hosting options.

## Fastify

Fastify is a good fit if we want a lean API and we are comfortable owning the architecture ourselves.

Pros:

- Lower framework weight.
- Good TypeScript support.
- Natural fit for route-level schemas.
- Easy to migrate from the current minimal HTTP skeleton.

Tradeoff:

- We must define our own module boundaries, dependency injection pattern, testing conventions, and application structure.

Official docs: https://fastify.dev/docs/latest/Reference/TypeScript/

## NestJS

NestJS is a good fit if backend complexity grows quickly.

Pros:

- Strong opinionated architecture.
- First-class modules, providers, guards, interceptors, validation, OpenAPI, health checks, and auth patterns.
- Easier to keep a large backend organized.

Tradeoff:

- More framework ceremony than we need for the first persistent sync service.

Official docs: https://docs.nestjs.com/

## Prisma

Prisma is attractive for Liftbook because it gives a type-safe client and a clear migration workflow.

Pros:

- Strong TypeScript developer experience.
- Schema-first models are easy to read.
- `prisma migrate` gives a straightforward migration path.
- Good fit for a product that is still changing shape.

Tradeoff:

- Less close to SQL than Drizzle.
- Generated client and migration workflow add their own conventions.

Official docs: https://docs.prisma.io/docs/prisma-orm/quickstart/postgresql

## Drizzle

Drizzle is attractive if we want to stay closer to SQL and keep the ORM layer thin.

Pros:

- SQL-like TypeScript schema definitions.
- Lightweight data access.
- Explicit migrations through drizzle-kit.

Tradeoff:

- Slightly more manual modeling than Prisma.
- The team must be comfortable thinking closer to SQL.

Official docs: https://orm.drizzle.team/docs/get-started/postgresql-new

## Proposed Backend Milestones

1. Replace in-memory sync storage with PostgreSQL tables.
2. Add migrations and database connection config.
3. Persist guest users and sessions.
4. Persist sync events and current entity snapshots.
5. Add pull sync that can exclude events from the requesting client.
6. Add conflict detection rules.
7. Add production auth after the guest sync path is stable.

## Initial Data Model Sketch

Core tables:

- `users`
- `sessions`
- `devices`
- `exercises`
- `workout_days`
- `exercise_entries`
- `user_settings`
- `sync_events`

Important sync fields:

- `client_id`
- `local_id`
- `server_id`
- `entity_type`
- `operation`
- `payload`
- `server_version`
- `created_at`
- `updated_at`
- `deleted_at`

## Decision To Revisit

Before installing backend dependencies, decide:

- Fastify or NestJS.
- Prisma or Drizzle.
- Whether sync payloads start as JSON snapshots or fully normalized writes.
- Whether we need Docker Compose for local PostgreSQL immediately.
