import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

const defaultStoreState = {
  version: 1,
  nextSequence: 1,
  users: [],
  devices: [],
  sessions: [],
  syncEvents: [],
  syncRecords: [],
}

export async function createFileStore() {
  return createFileStoreFromPath(
    resolve(process.cwd(), process.env.LIFTBOOK_DATA_FILE ?? ".data/store.json")
  )
}

export async function createFileStoreFromPath(filePath) {
  let state = await loadState(filePath)
  let writeChain = Promise.resolve()

  function queuePersist() {
    writeChain = writeChain.then(async () => {
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, JSON.stringify(state, null, 2))
    })

    return writeChain
  }

  return {
    async getHealthSummary() {
      return {
        storage: "file",
        filePath,
        users: state.users.length,
        devices: state.devices.length,
        sessions: state.sessions.length,
        syncEvents: state.syncEvents.length,
        syncRecords: state.syncRecords.length,
      }
    },
    createGuestSession({ clientId, locale, now, userId, accessToken, expiresAt }) {
      const user = {
        id: userId,
        kind: "guest",
        clientId,
        locale,
        createdAt: now,
      }
      const session = {
        id: `session_${userId}`,
        userId,
        accessToken,
        tokenType: "Bearer",
        expiresAt,
        createdAt: now,
        updatedAt: now,
      }

      state = {
        ...state,
        users: [...state.users, user],
        devices: clientId
          ? upsertDevice(state.devices, {
              userId,
              clientId,
              createdAt: now,
              updatedAt: now,
            })
          : state.devices,
        sessions: [...state.sessions, session],
      }

      return queuePersist().then(() => ({
        user,
        session,
      }))
    },
    async getSessionByAccessToken(accessToken) {
      return (
        state.sessions.find((session) => session.accessToken === accessToken) ??
        null
      )
    },
    async touchSession({ accessToken, now }) {
      const nextSessions = state.sessions.map((session) =>
        session.accessToken === accessToken
          ? {
              ...session,
              updatedAt: now,
            }
          : session
      )

      state = {
        ...state,
        sessions: nextSessions,
      }

      await queuePersist()
    },
    async touchDevice({ userId, clientId, now }) {
      if (!clientId) {
        return
      }

      state = {
        ...state,
        devices: upsertDevice(state.devices, {
          userId,
          clientId,
          createdAt: now,
          updatedAt: now,
        }),
      }

      await queuePersist()
    },
    acceptSyncChanges({
      userId,
      clientId,
      changes,
      serverTime,
      buildAcceptedChange,
    }) {
      const existingEventsBySyncKey = new Map(
        state.syncEvents
          .filter((event) => typeof event.syncKey === "string")
          .map((event) => [event.syncKey, event])
      )
      const accepted = []
      let nextSequence = state.nextSequence

      for (const change of changes) {
        const builtEvent = buildAcceptedChange({
          userId,
          clientId,
          change,
          serverTime,
        })
        const existingEvent = existingEventsBySyncKey.get(builtEvent.syncKey)

        if (existingEvent) {
          accepted.push(existingEvent)
          continue
        }

        const persistedEvent = {
          ...builtEvent,
          sequence: nextSequence,
          cursor: String(nextSequence),
        }

        accepted.push(persistedEvent)
        existingEventsBySyncKey.set(persistedEvent.syncKey, persistedEvent)
        nextSequence += 1
      }

      const nextRecords = new Map(
        state.syncRecords.map((record) => [
          getStorageKey(record),
          withStorageKey(record),
        ])
      )

      for (const event of accepted) {
        const storageKey = getStorageKey(event)

        if (event.operation === "delete") {
          nextRecords.delete(storageKey)
          continue
        }

        nextRecords.set(storageKey, withStorageKey(event))
      }

      state = {
        ...state,
        devices: clientId
          ? upsertDevice(state.devices, {
              userId,
              clientId,
              createdAt: serverTime,
              updatedAt: serverTime,
            })
          : state.devices,
        nextSequence,
        syncEvents: mergeSyncEvents(state.syncEvents, accepted),
        syncRecords: Array.from(nextRecords.values()),
      }

      return queuePersist().then(() => accepted)
    },
    async listSyncEvents({ userId, cursor, clientId, limit }) {
      const parsedCursor = parseCursor(cursor)
      const pageSize = normalizeLimit(limit)
      const matchingEvents = state.syncEvents
        .filter((event) => event.userId === userId)
        .filter((event) =>
          parsedCursor === null
            ? !cursor || event.serverTime > cursor
            : (event.sequence ?? 0) > parsedCursor
        )
        .filter((event) => !clientId || event.clientId !== clientId)
      const changes = matchingEvents.slice(0, pageSize)

      return {
        changes,
        hasMore: matchingEvents.length > pageSize,
      }
    },
    async cleanupLifecycle({
      now,
      sessionRetentionDays,
      syncRetentionDays,
    }) {
      const sessionCutoff = toCutoff(now, sessionRetentionDays)
      const syncCutoff = toCutoff(now, syncRetentionDays)
      const previousSessionCount = state.sessions.length
      const previousSyncEventCount = state.syncEvents.length
      const previousDeviceCount = state.devices.length

      state = {
        ...state,
        sessions: state.sessions.filter(
          (session) => new Date(session.expiresAt).getTime() > sessionCutoff
        ),
        syncEvents: state.syncEvents.filter((event) => {
          const eventTime = new Date(event.serverTime).getTime()
          return Number.isNaN(eventTime) ? true : eventTime >= syncCutoff
        }),
      }

      await queuePersist()

      return {
        storage: "file",
        removedSessions: previousSessionCount - state.sessions.length,
        removedSyncEvents: previousSyncEventCount - state.syncEvents.length,
        removedDevices: previousDeviceCount - state.devices.length,
      }
    },
  }
}

async function loadState(filePath) {
  try {
    const content = await readFile(filePath, "utf8")
    const parsed = JSON.parse(content)

    return {
      ...defaultStoreState,
      ...parsed,
      nextSequence:
        typeof parsed.nextSequence === "number" ? parsed.nextSequence : 1,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      devices: Array.isArray(parsed.devices) ? parsed.devices : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      syncEvents: Array.isArray(parsed.syncEvents) ? parsed.syncEvents : [],
      syncRecords: Array.isArray(parsed.syncRecords) ? parsed.syncRecords : [],
    }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return defaultStoreState
    }

    throw error
  }
}

function upsertDevice(devices, nextDevice) {
  const existingDevice = devices.find(
    (device) =>
      device.userId === nextDevice.userId && device.clientId === nextDevice.clientId
  )

  if (!existingDevice) {
    return [...devices, nextDevice]
  }

  return devices.map((device) =>
    device.userId === nextDevice.userId && device.clientId === nextDevice.clientId
      ? {
          ...device,
          updatedAt: nextDevice.updatedAt,
        }
      : device
  )
}

function parseCursor(cursor) {
  if (!cursor) {
    return null
  }

  const parsed = Number(cursor)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeLimit(limit) {
  const parsed = Number(limit)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 100
}

function toCutoff(now, retentionDays) {
  const parsedDays = Number(retentionDays)
  const days = Number.isInteger(parsedDays) && parsedDays > 0 ? parsedDays : 30
  return new Date(now).getTime() - days * 24 * 60 * 60 * 1000
}

function getStorageKey(record) {
  return record.storageKey ?? `${record.userId}:${record.recordKey}`
}

function withStorageKey(record) {
  return {
    ...record,
    storageKey: getStorageKey(record),
  }
}

function mergeSyncEvents(existingEvents, acceptedEvents) {
  const knownIds = new Set(existingEvents.map((event) => event.id))
  const newEvents = acceptedEvents.filter((event) => !knownIds.has(event.id))
  return [...existingEvents, ...newEvents]
}
