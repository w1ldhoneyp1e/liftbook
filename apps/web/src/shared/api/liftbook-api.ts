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
    kind: "guest" | "account"
    email?: string
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

type AuthAccountResponse = GuestAccountResponse

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

type PullSyncResponse = {
  changes: Array<
    SyncChange & {
      id: string
      clientId: string
      serverTime: string
      serverVersion: string
    }
  >
  cursor: string | null
  nextCursor: string
  hasMore: boolean
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

export async function registerAccount({
  accessToken,
  email,
  locale,
  password,
}: {
  accessToken?: string | null
  email: string
  locale: Locale
  password: string
}) {
  const response = await fetch(`${apiBaseUrl}/v1/auth/register`, {
    method: "POST",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId: getClientId(),
      email,
      locale,
      password,
    }),
  })

  if (!response.ok) {
    throw new Error(await getRequestErrorMessage(response, "Registration failed"))
  }

  return (await response.json()) as AuthAccountResponse
}

export async function loginAccount({
  email,
  password,
}: {
  email: string
  password: string
}) {
  const response = await fetch(`${apiBaseUrl}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId: getClientId(),
      email,
      password,
    }),
  })

  if (!response.ok) {
    throw new Error(await getRequestErrorMessage(response, "Login failed"))
  }

  return (await response.json()) as AuthAccountResponse
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

export async function pullSyncChanges({
  accessToken,
  cursor,
}: {
  accessToken: string
  cursor?: string | null
}) {
  const searchParams = new URLSearchParams({
    clientId: getClientId(),
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

  if (!response.ok) {
    throw new Error(`Sync pull request failed: ${response.status}`)
  }

  return (await response.json()) as PullSyncResponse
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

async function getRequestErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string }
    return payload.error || `${fallback}: ${response.status}`
  } catch {
    return `${fallback}: ${response.status}`
  }
}
