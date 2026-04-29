import { createHash, randomUUID } from "node:crypto"

export function createAuthService(store) {
  return {
    async createGuestAccount(body) {
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

      return {
        user,
        session: {
          accessToken: session.accessToken,
          tokenType: session.tokenType,
          expiresAt: session.expiresAt,
        },
        sync: {
          cursor: null,
        },
      }
    },
    async requireSession(request) {
      const authorization = request.headers.authorization

      if (!authorization?.startsWith("Bearer ")) {
        return null
      }

      const accessToken = authorization.slice("Bearer ".length)
      const session = await store.getSessionByAccessToken(accessToken)

      if (!session) {
        return null
      }

      if (new Date(session.expiresAt).getTime() <= Date.now()) {
        return null
      }

      return session
    },
  }
}

function createDevelopmentToken(userId, issuedAt) {
  return `dev_${createHash("sha256").update(`${userId}:${issuedAt}`).digest("hex")}`
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}
