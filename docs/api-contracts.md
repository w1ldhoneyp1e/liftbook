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
GET /v1/sync/pull?cursor=2026-04-27T12:00:01.000Z
Authorization: Bearer dev_token
```

Response:

```json
{
  "changes": [],
  "cursor": "2026-04-27T12:00:01.000Z",
  "nextCursor": "2026-04-27T12:05:00.000Z",
  "serverTime": "2026-04-27T12:05:00.000Z"
}
```

## Notes

- Guest account creation is a placeholder for future real identity.
- Access tokens are development-only placeholders.
- Sync responses currently accept valid changes without persistence.
- Soft deletes from the client should be sent as `delete` operations.
