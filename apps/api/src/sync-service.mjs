import { createHash, randomUUID } from "node:crypto"

const supportedEntityTypes = [
  "exercise",
  "workoutDay",
  "exerciseEntry",
  "userSettings",
]
const maxPushBatchSize = 50

export function createSyncService(store, options = {}) {
  const pullPageSize = Math.max(1, Number(options.pullPageSize ?? 100))

  return {
    validatePushBody(body) {
      if (!body || typeof body !== "object") {
        return "Expected JSON object"
      }

      if (typeof body.clientId !== "string" || body.clientId.length === 0) {
        return "clientId is required"
      }

      if (!Array.isArray(body.changes)) {
        return "changes must be an array"
      }

      if (body.changes.length === 0) {
        return "changes must not be empty"
      }

      if (body.changes.length > maxPushBatchSize) {
        return `changes must not exceed ${maxPushBatchSize} items`
      }

      for (const change of body.changes) {
        if (!change || typeof change !== "object") {
          return "each change must be an object"
        }

        if (typeof change.localId !== "string" || change.localId.length === 0) {
          return "change.localId is required"
        }

        if (!supportedEntityTypes.includes(change.entityType)) {
          return "change.entityType is not supported"
        }

        if (!["upsert", "delete"].includes(change.operation)) {
          return "change.operation is not supported"
        }

        if (!isValidIsoTimestamp(change.updatedAt)) {
          return "change.updatedAt must be a valid ISO timestamp"
        }
      }

      return null
    },
    validatePullParams(clientId) {
      if (typeof clientId !== "string" || clientId.length === 0) {
        return "clientId is required"
      }

      return null
    },
    async pushChanges(body, session) {
      const serverTime = new Date().toISOString()
      const acceptedEvents = await store.acceptSyncChanges({
        userId: session.userId,
        clientId: body.clientId,
        changes: body.changes,
        serverTime,
        buildAcceptedChange: acceptSyncChange,
      })

      return {
        accepted: acceptedEvents.map((event) => ({
          localId: event.localId,
          entityType: event.entityType,
          operation: event.operation,
          serverVersion: event.serverVersion,
          status: "accepted",
        })),
        conflicts: [],
        nextCursor:
          acceptedEvents.at(-1)?.cursor ?? body.cursor ?? serverTime,
        serverTime,
      }
    },
    async pullChanges({ cursor, clientId, userId }) {
      const serverTime = new Date().toISOString()
      await store.touchDevice({
        userId,
        clientId,
        now: serverTime,
      })
      const { changes, hasMore } = await store.listSyncEvents({
        userId,
        cursor,
        clientId,
        limit: pullPageSize,
      })
      const nextCursor = changes.at(-1)?.cursor ?? cursor ?? serverTime

      return {
        changes,
        cursor,
        nextCursor,
        hasMore,
        serverTime,
      }
    },
  }
}

function acceptSyncChange({ userId, clientId, change, serverTime }) {
  const updatedAt = change.updatedAt ?? serverTime
  const payload = change.payload ?? null

  const serverVersion = createServerVersion(change, serverTime)

  return {
    id: `sync_${randomUUID()}`,
    recordKey: `${change.entityType}:${change.localId}`,
    storageKey: `${userId}:${change.entityType}:${change.localId}`,
    syncKey: createSyncKey({
      userId,
      clientId,
      entityType: change.entityType,
      localId: change.localId,
      operation: change.operation,
      updatedAt,
      payload,
    }),
    userId,
    clientId,
    entityType: change.entityType,
    localId: change.localId,
    operation: change.operation,
    payload,
    serverTime,
    serverVersion,
    updatedAt,
  }
}

function createServerVersion(change, serverTime) {
  return createHash("sha1")
    .update(
      `${change.localId}:${change.entityType}:${change.operation}:${serverTime}`
    )
    .digest("hex")
}

function createSyncKey({
  userId,
  clientId,
  entityType,
  localId,
  operation,
  updatedAt,
  payload,
}) {
  return createHash("sha1")
    .update(
      JSON.stringify({
        userId,
        clientId,
        entityType,
        localId,
        operation,
        updatedAt,
        payload,
      })
    )
    .digest("hex")
}

function isValidIsoTimestamp(value) {
  if (typeof value !== "string" || value.length === 0) {
    return false
  }

  const parsed = Date.parse(value)
  return Number.isFinite(parsed)
}
