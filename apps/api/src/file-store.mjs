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
      const accepted = changes.map((change) =>
        buildAcceptedChange({ userId, clientId, change, serverTime })
      ).map((event, index) => ({
        ...event,
        sequence: state.nextSequence + index,
        cursor: String(state.nextSequence + index),
      }))

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
        nextSequence: state.nextSequence + accepted.length,
        syncEvents: [...state.syncEvents, ...accepted],
        syncRecords: Array.from(nextRecords.values()),
      }

      return queuePersist().then(() => accepted)
    },
    async listSyncEvents({ userId, cursor, clientId }) {
      const parsedCursor = parseCursor(cursor)

      return state.syncEvents
        .filter((event) => event.userId === userId)
        .filter((event) =>
          parsedCursor === null
            ? !cursor || event.serverTime > cursor
            : (event.sequence ?? 0) > parsedCursor
        )
        .filter((event) => !clientId || event.clientId !== clientId)
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

function getStorageKey(record) {
  return record.storageKey ?? `${record.userId}:${record.recordKey}`
}

function withStorageKey(record) {
  return {
    ...record,
    storageKey: getStorageKey(record),
  }
}
