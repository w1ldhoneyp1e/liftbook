# Email Confirmation

Этот документ описывает, как добавить в Liftbook подтверждение email после регистрации так, чтобы реализацию можно было отдать следующему агенту почти без дополнительного контекста.

## Цель

После регистрации пользователь должен:

1. создать аккаунт по email и паролю;
2. получить письмо с ссылкой подтверждения;
3. открыть ссылку;
4. получить подтвержденный email в своем аккаунте;
5. после этого считаться полноценным подтвержденным account user.

Подтверждение email нужно не ради “галочки”, а чтобы:

- не держать неподтвержденные аккаунты как полноценные навсегда;
- подготовить основу под reset password;
- иметь нормальную основу для дальнейших email-фич;
- не смешивать guest identity и полноценный email account без подтверждения.

## Рекомендуемый провайдер

Для российского сценария сейчас самый практичный стартовый вариант:

### Основной вариант: Mailganer

Почему:

- есть SMTP и API;
- есть бесплатный тариф для транзакционного трафика;
- лимит бесплатного тарифа заметно выше, чем у части конкурентов;
- это российский сервис и он прямо позиционирует SMTP/API как транспорт для сервисных писем.

Что берем за опорные факты:

- Mailganer пишет, что SMTP/API-транспорт подходит для транзакционных писем;
- на странице цены у SMTP-транспорта указан бесплатный тариф до `1000` отправок в месяц;
- у Mailganer есть документация API.

### Резервный вариант: RuSender

Подходит как запасной путь, если Mailganer чем-то не зайдет.

Плюсы:

- российский сервис;
- есть API и SMTP;
- есть бесплатный тариф API+SMTP.

Минусы:

- бесплатный лимит меньше: `100` отправок в месяц.

### Что не брать первым вариантом

#### DashaMail

Не лучший старт для этой задачи, потому что:

- у них есть транзакционный API/SMTP;
- но на бесплатном тарифе API по умолчанию отключен и его надо отдельно просить включить.

Для MVP это лишнее трение.

## Что делаем в продукте

### Поведение регистрации

Старый поток:

1. пользователь вводит email + password;
2. сразу получает полноценный account session.

Новый поток:

1. пользователь вводит email + password;
2. backend создает account в состоянии `email unverified`;
3. backend создает verification token;
4. backend отправляет письмо;
5. UI показывает экран/состояние:
   - `Проверьте почту`
   - `Мы отправили ссылку подтверждения на <email>`
6. пользователь кликает по ссылке;
7. backend подтверждает email;
8. пользователь возвращается в приложение уже как verified account.

## Scope первой версии

Входит:

- email verification после register;
- resend confirmation email;
- mark user as verified;
- frontend-state для `ожидает подтверждения`;
- защищенный verify token flow;
- базовая защита от повторного использования токена.

Не входит:

- password reset;
- смена email;
- magic link login;
- двойной opt-in маркетинговых рассылок;
- подтверждение через code input;
- rate limiting по IP на production-grade уровне.

## Изменения в модели данных

### Users

В `users` нужно добавить:

- `email_verified_at timestamptz null`

Смысл:

- `null` -> email не подтвержден;
- timestamp -> email подтвержден.

### Email verification tokens

Добавить новую таблицу, например:

`email_verification_tokens`

Поля:

- `id text primary key`
- `user_id text not null`
- `token_hash text not null`
- `email text not null`
- `expires_at timestamptz not null`
- `used_at timestamptz null`
- `created_at timestamptz not null`

Индексы:

- по `user_id`
- по `expires_at`

Почему хранить `token_hash`, а не сырой токен:

- если утечет БД, сырые verify links не будут готовы к использованию.

## Backend contract

### 1. Register

`POST /v1/auth/register`

Меняется поведение:

- account создается как `kind = account`, но еще без подтвержденного email;
- response должен явно сообщать, что email не подтвержден.

Пример полезного ответа:

```json
{
  "user": {
    "id": "user_123",
    "kind": "account",
    "email": "user@example.com",
    "emailVerified": false,
    "createdAt": "..."
  },
  "session": {
    "accessToken": "...",
    "tokenType": "Bearer",
    "expiresAt": "..."
  },
  "sync": {
    "cursor": null
  }
}
```

Важно:

- сессию можно оставить сразу после регистрации;
- но пользователь должен считаться `unverified account`.

Это лучше, чем блокировать сессию полностью, потому что текущая модель Liftbook уже завязана на `guest -> register`.

### 2. Resend verification

Новый endpoint:

`POST /v1/auth/verify-email/resend`

Требует действующую session.

Поведение:

- если email уже подтвержден, вернуть `204` или success-without-action;
- если email не подтвержден, создать новый token и отправить письмо;
- ограничить частоту отправки.

Минимальный MVP-limit:

- не чаще 1 письма в 60 секунд на пользователя.

### 3. Verify email

Новый endpoint:

`POST /v1/auth/verify-email`

Body:

```json
{
  "token": "raw-token-from-link"
}
```

Поведение:

1. хешируем входной token;
2. ищем запись;
3. проверяем:
   - token существует;
   - не истек;
   - не использован;
4. отмечаем:
   - `users.email_verified_at = now()`
   - `email_verification_tokens.used_at = now()`
5. инвалидируем остальные verify tokens этого пользователя.

Ответ:

```json
{
  "verified": true
}
```

### 4. Session payload

Где бы ни возвращался пользователь, в payload нужно добавить:

- `emailVerified: boolean`

Это нужно для фронта, чтобы:

- показывать badge / reminder;
- знать, нужно ли предлагать resend.

## Письмо

### От кого

Нужен адрес типа:

- `hello@liftbook.ru`
или
- `auth@liftbook.ru`

Для MVP я бы брал:

- `auth@liftbook.ru`

### Тема

RU:

- `Подтвердите email в Liftbook`

EN:

- `Confirm your email in Liftbook`

### Содержимое

Минимально:

- заголовок;
- короткий текст;
- кнопка;
- plain fallback link;
- срок жизни ссылки.

Пример:

- `Подтвердите ваш email, чтобы завершить регистрацию в Liftbook`
- кнопка `Подтвердить email`

## Verification link

Ссылка должна вести не сразу на API, а на web route.

Например:

`https://liftbook.ru/auth/verify-email?token=...`

Почему так лучше:

- можно красиво показать состояние `подтверждаем...`;
- можно показать ошибки `ссылка истекла`;
- можно дать `отправить письмо заново`.

### Frontend route

Новый route в web:

- `/auth/verify-email`

Поведение страницы:

1. достать `token` из query;
2. вызвать `POST /v1/auth/verify-email`;
3. показать одно из состояний:
   - `success`
   - `expired`
   - `invalid`
4. на success:
   - обновить local session state;
   - предложить `Продолжить`.

## UI changes

### Auth popup / popover

Если пользователь зарегистрировался, но не подтвердил email:

- в account UI показать статус:
  - `Email не подтвержден`
- показать кнопку:
  - `Отправить письмо еще раз`

Если подтвержден:

- показать:
  - `Email подтвержден`

### Settings / account section

Не перегружать.

Достаточно:

- email
- статус подтверждения
- resend action только если `unverified`

## Логика guest -> register

Это важный сценарий для Liftbook.

Что должно происходить:

1. пользователь живет как guest;
2. жмет register;
3. account создается на базе текущего `existingSession.userId`;
4. email становится `unverified`;
5. sync-данные остаются привязаны к тому же user;
6. после подтверждения email user становится verified.

То есть:

- **guest data не должны потеряться**
- verification не должен создавать нового отдельного пользователя поверх текущего guest user.

## Логика login

На первой версии вход по email/password можно **не блокировать**, даже если email не подтвержден.

Но UI должен:

- показать, что email не подтвержден;
- продолжать подталкивать к verify;
- давать resend.

Почему так:

- это меньше ломает текущий auth flow;
- не создаст лишних тупиков в MVP.

Позже можно ужесточить правила, если понадобится.

## Provider abstraction

Нужен тонкий слой, например:

`apps/api/src/email-service.mjs`

Контракт:

- `sendVerificationEmail({ email, locale, verifyUrl })`

Не надо размазывать Mailganer SDK/HTTP прямо по auth-service.

Нужен отдельный adapter, например:

- `apps/api/src/mail-providers/mailganer.mjs`

И конфиг:

- `LIFTBOOK_EMAIL_PROVIDER=mailganer`
- `MAILGANER_API_KEY=...`
- `MAILGANER_FROM_EMAIL=auth@liftbook.ru`
- `MAILGANER_FROM_NAME=Liftbook`
- `LIFTBOOK_WEB_BASE_URL=https://liftbook.ru`

## Реализация через Mailganer

Для MVP я бы делал через их HTTP API, а не через SMTP.

Почему:

- лучше контроль ошибок;
- проще трекать, что отправка не удалась;
- проще потом добавить retry и structured logging.

SMTP можно оставить fallback-вариантом на потом.

## Ошибки и состояния

Нужно уметь обрабатывать:

- письмо не отправилось;
- token истек;
- token уже использован;
- token не найден;
- provider временно недоступен.

Минимальные frontend сообщения:

- `Не удалось отправить письмо`
- `Ссылка подтверждения истекла`
- `Ссылка недействительна`
- `Email подтвержден`

## Security notes

1. token хранить в БД только в виде hash;
2. token делать случайным и длинным;
3. срок жизни:
   - `24 часа`
4. после успешного использования помечать как `used`;
5. resend должен перевыпускать новый token;
6. verify endpoint не должен раскрывать лишнюю информацию о чужих аккаунтах.

## Порядок реализации

### Итерация 1. Backend data model

- миграция `users.email_verified_at`
- новая таблица `email_verification_tokens`
- store methods

### Итерация 2. Email service

- email provider abstraction
- Mailganer adapter
- verify email template builder

### Итерация 3. Auth API

- register returns `emailVerified`
- resend endpoint
- verify endpoint

### Итерация 4. Web flow

- `/auth/verify-email`
- auth popup states
- resend action

### Итерация 5. Final pass

- ручной прогон:
  - guest -> register -> verify
  - fresh account -> verify
  - resend
  - expired token

## Definition of Done

Считать задачу выполненной можно, если:

1. новый пользователь получает письмо подтверждения;
2. ссылка подтверждает email;
3. статус подтверждения виден в UI;
4. guest -> register не теряет данные;
5. resend работает;
6. токен нельзя использовать бесконечно;
7. backend отправку писем делает через provider abstraction, а не напрямую из auth-service.
