#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
ENV_FILE="${ENV_FILE:-$PROJECT_ROOT/.env.vps}"
COMPOSE_FILE="${COMPOSE_FILE:-$PROJECT_ROOT/docker-compose.vps.yml}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/liftbook}"
POSTGRES_WAIT_TIMEOUT_SECONDS="${POSTGRES_WAIT_TIMEOUT_SECONDS:-120}"
HEALTHCHECK_TIMEOUT_SECONDS="${HEALTHCHECK_TIMEOUT_SECONDS:-180}"
KEEP_BACKUPS="${KEEP_BACKUPS:-10}"
ALLOW_DIRTY="${ALLOW_DIRTY:-0}"
SKIP_GIT_PULL="${SKIP_GIT_PULL:-0}"
SKIP_BACKUP="${SKIP_BACKUP:-0}"

COMPOSE=(
  docker
  compose
  --env-file
  "$ENV_FILE"
  -f
  "$COMPOSE_FILE"
)

log() {
  printf '[liftbook-release] %s\n' "$*"
}

die() {
  printf '[liftbook-release] ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Command not found: $1"
}

require_file() {
  [[ -f "$1" ]] || die "Required file not found: $1"
}

load_env() {
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
}

require_env() {
  local name="$1"
  [[ -n "${!name:-}" ]] || die "Required env var is missing in $ENV_FILE: $name"
}

ensure_clean_worktree() {
  if [[ "$ALLOW_DIRTY" == "1" ]]; then
    return
  fi

  local status
  status="$(git -C "$PROJECT_ROOT" status --porcelain)"

  [[ -z "$status" ]] || die "Git worktree is dirty. Commit or stash changes first, or set ALLOW_DIRTY=1."
}

sync_git() {
  if [[ "$SKIP_GIT_PULL" == "1" ]]; then
    log "Skipping git pull because SKIP_GIT_PULL=1"
    return
  fi

  log "Fetching $REMOTE/$BRANCH"
  git -C "$PROJECT_ROOT" fetch "$REMOTE" "$BRANCH"

  local current_branch
  current_branch="$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD)"

  if [[ "$current_branch" != "$BRANCH" ]]; then
    log "Checking out branch $BRANCH"
    git -C "$PROJECT_ROOT" checkout "$BRANCH"
  fi

  log "Fast-forwarding $BRANCH"
  git -C "$PROJECT_ROOT" pull --ff-only "$REMOTE" "$BRANCH"
}

compose_config_check() {
  log "Validating Docker Compose configuration"
  "${COMPOSE[@]}" config >/dev/null
}

start_postgres() {
  log "Starting PostgreSQL"
  "${COMPOSE[@]}" up -d postgres
}

wait_for_postgres() {
  log "Waiting for PostgreSQL to become ready"
  local deadline=$((SECONDS + POSTGRES_WAIT_TIMEOUT_SECONDS))

  until "${COMPOSE[@]}" exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
    if (( SECONDS >= deadline )); then
      "${COMPOSE[@]}" logs --tail=100 postgres || true
      die "PostgreSQL did not become ready in time"
    fi

    sleep 2
  done
}

create_backup() {
  if [[ "$SKIP_BACKUP" == "1" ]]; then
    log "Skipping PostgreSQL backup because SKIP_BACKUP=1"
    return
  fi

  mkdir -p "$BACKUP_DIR"

  local release_rev short_rev timestamp backup_file
  release_rev="$(git -C "$PROJECT_ROOT" rev-parse HEAD)"
  short_rev="${release_rev:0:7}"
  timestamp="$(date +%Y%m%d-%H%M%S)"
  backup_file="$BACKUP_DIR/liftbook-${timestamp}-${short_rev}.dump"

  log "Creating PostgreSQL backup at $backup_file"
  "${COMPOSE[@]}" exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$backup_file"
  chmod 600 "$backup_file"

  rotate_backups
}

rotate_backups() {
  mapfile -t backups < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'liftbook-*.dump' | sort)

  if (( ${#backups[@]} <= KEEP_BACKUPS )); then
    return
  fi

  local to_delete_count=$(( ${#backups[@]} - KEEP_BACKUPS ))

  for ((i = 0; i < to_delete_count; i += 1)); do
    rm -f -- "${backups[$i]}"
  done
}

build_images() {
  log "Building web and api images"
  "${COMPOSE[@]}" build api web
}

run_migrations() {
  log "Running database migrations"
  "${COMPOSE[@]}" run --rm migrate
}

deploy_stack() {
  log "Starting application containers"
  "${COMPOSE[@]}" up -d web api caddy
}

check_health() {
  log "Checking release health"
  local deadline=$((SECONDS + HEALTHCHECK_TIMEOUT_SECONDS))
  local healthcheck_output

  until healthcheck_output="$(curl -fsS --max-time 5 -H "Host: $LIFTBOOK_DOMAIN" http://127.0.0.1/api/health)"; do
    if (( SECONDS >= deadline )); then
      print_failure_context
      die "Healthcheck request failed"
    fi

    sleep 3
  done

  if ! grep -q '"ok"[[:space:]]*:[[:space:]]*true' <<<"$healthcheck_output"; then
    print_failure_context
    die "Healthcheck response did not report ok=true"
  fi
}

print_failure_context() {
  log "docker compose ps:"
  "${COMPOSE[@]}" ps || true
  log "Recent api logs:"
  "${COMPOSE[@]}" logs --tail=100 api || true
  log "Recent web logs:"
  "${COMPOSE[@]}" logs --tail=100 web || true
  log "Recent caddy logs:"
  "${COMPOSE[@]}" logs --tail=100 caddy || true
}

print_summary() {
  local release_rev
  release_rev="$(git -C "$PROJECT_ROOT" rev-parse --short HEAD)"

  log "Release completed successfully"
  log "Revision: $release_rev"
  log "URL: https://$LIFTBOOK_DOMAIN"
  log "Health: https://$LIFTBOOK_DOMAIN/api/health"
}

main() {
  require_command git
  require_command docker
  require_command curl
  require_command find
  require_command grep
  require_command rm
  require_file "$ENV_FILE"
  require_file "$COMPOSE_FILE"

  load_env

  require_env LIFTBOOK_DOMAIN
  require_env POSTGRES_DB
  require_env POSTGRES_USER
  require_env POSTGRES_PASSWORD

  ensure_clean_worktree
  sync_git
  compose_config_check
  start_postgres
  wait_for_postgres
  create_backup
  build_images
  run_migrations
  deploy_stack
  check_health
  print_summary
}

main "$@"
