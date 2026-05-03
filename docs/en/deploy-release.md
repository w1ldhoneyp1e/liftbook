# Liftbook VPS Release Guide

Date: 2026-05-03

This document describes a **strict step-by-step release flow for a single VPS**.  
The format is intentionally operational: minimal theory, concrete commands.

## Prerequisites

Before starting, make sure you already have:

- a VPS with Ubuntu and SSH access;
- a domain pointing to the VPS IP;
- Docker and the Docker Compose plugin installed on the server;
- the Liftbook repository cloned on the server, for example in `/opt/liftbook`;
- a populated `.env.vps` file.

If all of that is ready, follow the steps below.

---

## First release

### 1. Connect to the server

On your local machine:

```bash
ssh root@<SERVER_IP>
```

Example:

```bash
ssh root@5.180.174.222
```

### 2. Enter the project directory

On the server:

```bash
cd /opt/liftbook
```

### 3. Verify that `.env.vps` exists

```bash
ls -la .env.vps
```

If the file does not exist, create it from the template:

```bash
cp .env.vps.example .env.vps
nano .env.vps
```

Minimum required values:

```text
LIFTBOOK_DOMAIN=liftbook.ru

POSTGRES_DB=liftbook
POSTGRES_USER=liftbook
POSTGRES_PASSWORD=strong_password

NEXT_PUBLIC_LIFTBOOK_API_URL=/api

LIFTBOOK_STORAGE_DRIVER=postgres
LIFTBOOK_SYNC_PULL_PAGE_SIZE=100
LIFTBOOK_SESSION_RETENTION_DAYS=30
LIFTBOOK_SYNC_RETENTION_DAYS=90
```

### 4. Start PostgreSQL only

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d postgres
```

### 5. Verify that PostgreSQL is running

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml ps
```

`postgres` should be listed as `Up`.

### 6. Run migrations

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml run --rm migrate
```

If everything is correct, migrations should finish without errors.

### 7. Start the full stack

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d --build
```

This starts:

- `postgres`
- `api`
- `web`
- `caddy`

### 8. Check container status

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml ps
```

### 9. Verify backend health

On the server:

```bash
curl -I http://127.0.0.1
curl http://127.0.0.1/api/health -H "Host: liftbook.ru"
```

The second command should return JSON with `ok: true`.

### 10. Verify the public site

In the browser:

```text
https://liftbook.ru
```

And separately:

```text
https://liftbook.ru/api/health
```

---

## Releasing an existing VPS deployment

Once the VPS has already been set up and the first release was completed, use the flow below.

### 1. Connect to the server

```bash
ssh root@<SERVER_IP>
```

### 2. Enter the project directory

```bash
cd /opt/liftbook
```

### 3. Run the automated release

```bash
pnpm vps:release
```

Or directly:

```bash
./scripts/release-vps.sh
```

This is the recommended command for normal follow-up releases.

---

## What `pnpm vps:release` does

The release script performs these steps:

1. validates required tools and files;
2. loads `.env.vps`;
3. checks git working tree status;
4. runs `git fetch` and `git pull --ff-only`;
5. validates the Docker Compose configuration;
6. starts PostgreSQL;
7. waits for DB readiness;
8. creates a DB backup in `/var/backups/liftbook`;
9. builds fresh `api` and `web` images;
10. runs migrations;
11. starts `web`, `api`, and `caddy`;
12. checks `http://127.0.0.1/api/health`.

---

## How to inspect logs if something goes wrong

### All services

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs --tail=100
```

### API only

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs api
```

### Web only

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs web
```

### Caddy only

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs caddy
```

### PostgreSQL only

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs postgres
```

---

## How to stop the stack

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml down
```

Or via package script:

```bash
pnpm vps:down
```

---

## Minimal post-release checklist

After each release, verify manually:

1. the main page opens;
2. an exercise can be added;
3. a set can be added;
4. guest account creation works;
5. manual sync works;
6. `https://liftbook.ru/api/health` responds successfully.

---

## Short version

If you only want the shortest set of commands:

### First release

```bash
ssh root@<SERVER_IP>
cd /opt/liftbook
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d postgres
docker compose --env-file .env.vps -f docker-compose.vps.yml run --rm migrate
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d --build
curl http://127.0.0.1/api/health -H "Host: liftbook.ru"
```

### Next release

```bash
ssh root@<SERVER_IP>
cd /opt/liftbook
pnpm vps:release
```
