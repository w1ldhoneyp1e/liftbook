import { readFile, readdir } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, "../../..")
const migrationsDir = resolve(projectRoot, "apps/api/db/migrations")
const { Client } = pg
const client = new Client({
  connectionString: getDatabaseUrl(),
})

await client.connect()

try {
  await ensureMigrationTable()

  const migrationFiles = (await readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()

  if (migrationFiles.length === 0) {
    console.log("No SQL migrations found.")
    process.exit(0)
  }

  for (const fileName of migrationFiles) {
    if (await isMigrationApplied(fileName)) {
      console.log(`Skipping migration ${fileName}`)
      continue
    }

    const filePath = join(migrationsDir, fileName)
    const sql = await readFile(filePath, "utf8")

    console.log(`Applying migration ${fileName}`)
    await applyMigration(fileName, sql)
  }

  console.log("Migrations applied successfully.")
} finally {
  await client.end()
}

async function ensureMigrationTable() {
  await client.query(`
      create table if not exists schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      );
    `)
}

async function isMigrationApplied(fileName) {
  const result = await client.query(
    "select 1 from schema_migrations where filename = $1 limit 1",
    [fileName]
  )

  return result.rowCount === 1
}

async function applyMigration(fileName, sql) {
  await client.query("begin")

  try {
    await client.query(sql)
    await client.query(
      "insert into schema_migrations (filename) values ($1)",
      [fileName]
    )
    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  }
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const databaseName = process.env.POSTGRES_DB ?? "liftbook"
  const databaseUser = process.env.POSTGRES_USER ?? "liftbook"
  const databasePassword = process.env.POSTGRES_PASSWORD ?? "liftbook"
  const databaseHost = process.env.POSTGRES_HOST ?? "127.0.0.1"
  const databasePort = process.env.POSTGRES_PORT ?? "5432"

  return `postgresql://${databaseUser}:${databasePassword}@${databaseHost}:${databasePort}/${databaseName}`
}
