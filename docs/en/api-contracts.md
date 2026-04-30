# API Contracts

This document captures the first backend boundary for Liftbook.

The API skeleton is intentionally small. It is not a production auth or sync implementation yet; it defines the shape that the offline-first client can grow toward.

## Base URL

Local development:

```text
http://localhost:4000
```

## Health

```http
GET /health
```

Response:

```json
{
  "ok": true,
  "service": "liftbook-api",
  "time": "2026-04-27T12:00:00.000Z",
  "store": {
    "storage": "file",
    "filePath": "/absolute/path/to/apps/api/.data/store.json",
    "users": 1,
    "sessions": 1,
    "syncEvents": 3
  }
}
```

## Guest Account

The web app can call this endpoint from Settings. The workout flow must continue working if the request fails or the user never creates an account.

```http
POST /v1/auth/guest
Content-Type: application/json
```

Request:

```json
{
  "clientId": "local-device-id",
  "locale": "ru"
}
```

Response:

```json
{
  "user": {
    "id": "guest_uuid",
    "kind": "guest",
    "clientId": "local-device-id",
    "locale": "ru",
    "createdAt": "2026-04-27T12:00:00.000Z"
  },
  "session": {
    "accessToken": "dev_token",
    "tokenType": "Bearer",
    "expiresAt": "2026-05-27T12:00:00.000Z"
  },
  "sync": {
    "cursor": null
  }
}
```

## Push Local Changes

The web app can send pending local records manually from Settings after a guest account session exists.

The current client may also trigger sync automatically when the device is online and a guest session is present. If there are no pending local records, the client may still perform `pull` to fetch changes from other devices.

```http
POST /v1/sync/push
Content-Type: application/json
Authorization: Bearer dev_token
```

Request:

```json
{
  "clientId": "local-device-id",
  "cursor": null,
  "changes": [
    {
      "localId": "entry_123",
      "entityType": "exerciseEntry",
      "operation": "upsert",
      "updatedAt": "2026-04-27T12:00:00.000Z",
      "payload": {}
    }
  ]
}
```

Supported `entityType` values:

- `exercise`
- `workoutDay`
- `exerciseEntry`
- `userSettings`

Supported `operation` values:

- `upsert`
- `delete`

The server treats a repeated submission of the same logical change as an idempotent retry. If the client sends the same `entityType + localId + operation + updatedAt + payload` again for the same user and device, the backend reuses the existing sync event instead of creating a duplicate.

`push` is capped at 50 changes per request. Empty batches and invalid ISO `updatedAt` values should return `400`.

Response:

```json
{
  "accepted": [
    {
      "localId": "entry_123",
      "entityType": "exerciseEntry",
      "operation": "upsert",
      "serverVersion": "hash",
      "status": "accepted"
    }
  ],
  "conflicts": [],
  "nextCursor": "1",
  "serverTime": "2026-04-27T12:00:01.000Z"
}
```

## Pull Remote Changes

```http
GET /v1/sync/pull?cursor=1&clientId=local-device-id
Authorization: Bearer dev_token
```

`clientId` identifies the requesting device. The API should not echo that device's own sync events back in pull results.

Response:

```json
{
  "changes": [],
  "cursor": "1",
  "nextCursor": "1",
  "hasMore": false,
  "serverTime": "2026-04-27T12:05:00.000Z"
}
```

If there are no new changes, `nextCursor` should stay equal to the incoming `cursor`. This lets the client safely run automatic `pull` without creating needless loops.

If there are more changes than the server returns in one response, the API sets `hasMore: true`. The client should then immediately continue with the returned `nextCursor` until `hasMore` becomes `false`.

The client should treat `cursor` as an opaque server token. In the current backend it is derived from sync event order, not from wall-clock time.

## Notes

- Guest account creation is a placeholder for future real identity.
- Access tokens are development-only placeholders.
- Guest sessions and sync data are currently stored in a local JSON file and survive API restarts.
- Soft deletes from the client should be sent as `delete` operations.
- The current web client marks accepted local records as `synced` and stores `nextCursor` on the local account session.
- `push` and `pull` require a valid `Bearer` token from the guest session.
