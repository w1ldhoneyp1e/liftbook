# Backend Research

Date: 2026-04-28

This document tracks the backend direction before we replace the current in-memory API skeleton with a persistent service.

That transition has already started: the current API is no longer fully in-memory. Guest sessions and sync events are now persisted to a local JSON store. This is not production persistence yet, but it is a useful step between process memory and PostgreSQL.

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

From a deployment-convenience perspective, start with **Fastify + PostgreSQL + Prisma** unless we deliberately choose NestJS for team/process reasons. It is simpler to containerize, simpler to run as one service, and still leaves a clean path to NestJS-style modular boundaries later.

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

## Deployment Convenience

Deployment convenience matters more than framework ceremony at this stage. The first real backend should be easy to run locally, easy to deploy as a single service, and easy to connect to managed PostgreSQL.

### Recommended First Deployment Shape

- One API service.
- One managed PostgreSQL database.
- Environment variables for secrets and database URL.
- Migration command as an explicit release/deploy step.
- Dockerfile support from the beginning, even if the first host can also deploy directly from Git.
- No Kubernetes until the product actually needs it.

### Hosting Options To Evaluate

#### Railway

Railway is convenient for early product work because Node services and PostgreSQL can live in one project. Railway PostgreSQL exposes common connection variables including `DATABASE_URL`, which fits Prisma and Drizzle well.

Useful for:

- Fast MVP deployment.
- Managed Postgres with low setup.
- Preview-like environments.
- Minimal infrastructure work.

Risk:

- Platform abstraction can hide production details until traffic grows.

Docs: https://docs.railway.com/guides/postgresql

#### Render

Render is also straightforward for a monolith API. It supports web services from Git or Docker images, and services can communicate over private networking. For public web services, the app must bind to `0.0.0.0` and the configured port.

Useful for:

- Git-based deploys.
- Docker deploys when we want portability.
- Managed services with clear UI.

Risk:

- Need to check plan limits, cold starts, and database backup behavior before production.

Docs: https://render.com/docs/web-services

#### DigitalOcean App Platform

DigitalOcean App Platform is a managed PaaS that can deploy from Git repositories or container images. It supports Node.js buildpacks and Dockerfiles, and can add databases during app setup.

Useful for:

- A more traditional cloud vendor.
- Managed app + managed database in one ecosystem.
- Teams that may later use Droplets, Spaces, or managed databases directly.

Risk:

- Slightly more cloud-console feel than Railway/Render.

Docs: https://docs.digitalocean.com/products/app-platform/reference/buildpacks/nodejs/

#### Fly.io

Fly.io is attractive when geographic placement and Docker-image portability matter. It uses Docker images as the packaging format and runs apps as lightweight VMs.

Useful for:

- Low-latency global deployment later.
- Strong Docker-first workflow.
- More control than typical PaaS.

Risk:

- More operational surface area than Railway/Render for the first MVP backend.

Docs: https://fly.io/docs/blueprints/working-with-docker

### Framework Impact On Deployment

Fastify and NestJS both deploy as normal Node services. Deployment convenience should not be the deciding factor between them.

The practical difference:

- Fastify starts smaller and maps closely to a single API service.
- NestJS brings more structure, but also more files, decorators, and framework conventions.

For deployment, both can use the same Dockerfile shape:

1. install dependencies
2. build TypeScript
3. run migrations
4. start the HTTP server on `$PORT`

### ORM Impact On Deployment

Prisma and Drizzle both work with `DATABASE_URL`.

Prisma deployment considerations:

- Needs generated client as part of build.
- Needs migration command during release.
- Very convenient for schema readability and product iteration.

Drizzle deployment considerations:

- Needs drizzle-kit migration generation/application.
- Closer to SQL and often lighter at runtime.
- Slightly more manual discipline around schema evolution.

For deployment simplicity, Prisma is slightly easier for the first persistent backend because its migration and generated client workflow is widely documented and explicit.

### Local Development

Use Docker Compose for local PostgreSQL once persistence begins.

Target commands:

```bash
pnpm dev:api
pnpm db:migrate
pnpm db:studio
```

Local `.env` should include:

```text
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

### Deployment Recommendation

Phase 1:

- Deploy API + managed PostgreSQL to Railway or Render.
- Use Dockerfile only if the platform's native Node deploy becomes awkward with the pnpm monorepo.
- Keep migrations explicit, not hidden inside app startup.

Phase 2:

- Add staging environment.
- Add preview deploys for pull requests if the platform makes it cheap.
- Add database backups and restore rehearsal.

Phase 3:

- Revisit Fly.io or a container platform if latency, region placement, or infrastructure control becomes important.

## Proposed Backend Milestones

1. Replace the file-based store with PostgreSQL tables.
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
