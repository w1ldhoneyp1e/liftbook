import type { Locale } from "@/shared/domain/types"

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
