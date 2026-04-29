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
    storage: {
      driver: env.LIFTBOOK_STORAGE_DRIVER ?? "file",
      dataFile: env.LIFTBOOK_DATA_FILE ?? ".data/store.json",
      databaseUrl: env.DATABASE_URL ?? null,
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
