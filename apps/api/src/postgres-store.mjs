export async function createPostgresStore(options) {
  const databaseUrl = options?.databaseUrl ?? null

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required when LIFTBOOK_STORAGE_DRIVER=postgres"
    )
  }

  throw new Error(
    "Postgres storage driver is not implemented yet. Use LIFTBOOK_STORAGE_DRIVER=file for now."
  )
}
