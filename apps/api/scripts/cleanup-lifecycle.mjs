import { loadConfig } from "../src/config.mjs"
import { createStorage } from "../src/storage.mjs"

const config = loadConfig()
const sessionRetentionDays = parsePositiveInteger(
  process.env.LIFTBOOK_SESSION_RETENTION_DAYS,
  30
)
const syncRetentionDays = parsePositiveInteger(
  process.env.LIFTBOOK_SYNC_RETENTION_DAYS,
  90
)

const storage = await createStorage(config)
const result = await storage.cleanupLifecycle({
  now: new Date().toISOString(),
  sessionRetentionDays,
  syncRetentionDays,
})

console.log(
  JSON.stringify(
    {
      ok: true,
      retention: {
        sessionRetentionDays,
        syncRetentionDays,
      },
      result,
    },
    null,
    2
  )
)

function parsePositiveInteger(value, fallback) {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid retention days value: ${value}`)
  }

  return parsed
}
