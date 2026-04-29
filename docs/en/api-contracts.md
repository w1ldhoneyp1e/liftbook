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
  "time": "2026-04-27T12:00:00.000Z"
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
  "nextCursor": "2026-04-27T12:00:01.000Z",
  "serverTime": "2026-04-27T12:00:01.000Z"
}
```

## Pull Remote Changes

```http
GET /v1/sync/pull?cursor=2026-04-27T12:00:01.000Z&clientId=local-device-id
Authorization: Bearer dev_token
```

`clientId` identifies the requesting device. The API should not echo that device's own sync events back in pull results.

Response:

```json
{
  "changes": [],
  "cursor": "2026-04-27T12:00:01.000Z",
  "nextCursor": "2026-04-27T12:00:01.000Z",
  "serverTime": "2026-04-27T12:05:00.000Z"
}
```

If there are no new changes, `nextCursor` should stay equal to the incoming `cursor`. This lets the client safely run automatic `pull` without creating needless loops.

## Notes

- Guest account creation is a placeholder for future real identity.
- Access tokens are development-only placeholders.
- Sync data is currently stored in memory only and resets when the API process restarts.
- Soft deletes from the client should be sent as `delete` operations.
- The current web client marks accepted local records as `synced` and stores `nextCursor` on the local account session.
