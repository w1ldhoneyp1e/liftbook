# Hardening: next steps

Date: 2026-05-01

This document tracks the main operational risks after the first VPS release of Liftbook and the recommended next hardening steps.

## Current state

Liftbook currently runs as a single VPS stack:

- `web`
- `api`
- `postgres`
- `caddy`

Releases are automated through [scripts/release-vps.sh](/home/kirill-yashmetov/projects/liftbook/scripts/release-vps.sh).

A PostgreSQL backup is created before each release.

## What is already good

- there is a single release flow;
- there is a backup before migrations;
- there is a post-deploy healthcheck;
- there is a repeatable Docker Compose runtime;
- there is an explicit production env file.

## Main risks

### 1. One VPS is a single point of failure

If the server or disk fails, all of these fail together:

- frontend;
- backend;
- database;
- local backup files.

### 2. Backups are local, not offsite

The backup is created on the same server that runs PostgreSQL.

That means:

- it helps against a bad release;
- it does not protect against full VPS or disk loss.

### 3. Backups are release-time, not scheduled

Right now, backups are created before `pnpm vps:release`.

If a long time passes between releases, the recovery window grows.

### 4. There is no dedicated restore tool yet

Backups exist, but restore is still manual. That is better than nothing, but weaker than a tested restore flow.

### 5. There is no infrastructure monitoring

There is currently no:

- uptime monitoring;
- memory alerts;
- disk alerts;
- container restart alerts;
- external `/api/health` availability checks.

### 6. SSH and server access still need hardening

This is acceptable at the start, but later we should:

- move away from `root` as the main operational login;
- use SSH keys;
- restrict firewall access;
- enable fail2ban if needed.

### 7. There is no staging environment

Every release goes directly to production. That is acceptable for MVP, but still an operational risk.

## Recommended hardening order

## 1. Scheduled backups via cron

Goal:

- create backups not only at release time, but on a schedule.

Recommendation:

- nightly backups, for example once per night.

## 2. Offsite backups

Goal:

- keep backup copies outside the main VPS.

Examples:

- S3-compatible storage;
- a second server;
- provider object storage.

This is the single most important next step after release-time backups.

## 3. Restore script + test restore

Goal:

- not only create dumps, but restore predictably.

Recommendation:

- add a dedicated `restore-vps.sh`;
- verify a real restore once on a test environment.

## 4. SSH hardening

Goal:

- reduce the risk of server compromise.

Recommendation:

- create a dedicated deploy user;
- use SSH key login;
- disable password login for `root`;
- configure firewall.

## 5. Basic monitoring

Minimum useful set:

- external ping/HTTP checks;
- free disk monitoring;
- RAM monitoring;
- notification when a service goes down.

## 6. Log rotation and housekeeping

Goal:

- prevent logs and old artifacts from filling the disk.

## 7. Later: staging

Not required immediately, but useful once release frequency grows.

## Priority

If only three things are done next, I would do:

1. **Nightly backup**
2. **Offsite backup**
3. **Restore script + test restore**

That gives the biggest reliability win for the least additional complexity.
