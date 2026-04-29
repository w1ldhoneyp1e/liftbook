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

ensureMigrationTable()

const migrationFiles = (await readdir(migrationsDir))
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort()

if (migrationFiles.length === 0) {
  console.log("No SQL migrations found.")
  process.exit(0)
}

for (const fileName of migrationFiles) {
  if (isMigrationApplied(fileName)) {
    console.log(`Skipping migration ${fileName}`)
    continue
  }

  const filePath = join(migrationsDir, fileName)
  const sql = await readFile(filePath, "utf8")
  const escapedFileName = fileName.replaceAll("'", "''")

  console.log(`Applying migration ${fileName}`)

  runPsql({
    input: [
      "begin;",
      sql.trim(),
      `insert into schema_migrations (filename) values ('${escapedFileName}');`,
      "commit;",
      "",
    ].join("\n"),
  })
}

console.log("Migrations applied successfully.")

function ensureMigrationTable() {
  runPsql({
    input: `
      create table if not exists schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      );
    `,
  })
}

function isMigrationApplied(fileName) {
  const result = runPsql({
    args: [
      "-t",
      "-A",
      "-c",
      `select 1 from schema_migrations where filename = '${fileName.replaceAll("'", "''")}' limit 1;`,
    ],
    stdio: ["inherit", "pipe", "inherit"],
  })

  return result.stdout.trim() === "1"
}

function runPsql({
  args = [],
  input = "",
  stdio = ["pipe", "inherit", "inherit"],
} = {}) {
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
      ...args,
    ],
    {
      cwd: projectRoot,
      input,
      stdio,
      encoding: "utf8",
    }
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }

  return result
}
