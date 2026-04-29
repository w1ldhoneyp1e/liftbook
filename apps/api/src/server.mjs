import { createServer } from "node:http"

import { createAuthService } from "./auth-service.mjs"
import { loadConfig } from "./config.mjs"
import { getRequestOrigin, readJsonBody, sendJson, setCorsHeaders } from "./http.mjs"
import { createStorage } from "./storage.mjs"
import { createSyncService } from "./sync-service.mjs"

const config = loadConfig()
const storage = await createStorage(config)
const authService = createAuthService(storage)
const syncService = createSyncService(storage)

const server = createServer(async (request, response) => {
  try {
    setCorsHeaders(response)

    if (request.method === "OPTIONS") {
      response.writeHead(204)
      response.end()
      return
    }

    const url = new URL(request.url ?? "/", getRequestOrigin(request))

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, {
        ok: true,
        service: "liftbook-api",
        time: new Date().toISOString(),
        config: {
          storageDriver: config.storage.driver,
        },
        store: storage.getHealthSummary(),
      })
      return
    }

    if (request.method === "POST" && url.pathname === "/v1/auth/guest") {
      const body = await readJsonBody(request)
      sendJson(response, 201, await authService.createGuestAccount(body))
      return
    }

    if (request.method === "POST" && url.pathname === "/v1/sync/push") {
      if (!authService.requireSession(request)) {
        sendJson(response, 401, { error: "Unauthorized" })
        return
      }

      const body = await readJsonBody(request)
      const validationError = syncService.validatePushBody(body)

      if (validationError) {
        sendJson(response, 400, { error: validationError })
        return
      }

      sendJson(response, 202, await syncService.pushChanges(body))
      return
    }

    if (request.method === "GET" && url.pathname === "/v1/sync/pull") {
      if (!authService.requireSession(request)) {
        sendJson(response, 401, { error: "Unauthorized" })
        return
      }

      const cursor = url.searchParams.get("cursor")
      const clientId = url.searchParams.get("clientId")
      sendJson(response, 200, syncService.pullChanges({ cursor, clientId }))
      return
    }

    sendJson(response, 404, { error: "Route not found" })
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error",
    })
  }
})

server.listen(config.port, () => {
  console.log(`Liftbook API listening on http://localhost:${config.port}`)
})
