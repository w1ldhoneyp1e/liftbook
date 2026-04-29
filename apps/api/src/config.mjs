const defaultPort = 4000

export function loadConfig(env = process.env) {
  const port = parsePort(env.PORT)

  return {
    port,
    storage: {
      driver: env.LIFTBOOK_STORAGE_DRIVER ?? "file",
      dataFile: env.LIFTBOOK_DATA_FILE ?? ".data/store.json",
      databaseUrl: env.DATABASE_URL ?? null,
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
