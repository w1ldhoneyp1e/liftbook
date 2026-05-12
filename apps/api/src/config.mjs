const defaultPort = 4000
const defaultSyncPullPageSize = 100

export function loadConfig(env = process.env) {
  const port = parsePort(env.PORT)
  const syncPullPageSize = parsePositiveInteger(
    env.LIFTBOOK_SYNC_PULL_PAGE_SIZE,
    "LIFTBOOK_SYNC_PULL_PAGE_SIZE",
    defaultSyncPullPageSize
  )

  return {
    port,
    appOrigin: env.LIFTBOOK_APP_ORIGIN ?? null,
    storage: {
      driver: env.LIFTBOOK_STORAGE_DRIVER ?? "file",
      dataFile: env.LIFTBOOK_DATA_FILE ?? ".data/store.json",
      databaseUrl: env.DATABASE_URL ?? null,
    },
    mail: {
      provider: env.LIFTBOOK_EMAIL_PROVIDER ?? "console",
      fromEmail: env.LIFTBOOK_FROM_EMAIL ?? "auth@liftbook.local",
      fromName: env.LIFTBOOK_FROM_NAME ?? "Liftbook",
      smtp: {
        host: env.SMTP_HOST ?? null,
        port: parsePortLike(env.SMTP_PORT, 587),
        secure: parseBoolean(env.SMTP_SECURE, false),
        user: env.SMTP_USER ?? null,
        password: env.SMTP_PASSWORD ?? null,
      },
    },
    sync: {
      pullPageSize: syncPullPageSize,
    },
  }
}

function parsePort(value) {
  if (!value) {
    return defaultPort
  }

  const port = Number(value)

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${value}`)
  }

  return port
}

function parsePositiveInteger(value, name, fallback) {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} value: ${value}`)
  }

  return parsed
}

function parseBoolean(value, fallback) {
  if (value === undefined) {
    return fallback
  }

  if (value === "true") {
    return true
  }

  if (value === "false") {
    return false
  }

  throw new Error(`Invalid boolean value: ${value}`)
}

function parsePortLike(value, fallback) {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid SMTP_PORT value: ${value}`)
  }

  return parsed
}
