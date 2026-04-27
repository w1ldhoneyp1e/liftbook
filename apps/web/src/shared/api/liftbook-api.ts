import type { Locale } from "@/shared/domain/types"

export type SyncEntityType =
  | "exercise"
  | "workoutDay"
  | "exerciseEntry"
  | "userSettings"

export type SyncOperation = "upsert" | "delete"

export type SyncChange = {
  localId: string
  entityType: SyncEntityType
  operation: SyncOperation
  updatedAt: string
  payload: unknown
}

type GuestAccountResponse = {
  user: {
    id: string
    kind: "guest"
    createdAt: string
  }
  session: {
    accessToken: string
    tokenType: "Bearer"
    expiresAt: string
  }
  sync: {
    cursor: string | null
  }
}

type PushSyncResponse = {
  accepted: Array<{
    localId: string
    entityType: SyncEntityType
    operation: SyncOperation
    serverVersion: string
    status: "accepted"
  }>
  conflicts: unknown[]
  nextCursor: string
  serverTime: string
}

const apiBaseUrl =
  process.env.NEXT_PUBLIC_LIFTBOOK_API_URL ?? "http://localhost:4000"

export async function createGuestAccount(locale: Locale) {
  const response = await fetch(`${apiBaseUrl}/v1/auth/guest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId: getClientId(),
      locale,
    }),
  })

  if (!response.ok) {
    throw new Error(`Guest account request failed: ${response.status}`)
  }

  return (await response.json()) as GuestAccountResponse
}

export async function pushSyncChanges({
  accessToken,
  changes,
  cursor,
}: {
  accessToken: string
  changes: SyncChange[]
  cursor?: string | null
}) {
  const response = await fetch(`${apiBaseUrl}/v1/sync/push`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      changes,
      clientId: getClientId(),
      cursor: cursor ?? null,
    }),
  })

  if (!response.ok) {
    throw new Error(`Sync push request failed: ${response.status}`)
  }

  return (await response.json()) as PushSyncResponse
}

function getClientId() {
  const storageKey = "liftbook.clientId"
  const existingClientId = window.localStorage.getItem(storageKey)

  if (existingClientId) {
    return existingClientId
  }

  const clientId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `client_${crypto.randomUUID()}`
      : `client_${Date.now()}_${Math.random().toString(36).slice(2)}`

  window.localStorage.setItem(storageKey, clientId)
  return clientId
}
