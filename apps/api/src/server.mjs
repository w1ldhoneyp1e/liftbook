import { createHash, randomUUID } from "node:crypto"
import { createServer } from "node:http"

import { createStore } from "./store.mjs"

const defaultPort = 4000
const maxBodySizeBytes = 1024 * 1024
const store = await createStore()

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
        store: store.getHealthSummary(),
      })
      return
    }

    if (request.method === "POST" && url.pathname === "/v1/auth/guest") {
      const body = await readJsonBody(request)
      const now = new Date().toISOString()
      const userId = `guest_${randomUUID()}`
      const clientId = typeof body.clientId === "string" ? body.clientId : null
      const locale = body.locale === "ru" ? "ru" : "en"
      const accessToken = createDevelopmentToken(userId, now)
      const expiresAt = addDays(new Date(), 30).toISOString()
      const { user, session } = await store.createGuestSession({
        clientId,
        locale,
        now,
        userId,
        accessToken,
        expiresAt,
      })

      sendJson(response, 201, {
        user,
        session: {
          accessToken: session.accessToken,
          tokenType: session.tokenType,
          expiresAt: session.expiresAt,
        },
        sync: {
          cursor: null,
        },
      })
      return
    }

    if (request.method === "POST" && url.pathname === "/v1/sync/push") {
      if (!requireSession(request)) {
        sendJson(response, 401, { error: "Unauthorized" })
        return
      }

      const body = await readJsonBody(request)
      const validationError = validatePushBody(body)

      if (validationError) {
        sendJson(response, 400, { error: validationError })
        return
      }

      const serverTime = new Date().toISOString()
      const acceptedEvents = await store.acceptSyncChanges({
        clientId: body.clientId,
        changes: body.changes,
        serverTime,
        buildAcceptedChange: acceptSyncChange,
      })

      sendJson(response, 202, {
        accepted: acceptedEvents.map((event) => ({
          localId: event.localId,
          entityType: event.entityType,
          operation: event.operation,
          serverVersion: event.serverVersion,
          status: "accepted",
        })),
        conflicts: [],
        nextCursor: serverTime,
        serverTime,
      })
      return
    }

    if (request.method === "GET" && url.pathname === "/v1/sync/pull") {
      if (!requireSession(request)) {
        sendJson(response, 401, { error: "Unauthorized" })
        return
      }

      const serverTime = new Date().toISOString()
      const cursor = url.searchParams.get("cursor")
      const clientId = url.searchParams.get("clientId")
      const changes = store.listSyncEvents({
        cursor,
        clientId,
      })

      sendJson(response, 200, {
        changes,
        cursor,
        nextCursor: changes.at(-1)?.serverTime ?? cursor ?? serverTime,
        serverTime,
      })
      return
    }

    sendJson(response, 404, { error: "Route not found" })
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error",
    })
  }
})

const port = Number(process.env.PORT ?? defaultPort)

server.listen(port, () => {
  console.log(`Liftbook API listening on http://localhost:${port}`)
})

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*")
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization,Content-Type"
  )
}

function getRequestOrigin(request) {
  const host = request.headers.host ?? `localhost:${defaultPort}`
  return `http://${host}`
}

async function readJsonBody(request) {
  const chunks = []
  let bodySize = 0

  for await (const chunk of request) {
    bodySize += chunk.length

    if (bodySize > maxBodySizeBytes) {
      throw new Error("Request body is too large")
    }

    chunks.push(chunk)
  }

  if (chunks.length === 0) {
    return {}
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"))
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  })
  response.end(JSON.stringify(payload, null, 2))
}

function validatePushBody(body) {
  if (!body || typeof body !== "object") {
    return "Expected JSON object"
  }

  if (typeof body.clientId !== "string" || body.clientId.length === 0) {
    return "clientId is required"
  }

  if (!Array.isArray(body.changes)) {
    return "changes must be an array"
  }

  for (const change of body.changes) {
    if (!change || typeof change !== "object") {
      return "each change must be an object"
    }

    if (typeof change.localId !== "string" || change.localId.length === 0) {
      return "change.localId is required"
    }

    const supportedEntityTypes = [
      "exercise",
      "workoutDay",
      "exerciseEntry",
      "userSettings",
    ]

    if (!supportedEntityTypes.includes(change.entityType)) {
      return "change.entityType is not supported"
    }

    if (!["upsert", "delete"].includes(change.operation)) {
      return "change.operation is not supported"
    }
  }

  return null
}

function requireSession(request) {
  const authorization = request.headers.authorization

  if (!authorization?.startsWith("Bearer ")) {
    return null
  }

  const accessToken = authorization.slice("Bearer ".length)
  const session = store.getSessionByAccessToken(accessToken)

  if (!session) {
    return null
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null
  }

  return session
}

function acceptSyncChange(clientId, change, serverTime) {
  const serverVersion = createServerVersion(change, serverTime)
  return {
    id: `sync_${randomUUID()}`,
    recordKey: `${change.entityType}:${change.localId}`,
    clientId,
    entityType: change.entityType,
    localId: change.localId,
    operation: change.operation,
    payload: change.payload ?? null,
    serverTime,
    serverVersion,
    updatedAt: change.updatedAt ?? serverTime,
  }
}

function createDevelopmentToken(userId, issuedAt) {
  return `dev_${createHash("sha256").update(`${userId}:${issuedAt}`).digest("hex")}`
}

function createServerVersion(change, serverTime) {
  return createHash("sha1")
    .update(
      `${change.localId}:${change.entityType}:${change.operation}:${serverTime}`
    )
    .digest("hex")
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}
