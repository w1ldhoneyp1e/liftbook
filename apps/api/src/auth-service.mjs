import {
	createHash,
	randomBytes,
	randomUUID,
	scryptSync,
	timingSafeEqual,
} from 'node:crypto'

export function createAuthService(store, options = {}) {
	const mailService = options.mailService
	const appOrigin = options.appOrigin ?? null

	return {
		async createGuestAccount(body) {
			const now = new Date().toISOString()
			const userId = `guest_${randomUUID()}`
			const clientId = typeof body.clientId === 'string'
				? body.clientId
				: null
			const locale = body.locale === 'ru'
				? 'ru'
				: 'en'
			const accessToken = createDevelopmentToken(userId, now)
			const expiresAt = addDays(new Date(), 30).toISOString()
			const {user, session} = await store.createGuestSession({
				clientId,
				locale,
				now,
				userId,
				accessToken,
				expiresAt,
			})

			return {
				user: toUserPayload(user),
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
		async registerAccount(body, existingSession, requestOrigin) {
			const email = normalizeEmail(body.email)
			const password = typeof body.password === 'string'
				? body.password
				: ''
			const clientId = typeof body.clientId === 'string'
				? body.clientId
				: null
			const locale = body.locale === 'ru'
				? 'ru'
				: 'en'

			if (!email) {
				throw createHttpError(400, 'Email is required')
			}

			if (!isValidEmail(email)) {
				throw createHttpError(400, 'Email format is invalid')
			}

			if (password.length < 8) {
				throw createHttpError(400, 'Password must be at least 8 characters long')
			}

			const existingAccount = await store.getAccountByEmail(email)

			if (existingAccount) {
				throw createHttpError(409, 'Email is already registered')
			}

			if (existingSession) {
				const existingUser = await store.getUserById(existingSession.userId)

				if (!existingUser) {
					throw createHttpError(401, 'Unauthorized')
				}

				if (existingUser.email) {
					throw createHttpError(409, 'Current account is already registered')
				}
			}

			const now = new Date().toISOString()
			const userId = existingSession?.userId ?? `user_${randomUUID()}`
			const passwordSalt = randomBytes(16).toString('hex')
			const passwordHash = hashPassword(password, passwordSalt)
			const accessToken = createDevelopmentToken(userId, now)
			const expiresAt = addDays(new Date(), 30).toISOString()
			let user
			let session

			try {
				({user, session} = await store.registerAccount({
					accessToken,
					clientId,
					email,
					existingUserId: existingSession?.userId ?? null,
					expiresAt,
					locale,
					now,
					passwordHash,
					passwordSalt,
					userId,
				}))
			}
			catch (error) {
				if (isEmailConflictError(error)) {
					throw createHttpError(409, 'Email is already registered')
				}

				throw error
			}

			const verification = await issueVerificationEmail({
				appOrigin,
				locale,
				mailService,
				requestOrigin,
				store,
				user,
			})

			return {
				user: toUserPayload(user),
				session: {
					accessToken: session.accessToken,
					tokenType: session.tokenType,
					expiresAt: session.expiresAt,
				},
				verificationEmailSent: verification.sent,
				sync: {
					cursor: null,
				},
			}
		},
		async loginAccount(body) {
			const email = normalizeEmail(body.email)
			const password = typeof body.password === 'string'
				? body.password
				: ''
			const clientId = typeof body.clientId === 'string'
				? body.clientId
				: null

			if (!email || !password) {
				throw createHttpError(400, 'Email and password are required')
			}

			const account = await store.getAccountByEmail(email)

			if (
				!account?.passwordHash
        || !account.passwordSalt
        || !verifyPassword(password, account.passwordSalt, account.passwordHash)
			) {
				throw createHttpError(401, 'Email or password is incorrect')
			}

			const now = new Date().toISOString()
			const accessToken = createDevelopmentToken(account.id, now)
			const expiresAt = addDays(new Date(), 30).toISOString()
			const {user, session} = await store.createSessionForUser({
				accessToken,
				clientId,
				expiresAt,
				now,
				userId: account.id,
			})

			return {
				user: toUserPayload(user),
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
		async resendVerificationEmail(session, requestOrigin) {
			if (!session) {
				throw createHttpError(401, 'Unauthorized')
			}

			const user = await store.getUserById(session.userId)

			if (!user?.email) {
				throw createHttpError(400, 'Email account is required')
			}

			if (user.emailVerifiedAt) {
				return {
					sent: false,
					alreadyVerified: true,
				}
			}

			const latestToken = await store.getLatestEmailVerificationTokenForUser(user.id)

			if (latestToken) {
				const elapsedMs
          = Date.now() - Date.parse(latestToken.createdAt)
				if (Number.isFinite(elapsedMs) && elapsedMs < 60_000) {
					throw createHttpError(429, 'Verification email was sent recently')
				}
			}

			const verification = await issueVerificationEmail({
				appOrigin,
				locale: user.locale ?? 'en',
				mailService,
				requestOrigin,
				store,
				user,
			})

			if (!verification.sent) {
				throw createHttpError(502, 'Failed to send verification email')
			}

			return {
				sent: true,
				alreadyVerified: false,
			}
		},
		async verifyEmail(body) {
			const token = typeof body.token === 'string'
				? body.token.trim()
				: ''

			if (!token) {
				throw createHttpError(400, 'Token is required')
			}

			const user = await store.verifyEmailByTokenHash({
				now: new Date().toISOString(),
				tokenHash: hashVerificationToken(token),
			})

			if (!user) {
				throw createHttpError(400, 'Verification token is invalid or expired')
			}

			return {
				user: toUserPayload(user),
				verified: true,
			}
		},
		async getSession(request) {
			return getSessionFromRequest(store, request)
		},
		async requireSession(request) {
			return getSessionFromRequest(store, request)
		},
	}
}

function createDevelopmentToken(userId, issuedAt) {
	return `dev_${createHash('sha256').update(`${userId}:${issuedAt}`)
.digest('hex')}`
}

function addDays(date, days) {
	const nextDate = new Date(date)
	nextDate.setDate(nextDate.getDate() + days)
	return nextDate
}

async function getSessionFromRequest(store, request) {
	const authorization = request.headers.authorization

	if (!authorization?.startsWith('Bearer ')) {
		return null
	}

	const accessToken = authorization.slice('Bearer '.length)
	const session = await store.getSessionByAccessToken(accessToken)

	if (!session) {
		return null
	}

	if (new Date(session.expiresAt).getTime() <= Date.now()) {
		return null
	}

	await store.touchSession({
		accessToken,
		now: new Date().toISOString(),
	})

	return session
}

function normalizeEmail(value) {
	return typeof value === 'string'
		? value.trim().toLowerCase()
		: ''
}

function isValidEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function hashPassword(password, salt) {
	return scryptSync(password, salt, 64).toString('hex')
}

function hashVerificationToken(token) {
	return createHash('sha256').update(token)
		.digest('hex')
}

function verifyPassword(password, salt, expectedHash) {
	const actualHash = hashPassword(password, salt)

	return timingSafeEqual(
		Buffer.from(actualHash, 'hex'),
		Buffer.from(expectedHash, 'hex'),
	)
}

function createHttpError(statusCode, message) {
	const error = new Error(message)
	error.statusCode = statusCode
	return error
}

function isEmailConflictError(error) {
	return (
		error
    && typeof error === 'object'
    && (error.code === '23505'
      || (typeof error.message === 'string'
        && error.message.toLowerCase().includes('already registered')))
	)
}

function toUserPayload(user) {
	return {
		id: user.id,
		kind: user.kind,
		email: user.email,
		emailVerified: Boolean(user.emailVerifiedAt),
		createdAt: user.createdAt,
	}
}

async function issueVerificationEmail({
	appOrigin,
	locale,
	mailService,
	requestOrigin,
	store,
	user,
}) {
	if (!user.email || !mailService) {
		return {sent: false}
	}

	const rawToken = randomBytes(32).toString('hex')
	const now = new Date()
	const verifyUrl = `${resolveAppOrigin(appOrigin, requestOrigin)}/auth/verify-email?token=${rawToken}`

	await store.createEmailVerificationToken({
		id: `verify_${randomUUID()}`,
		userId: user.id,
		tokenHash: hashVerificationToken(rawToken),
		email: user.email,
		expiresAt: addDays(now, 2).toISOString(),
		usedAt: null,
		createdAt: now.toISOString(),
	})

	try {
		await mailService.sendVerificationEmail({
			email: user.email,
			locale,
			verifyUrl,
		})
		return {sent: true}
	}
	catch (error) {
		console.error('Failed to send verification email', error)
		return {sent: false}
	}
}

function resolveAppOrigin(appOrigin, requestOrigin) {
	return appOrigin ?? requestOrigin
}
