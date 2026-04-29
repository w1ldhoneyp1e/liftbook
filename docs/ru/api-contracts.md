# API-контракты

Документ фиксирует первую backend-границу Liftbook.

API skeleton намеренно маленький. Это еще не production auth или sync, но он задает форму, к которой может расти offline-first клиент.

## Base URL

Локальная разработка:

```text
http://localhost:4000
```

## Health

```http
GET /health
```

Ответ:

```json
{
  "ok": true,
  "service": "liftbook-api",
  "time": "2026-04-27T12:00:00.000Z"
}
```

## Гостевой аккаунт

Web app может вызвать endpoint из Settings. Workout flow должен продолжать работать, если запрос упал или пользователь никогда не создавал аккаунт.

```http
POST /v1/auth/guest
Content-Type: application/json
```

Запрос:

```json
{
  "clientId": "local-device-id",
  "locale": "ru"
}
```

Ответ:

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

## Отправка локальных изменений

Web app может вручную отправить pending local records из Settings после появления guest account session.

Текущий клиент также может запускать такой же push автоматически, когда возвращается сеть и guest session уже существует.

```http
POST /v1/sync/push
Content-Type: application/json
Authorization: Bearer dev_token
```

Запрос:

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

Поддерживаемые `entityType`:

- `exercise`
- `workoutDay`
- `exerciseEntry`
- `userSettings`

Поддерживаемые `operation`:

- `upsert`
- `delete`

Ответ:

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

## Получение удаленных изменений

```http
GET /v1/sync/pull?cursor=2026-04-27T12:00:01.000Z&clientId=local-device-id
Authorization: Bearer dev_token
```

`clientId` обозначает устройство, которое запрашивает изменения. API не должен возвращать этому устройству его же собственные sync events.

Ответ:

```json
{
  "changes": [],
  "cursor": "2026-04-27T12:00:01.000Z",
  "nextCursor": "2026-04-27T12:05:00.000Z",
  "serverTime": "2026-04-27T12:05:00.000Z"
}
```

## Заметки

- Создание гостевого аккаунта — placeholder для будущей реальной identity.
- Access tokens сейчас development-only placeholders.
- Sync data хранится только в памяти процесса и сбрасывается при перезапуске API.
- Soft deletes с клиента должны отправляться как `delete`.
- Текущий web client помечает принятые local records как `synced` и сохраняет `nextCursor` в локальную account session.
