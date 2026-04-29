import pg from "pg"

const { Pool } = pg

export async function createPostgresStore(options) {
  const databaseUrl = options?.databaseUrl ?? null

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required when LIFTBOOK_STORAGE_DRIVER=postgres"
    )
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  })

  await pool.query("select 1")

  return {
    async getHealthSummary() {
      const [users, devices, sessions, syncEvents, syncRecords] = await Promise.all([
        countRows(pool, "users"),
        countRows(pool, "devices"),
        countRows(pool, "sessions"),
        countRows(pool, "sync_events"),
        countRows(pool, "sync_records"),
      ])

      return {
        storage: "postgres",
        users,
        devices,
        sessions,
        syncEvents,
        syncRecords,
      }
    },
    async createGuestSession({
      clientId,
      locale,
      now,
      userId,
      accessToken,
      expiresAt,
    }) {
      const session = {
        id: `session_${userId}`,
        userId,
        accessToken,
        tokenType: "Bearer",
        expiresAt,
        createdAt: now,
        updatedAt: now,
      }
      const user = {
        id: userId,
        kind: "guest",
        clientId,
        locale,
        createdAt: now,
      }

      await withTransaction(pool, async (client) => {
        await client.query(
          `insert into users (id, kind, locale, created_at)
           values ($1, $2, $3, $4)`,
          [user.id, user.kind, user.locale, user.createdAt]
        )

        if (clientId) {
          await client.query(
            `insert into devices (user_id, client_id, created_at, updated_at)
             values ($1, $2, $3, $4)
             on conflict (user_id, client_id)
             do update set updated_at = excluded.updated_at`,
            [user.id, clientId, now, now]
          )
        }

        await client.query(
          `insert into sessions (id, user_id, access_token, token_type, expires_at, created_at, updated_at)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [
            session.id,
            session.userId,
            session.accessToken,
            session.tokenType,
            session.expiresAt,
            session.createdAt,
            session.updatedAt,
          ]
        )
      })

      return {
        user,
        session,
      }
    },
    async getSessionByAccessToken(accessToken) {
      const result = await pool.query(
        `select id, user_id, access_token, token_type, expires_at, created_at, updated_at
         from sessions
         where access_token = $1
         limit 1`,
        [accessToken]
      )

      if (result.rows.length === 0) {
        return null
      }

      return mapSessionRow(result.rows[0])
    },
    async touchSession({ accessToken, now }) {
      await pool.query(
        `update sessions
         set updated_at = $2
         where access_token = $1`,
        [accessToken, now]
      )
    },
    async touchDevice({ userId, clientId, now }) {
      if (!clientId) {
        return
      }

      await pool.query(
        `insert into devices (user_id, client_id, created_at, updated_at)
         values ($1, $2, $3, $4)
         on conflict (user_id, client_id)
         do update set updated_at = excluded.updated_at`,
        [userId, clientId, now, now]
      )
    },
    async acceptSyncChanges({
      userId,
      clientId,
      changes,
      serverTime,
      buildAcceptedChange,
    }) {
      const accepted = changes.map((change) =>
        buildAcceptedChange({ userId, clientId, change, serverTime })
      )
      const persistedEvents = []

      await withTransaction(pool, async (client) => {
        if (clientId) {
          await client.query(
            `insert into devices (user_id, client_id, created_at, updated_at)
             values ($1, $2, $3, $4)
             on conflict (user_id, client_id)
             do update set updated_at = excluded.updated_at`,
            [userId, clientId, serverTime, serverTime]
          )
        }

        for (const event of accepted) {
          const insertEventResult = await client.query(
            `insert into sync_events (
               id,
               sequence,
               record_key,
               user_id,
               client_id,
               entity_type,
               local_id,
               operation,
               payload,
               server_time,
               server_version,
               updated_at
             ) values (
               $1, default, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11
             )
             returning sequence`,
            [
              event.id,
              event.recordKey,
              event.userId,
              event.clientId,
              event.entityType,
              event.localId,
              event.operation,
              JSON.stringify(event.payload),
              event.serverTime,
              event.serverVersion,
              event.updatedAt,
            ]
          )
          const persistedSequence = normalizeSequence(
            insertEventResult.rows[0]?.sequence
          )
          const persistedEventWithCursor = {
            ...event,
            sequence: persistedSequence,
            cursor:
              persistedSequence !== null
                ? String(persistedSequence)
                : event.serverTime,
          }
          persistedEvents.push(persistedEventWithCursor)

          if (event.operation === "delete") {
            await client.query(
              `delete from sync_records
               where record_key = $1 and user_id = $2`,
              [persistedEventWithCursor.recordKey, persistedEventWithCursor.userId]
            )
            continue
          }

          await client.query(
            `insert into sync_records (
               record_key,
               user_id,
               client_id,
               entity_type,
               local_id,
               operation,
               payload,
               server_time,
               server_version,
               updated_at
             ) values (
               $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10
             )
             on conflict (record_key)
             do update set
               user_id = excluded.user_id,
               client_id = excluded.client_id,
               entity_type = excluded.entity_type,
               local_id = excluded.local_id,
               operation = excluded.operation,
               payload = excluded.payload,
               server_time = excluded.server_time,
               server_version = excluded.server_version,
               updated_at = excluded.updated_at`,
            [
              persistedEventWithCursor.recordKey,
              persistedEventWithCursor.userId,
              persistedEventWithCursor.clientId,
              persistedEventWithCursor.entityType,
              persistedEventWithCursor.localId,
              persistedEventWithCursor.operation,
              JSON.stringify(persistedEventWithCursor.payload),
              persistedEventWithCursor.serverTime,
              persistedEventWithCursor.serverVersion,
              persistedEventWithCursor.updatedAt,
            ]
          )
        }
      })

      return persistedEvents
    },
    async listSyncEvents({ userId, cursor, clientId }) {
      const conditions = ["user_id = $1"]
      const values = [userId]
      const parsedCursor = parseCursor(cursor)

      if (parsedCursor !== null) {
        values.push(parsedCursor)
        conditions.push(`sequence > $${values.length}`)
      } else if (cursor) {
        values.push(cursor)
        conditions.push(`server_time > $${values.length}`)
      }

      if (clientId) {
        values.push(clientId)
        conditions.push(`client_id <> $${values.length}`)
      }

      const result = await pool.query(
        `select
           id,
           sequence,
           record_key,
           user_id,
           client_id,
           entity_type,
           local_id,
           operation,
           payload,
           server_time,
           server_version,
           updated_at
         from sync_events
         where ${conditions.join(" and ")}
         order by sequence asc nulls last, server_time asc`,
        values
      )

      return result.rows.map(mapSyncEventRow)
    },
  }
}

async function countRows(pool, tableName) {
  const result = await pool.query(`select count(*)::int as count from ${tableName}`)
  return result.rows[0]?.count ?? 0
}

async function withTransaction(pool, callback) {
  const client = await pool.connect()

  try {
    await client.query("begin")
    const result = await callback(client)
    await client.query("commit")
    return result
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
}

function mapSessionRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    accessToken: row.access_token,
    tokenType: row.token_type,
    expiresAt: row.expires_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function mapSyncEventRow(row) {
  const normalizedSequence = normalizeSequence(row.sequence)

  return {
    id: row.id,
    cursor:
      normalizedSequence !== null
        ? String(normalizedSequence)
        : row.server_time.toISOString(),
    recordKey: row.record_key,
    userId: row.user_id,
    clientId: row.client_id,
    entityType: row.entity_type,
    localId: row.local_id,
    operation: row.operation,
    payload: row.payload,
    serverTime: row.server_time.toISOString(),
    serverVersion: row.server_version,
    updatedAt: row.updated_at.toISOString(),
  }
}

function parseCursor(cursor) {
  if (!cursor) {
    return null
  }

  const parsed = Number(cursor)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeSequence(value) {
  if (value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
