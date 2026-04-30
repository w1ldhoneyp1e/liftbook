import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const apiRoot = resolve(scriptDir, "..")
const serverEntry = resolve(apiRoot, "src/server.mjs")
const smokeScript = resolve(apiRoot, "scripts/smoke-sync-postgres.mjs")

const port = await resolveSmokePort()
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://liftbook:liftbook@localhost:5432/liftbook"
const apiBaseUrl = `http://localhost:${port}`

const serverProcess = spawn("node", [serverEntry], {
  cwd: apiRoot,
  env: {
    ...process.env,
    PORT: port,
    DATABASE_URL: databaseUrl,
    LIFTBOOK_STORAGE_DRIVER: "postgres",
    LIFTBOOK_SYNC_PULL_PAGE_SIZE: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
})

let serverOutput = ""
let serverErrorOutput = ""

serverProcess.stdout.on("data", (chunk) => {
  const text = chunk.toString()
  serverOutput += text
  process.stdout.write(text)
})

serverProcess.stderr.on("data", (chunk) => {
  const text = chunk.toString()
  serverErrorOutput += text
  process.stderr.write(text)
})

try {
  await waitForHealth(`${apiBaseUrl}/health`, 15000)

  await runNodeScript(smokeScript, {
    ...process.env,
    LIFTBOOK_API_URL: apiBaseUrl,
  })

  console.log("Postgres smoke stack passed.")
} finally {
  serverProcess.kill("SIGTERM")
  await waitForExit(serverProcess)
}

if (serverProcess.exitCode && serverProcess.exitCode !== 0) {
  throw new Error(
    `API server exited unexpectedly.\nSTDOUT:\n${serverOutput}\nSTDERR:\n${serverErrorOutput}`
  )
}

async function waitForHealth(url, timeoutMs) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)

      if (response.ok) {
        return
      }
    } catch {
      // Keep polling until timeout.
    }

    await delay(250)
  }

  throw new Error(`API health check timed out for ${url}`)
}

async function resolveSmokePort() {
  if (process.env.LIFTBOOK_SMOKE_PORT) {
    return process.env.LIFTBOOK_SMOKE_PORT
  }

  return String(await findFreePort())
}

async function findFreePort() {
  return new Promise((resolvePromise, rejectPromise) => {
    const probeServer = createServer()

    probeServer.once("error", rejectPromise)
    probeServer.listen(0, "127.0.0.1", () => {
      const address = probeServer.address()

      if (!address || typeof address === "string") {
        probeServer.close(() => {
          rejectPromise(new Error("Unable to resolve free smoke port"))
        })
        return
      }

      const freePort = address.port
      probeServer.close((closeError) => {
        if (closeError) {
          rejectPromise(closeError)
          return
        }

        resolvePromise(freePort)
      })
    })
  })
}

async function runNodeScript(scriptPath, env) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("node", [scriptPath], {
      cwd: apiRoot,
      env,
      stdio: "inherit",
    })

    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      rejectPromise(
        new Error(`Script ${scriptPath} failed with exit code ${code ?? 1}`)
      )
    })

    child.on("error", rejectPromise)
  })
}

async function waitForExit(childProcess) {
  if (childProcess.exitCode !== null) {
    return
  }

  await new Promise((resolvePromise) => {
    childProcess.once("exit", () => resolvePromise())
  })
}

function delay(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms)
  })
}
