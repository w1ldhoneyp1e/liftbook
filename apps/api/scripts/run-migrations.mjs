import { readFile, readdir } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, "../../..")
const migrationsDir = resolve(projectRoot, "apps/api/db/migrations")

const databaseName = process.env.POSTGRES_DB ?? "liftbook"
const databaseUser = process.env.POSTGRES_USER ?? "liftbook"
const postgresService = process.env.LIFTBOOK_POSTGRES_SERVICE ?? "postgres"

const migrationFiles = (await readdir(migrationsDir))
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort()

if (migrationFiles.length === 0) {
  console.log("No SQL migrations found.")
  process.exit(0)
}

for (const fileName of migrationFiles) {
  const filePath = join(migrationsDir, fileName)
  const sql = await readFile(filePath, "utf8")

  console.log(`Applying migration ${fileName}`)

  const result = spawnSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      postgresService,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      databaseUser,
      "-d",
      databaseName,
    ],
    {
      cwd: projectRoot,
      input: sql,
      stdio: ["pipe", "inherit", "inherit"],
      encoding: "utf8",
    }
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log("Migrations applied successfully.")
