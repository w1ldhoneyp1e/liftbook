# Liftbook Deploy and Release

Date: 2026-04-30

## Recommended release topology

For the current MVP 1, the best path is:

- `apps/web` -> **Vercel**
- `apps/api` -> **Railway**
- PostgreSQL -> **Railway Postgres**

This is the shortest path to a live release:

- Next.js fits Vercel well;
- Railway is convenient for a Node API plus PostgreSQL;
- frontend and backend can be released independently;
- there is no need to run your own VPS, nginx, and database yet.

## Why this setup

The frontend is built with Next.js, and Vercel officially recommends zero-config deployment for Next.js.

The backend is separate and stateful:

- guest sessions;
- sync events;
- sync records;
- PostgreSQL migrations.

Railway is a good fit here because:

- it supports JavaScript monorepos well;
- it provides managed PostgreSQL;
- it supports pre-deploy commands for migrations.

## Important note about adding auth after release

### Short answer

**Yes, user data can be preserved**, as long as real authentication is introduced by **linking an auth identity to the existing guest-backed user record**, not by creating a brand new user on top of the old data.

### How it should work

The backend already stores data by `userId`.

When full authentication is added later, the correct flow is:

1. the person already exists as a `guest user`;
2. they sign in or register;
3. the new auth identity is linked to the existing `userId`;
4. workouts, settings, and sync data stay where they are.

That means we are not really “moving” data. We are **upgrading the identity model for an existing user**.

### Important caveat

If someone never created a guest account and stayed local-only:

- their data remains on **that same device**;
- it can still be uploaded after login through a local migration flow;
- but if browser data is cleared before login, there is no server backup to restore from.

So:

- **guest-account users can be migrated safely**;
- **local-only users do not have a server guarantee until they sync**.

## Environment variables

### Frontend (`apps/web`)

Required:

```text
NEXT_PUBLIC_LIFTBOOK_API_URL=https://<your-api-domain>
```

Example:

```text
NEXT_PUBLIC_LIFTBOOK_API_URL=https://liftbook-api.up.railway.app
```

### Backend (`apps/api`)

Minimum:

```text
PORT=4000
LIFTBOOK_STORAGE_DRIVER=postgres
DATABASE_URL=postgresql://...
LIFTBOOK_SYNC_PULL_PAGE_SIZE=100
LIFTBOOK_SESSION_RETENTION_DAYS=30
LIFTBOOK_SYNC_RETENTION_DAYS=90
```

`PORT` is usually supplied automatically by the platform, and the backend already supports that.

## Recommended release path

## 1. Prepare the Git repository

Before deployment, make sure the remote repository has the latest `main`.

Local pre-release check:

```bash
pnpm lint
pnpm build
```

## 2. Deploy API and PostgreSQL on Railway

### Create the project

In Railway:

1. create a new project;
2. connect the GitHub repository;
3. add a PostgreSQL service;
4. add an `api` service.

### For the monorepo

Because this is a shared pnpm monorepo, it is simplest to keep the repository root as `/` and set the service commands explicitly.

Recommended commands for the API service:

- Build Command:

```bash
pnpm --filter api build
```

- Start Command:

```bash
pnpm --filter api start
```

- Pre-Deploy Command:

```bash
pnpm --filter api db:migrate
```

### Railway variables for API

Set:

```text
LIFTBOOK_STORAGE_DRIVER=postgres
LIFTBOOK_SYNC_PULL_PAGE_SIZE=100
LIFTBOOK_SESSION_RETENTION_DAYS=30
LIFTBOOK_SYNC_RETENTION_DAYS=90
```

`DATABASE_URL` is typically provided automatically by Railway Postgres.

### Verification

After deploy, check:

```text
GET /health
```

Expected:

- `ok: true`
- `storageDriver: postgres`

## 3. Deploy web on Vercel

In Vercel:

1. import the same Git repository;
2. choose root directory: `apps/web`;
3. add env:

```text
NEXT_PUBLIC_LIFTBOOK_API_URL=https://<railway-api-domain>
```

4. deploy.

## 4. Post-release smoke check

Verify manually:

1. today screen opens;
2. an exercise can be added;
3. a set can be added;
4. local data survives refresh;
5. guest account creation works;
6. manual sync succeeds.

## 5. What counts as the first release

The release can be considered live if:

- the frontend is reachable publicly;
- the backend is reachable publicly;
- `guest account` creation works;
- `push/pull sync` works;
- the PostgreSQL path is active.

## What I do not recommend right now

- do not introduce Kubernetes;
- do not combine MVP launch with a full auth system;
- do not migrate backend frameworks right before deploy.

## Alternative path: a single VPS

If simpler costs and more direct control matter more, Liftbook can be deployed on one VPS.

The repository now includes:

- [docker-compose.vps.yml](/home/kirill-yashmetov/projects/liftbook/docker-compose.vps.yml)
- [Caddyfile](/home/kirill-yashmetov/projects/liftbook/Caddyfile)
- [apps/web/Dockerfile](/home/kirill-yashmetov/projects/liftbook/apps/web/Dockerfile)
- [apps/api/Dockerfile](/home/kirill-yashmetov/projects/liftbook/apps/api/Dockerfile)
- [.env.vps.example](/home/kirill-yashmetov/projects/liftbook/.env.vps.example)

And helper commands:

```bash
pnpm vps:migrate
pnpm vps:up
pnpm vps:down
pnpm vps:release
```

Topology:

- `web`
- `api`
- `postgres`
- `caddy`

Everything runs on one machine through Docker Compose.

### First VPS launch

1. Copy the project to the server.
2. Create `.env.vps` from `.env.vps.example`.
3. Run:

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d postgres
docker compose --env-file .env.vps -f docker-compose.vps.yml run --rm migrate
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d --build
```

### Repeat release on VPS

For the normal next release, use:

```bash
pnpm vps:release
```

Or directly:

```bash
./scripts/release-vps.sh
```

### What `release-vps.sh` does

The script performs the release in this order:

1. checks that required commands and files exist;
2. loads `.env.vps`;
3. verifies a clean git worktree;
4. runs `git fetch` and `git pull --ff-only`;
5. validates the Docker Compose config;
6. starts PostgreSQL;
7. waits for database readiness;
8. creates a database backup in `/var/backups/liftbook`;
9. builds fresh `api` and `web` images;
10. runs migrations;
11. starts `web`, `api`, `caddy`;
12. checks `http://127.0.0.1/api/health` with the domain host header;
13. prints `docker compose ps` and recent logs if something fails.

### Why the script does not auto-rollback the database

Automatic rollback after migrations can be more dangerous than helpful:

- migrations may not be symmetrical;
- the schema may already have changed;
- rolling back code without a deliberate DB rollback is unsafe.

So the script creates a **backup before migrations**, but does not try to automatically guess the correct rollback path.

That is an intentional choice in favor of predictability.

### Script behavior variables

You can override:

- `REMOTE` — git remote, default `origin`
- `BRANCH` — branch, default `main`
- `ENV_FILE` — path to the env file
- `COMPOSE_FILE` — path to the compose file
- `BACKUP_DIR` — backup destination, default `/var/backups/liftbook`
- `KEEP_BACKUPS` — how many backups to keep, default `10`
- `SKIP_GIT_PULL=1` — if you want to release an already-prepared checkout
- `SKIP_BACKUP=1` — if backup must temporarily be skipped
- `ALLOW_DIRTY=1` — if a dirty worktree is intentionally allowed

### Why Caddy

For a first VPS release, Caddy is usually more convenient than Nginx in three ways:

- it obtains and renews Let's Encrypt certificates automatically;
- the config is shorter and easier for a single domain;
- `reverse_proxy` plus `/api` routing to the backend is very low ceremony.

If more specialized proxy behavior is needed later, moving to Nginx is still easy.

## Sources

- Vercel monorepos: https://vercel.com/docs/monorepos
- Vercel Next.js: https://vercel.com/docs/concepts/next.js/overview
- Railway monorepo deploy: https://docs.railway.com/guides/monorepo
- Railway PostgreSQL: https://docs.railway.com/guides/postgresql
- Railway pre-deploy command: https://docs.railway.com/deployments/pre-deploy-command
