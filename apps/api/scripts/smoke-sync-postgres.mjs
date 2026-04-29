const apiBaseUrl = process.env.LIFTBOOK_API_URL ?? "http://localhost:4000"

const userAClientId = `smoke-user-a-${Date.now()}`
const userBClientId = `smoke-user-b-${Date.now()}`
const pullClientA = `${userAClientId}-reader`
const pullClientB = `${userBClientId}-reader`
const sharedLocalId = `shared_local_${Date.now()}`

const userA = await createGuestAccount(userAClientId, "en")
const userB = await createGuestAccount(userBClientId, "ru")

const pushA = await pushSyncChange({
  accessToken: userA.session.accessToken,
  clientId: userAClientId,
  localId: sharedLocalId,
  date: "2026-04-30",
})

const pushB = await pushSyncChange({
  accessToken: userB.session.accessToken,
  clientId: userBClientId,
  localId: sharedLocalId,
  date: "2026-05-01",
})

assert(isSequenceCursor(pushA.nextCursor), "user A push cursor should be sequence-based")
assert(isSequenceCursor(pushB.nextCursor), "user B push cursor should be sequence-based")

const initialPullA = await pullSyncChanges({
  accessToken: userA.session.accessToken,
  clientId: pullClientA,
})
const initialPullB = await pullSyncChanges({
  accessToken: userB.session.accessToken,
  clientId: pullClientB,
})

assert(
  initialPullA.changes.length === 1,
  "user A should receive exactly one remote change"
)
assert(
  initialPullB.changes.length === 1,
  "user B should receive exactly one remote change"
)
assert(
  initialPullA.changes[0].payload?.date === "2026-04-30",
  "user A should receive only its own synced payload"
)
assert(
  initialPullB.changes[0].payload?.date === "2026-05-01",
  "user B should receive only its own synced payload"
)
assert(
  initialPullA.nextCursor === initialPullA.changes[0].cursor,
  "user A pull cursor should advance to the event cursor"
)
assert(
  initialPullB.nextCursor === initialPullB.changes[0].cursor,
  "user B pull cursor should advance to the event cursor"
)

const repeatPullA = await pullSyncChanges({
  accessToken: userA.session.accessToken,
  clientId: pullClientA,
  cursor: initialPullA.nextCursor,
})
const repeatPullB = await pullSyncChanges({
  accessToken: userB.session.accessToken,
  clientId: pullClientB,
  cursor: initialPullB.nextCursor,
})

assert(
  repeatPullA.changes.length === 0,
  "user A repeat pull should have no new changes"
)
assert(
  repeatPullB.changes.length === 0,
  "user B repeat pull should have no new changes"
)
assert(
  repeatPullA.nextCursor === initialPullA.nextCursor,
  "user A repeat pull should preserve cursor"
)
assert(
  repeatPullB.nextCursor === initialPullB.nextCursor,
  "user B repeat pull should preserve cursor"
)

console.log("Postgres sync smoke test passed.")

async function createGuestAccount(clientId, locale) {
  const response = await fetch(`${apiBaseUrl}/v1/auth/guest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId,
      locale,
    }),
  })

  assert(response.ok, `guest auth failed with status ${response.status}`)
  return response.json()
}

async function pushSyncChange({ accessToken, clientId, localId, date }) {
  const response = await fetch(`${apiBaseUrl}/v1/sync/push`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId,
      cursor: null,
      changes: [
        {
          localId,
          entityType: "workoutDay",
          operation: "upsert",
          updatedAt: new Date().toISOString(),
          payload: {
            id: localId,
            date,
          },
        },
      ],
    }),
  })

  assert(response.ok, `sync push failed with status ${response.status}`)
  return response.json()
}

async function pullSyncChanges({ accessToken, clientId, cursor }) {
  const searchParams = new URLSearchParams({
    clientId,
  })

  if (cursor) {
    searchParams.set("cursor", cursor)
  }

  const response = await fetch(
    `${apiBaseUrl}/v1/sync/pull?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  assert(response.ok, `sync pull failed with status ${response.status}`)
  return response.json()
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function isSequenceCursor(cursor) {
  return typeof cursor === "string" && /^[1-9]\d*$/.test(cursor)
}
