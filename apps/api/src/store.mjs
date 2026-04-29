import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

const defaultStoreState = {
  version: 1,
  users: [],
  sessions: [],
  syncEvents: [],
  syncRecords: [],
}

export async function createStore() {
  const filePath = resolve(
    process.cwd(),
    process.env.LIFTBOOK_DATA_FILE ?? ".data/store.json"
  )
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
    filePath,
    getHealthSummary() {
      return {
        storage: "file",
        filePath,
        users: state.users.length,
        sessions: state.sessions.length,
        syncEvents: state.syncEvents.length,
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
        sessions: [...state.sessions, session],
      }

      return queuePersist().then(() => ({
        user,
        session,
      }))
    },
    getSessionByAccessToken(accessToken) {
      return (
        state.sessions.find((session) => session.accessToken === accessToken) ??
        null
      )
    },
    acceptSyncChanges({ clientId, changes, serverTime, buildAcceptedChange }) {
      const accepted = changes.map((change) =>
        buildAcceptedChange(clientId, change, serverTime)
      )

      const nextRecords = new Map(
        state.syncRecords.map((record) => [record.recordKey, record])
      )

      for (const event of accepted) {
        if (event.operation === "delete") {
          nextRecords.delete(event.recordKey)
          continue
        }

        nextRecords.set(event.recordKey, event)
      }

      state = {
        ...state,
        syncEvents: [...state.syncEvents, ...accepted],
        syncRecords: Array.from(nextRecords.values()),
      }

      return queuePersist().then(() => accepted)
    },
    listSyncEvents({ cursor, clientId }) {
      return state.syncEvents
        .filter((event) => !cursor || event.serverTime > cursor)
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
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      syncEvents: Array.isArray(parsed.syncEvents) ? parsed.syncEvents : [],
      syncRecords: Array.isArray(parsed.syncRecords) ? parsed.syncRecords : [],
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return defaultStoreState
    }

    throw error
  }
}
