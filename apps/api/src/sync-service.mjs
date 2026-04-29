import { createHash, randomUUID } from "node:crypto"

const supportedEntityTypes = [
  "exercise",
  "workoutDay",
  "exerciseEntry",
  "userSettings",
]

export function createSyncService(store) {
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
      }

      return null
    },
    async pushChanges(body) {
      const serverTime = new Date().toISOString()
      const acceptedEvents = await store.acceptSyncChanges({
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
        nextCursor: serverTime,
        serverTime,
      }
    },
    pullChanges({ cursor, clientId }) {
      const serverTime = new Date().toISOString()
      const changes = store.listSyncEvents({
        cursor,
        clientId,
      })

      return {
        changes,
        cursor,
        nextCursor: changes.at(-1)?.serverTime ?? cursor ?? serverTime,
        serverTime,
      }
    },
  }
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

function createServerVersion(change, serverTime) {
  return createHash("sha1")
    .update(
      `${change.localId}:${change.entityType}:${change.operation}:${serverTime}`
    )
    .digest("hex")
}
