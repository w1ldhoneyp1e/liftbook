# Деплой и релиз Liftbook

Дата: 2026-04-30

## Рекомендуемая схема релиза

Для текущего MVP 1 лучший путь такой:

- `apps/web` -> **Vercel**
- `apps/api` -> **Railway**
- PostgreSQL -> **Railway Postgres**

Это самый короткий путь до живого релиза:

- Next.js хорошо садится на Vercel;
- Railway удобно поднимает Node API и PostgreSQL;
- frontend и backend можно выпускать независимо;
- не нужно поднимать свой VPS, nginx и ручную базу прямо сейчас.

## Почему именно так

Фронтенд у нас на Next.js, а Vercel официально рекомендует нулеконфиг-деплой для Next.js.

Backend у нас отдельный и stateful:

- guest sessions;
- sync events;
- sync records;
- PostgreSQL migrations.

Railway здесь удобен тем, что:

- хорошо работает с JavaScript monorepo;
- умеет managed PostgreSQL;
- умеет pre-deploy command для миграций.

## Что важно про авторизацию после релиза

### Короткий ответ

**Да, данные пользователей можно сохранить**, если при добавлении настоящей авторизации мы будем не создавать нового отдельного пользователя поверх старого guest-данного, а **привязывать auth identity к уже существующему user record**.

### Как это должно работать

Сейчас backend уже хранит данные не “по анонимной куче”, а по `userId`.

Когда появится настоящая авторизация, есть правильный путь:

1. пользователь уже существует как `guest user`;
2. он логинится или регистрируется;
3. мы связываем его auth identity с текущим `userId`;
4. его workouts, settings и sync data остаются на месте.

То есть мы не “переносим” данные, а скорее **апгрейдим способ входа для уже существующего пользователя**.

### Важная оговорка

Если пользователь никогда не создавал guest account и жил только локально:

- данные останутся на **этом же устройстве**;
- их можно будет отправить в аккаунт после логина через локальную миграцию;
- но если устройство потеряно или данные браузера очищены до логина, backend-резервной копии у него не будет.

Иными словами:

- **guest account path можно безопасно мигрировать в полноценный аккаунт**;
- **local-only path без синка не дает серверной гарантии**.

## Переменные окружения

### Frontend (`apps/web`)

Обязательная:

```text
NEXT_PUBLIC_LIFTBOOK_API_URL=https://<your-api-domain>
```

Пример:

```text
NEXT_PUBLIC_LIFTBOOK_API_URL=https://liftbook-api.up.railway.app
```

### Backend (`apps/api`)

Минимально:

```text
PORT=4000
LIFTBOOK_STORAGE_DRIVER=postgres
DATABASE_URL=postgresql://...
LIFTBOOK_SYNC_PULL_PAGE_SIZE=100
LIFTBOOK_SESSION_RETENTION_DAYS=30
LIFTBOOK_SYNC_RETENTION_DAYS=90
```

`PORT` на платформе обычно выставляется автоматически, но backend уже умеет его читать.

## Рекомендуемый релизный путь

## 1. Подготовить Git-репозиторий

Перед деплоем убедиться, что в удаленном репозитории есть актуальный `main`.

Локальная проверка перед релизом:

```bash
pnpm lint
pnpm build
```

## 2. Задеплоить API и PostgreSQL в Railway

### Создать проект

В Railway:

1. создать новый project;
2. подключить GitHub-репозиторий;
3. добавить PostgreSQL service;
4. добавить service для `api`.

### Для monorepo

Так как у нас shared pnpm monorepo, для API-сервиса удобно оставить root репозитория `/` и задать команды явно.

Рекомендуемые команды для API-сервиса:

- Build Command:

```bash
pnpm --filter api build
```

- Start Command:

```bash
pnpm --filter api start
```

- Pre-Deploy Command:

```bash
pnpm --filter api db:migrate
```

### Переменные Railway для API

Задать:

```text
LIFTBOOK_STORAGE_DRIVER=postgres
LIFTBOOK_SYNC_PULL_PAGE_SIZE=100
LIFTBOOK_SESSION_RETENTION_DAYS=30
LIFTBOOK_SYNC_RETENTION_DAYS=90
```

`DATABASE_URL` Railway Postgres обычно пробрасывает сам.

### Проверка

После деплоя проверить:

```text
GET /health
```

Ожидаем:

- `ok: true`
- `storageDriver: postgres`

## 3. Задеплоить web в Vercel

В Vercel:

1. импортировать тот же Git-репозиторий;
2. выбрать root directory: `apps/web`;
3. добавить env:

```text
NEXT_PUBLIC_LIFTBOOK_API_URL=https://<railway-api-domain>
```

4. задеплоить.

## 4. Smoke-check после релиза

Проверить руками:

1. открывается экран сегодняшнего дня;
2. можно добавить упражнение;
3. можно добавить подход;
4. локальные данные сохраняются после refresh;
5. создается guest account;
6. manual sync проходит без ошибок.

## 5. Что можно считать первым релизом

Релиз можно считать состоявшимся, если:

- frontend доступен по публичному URL;
- backend отвечает по публичному URL;
- `guest account` создается;
- `push/pull sync` работает;
- PostgreSQL path активен.

## Что я рекомендую не делать прямо сейчас

- не вводить Kubernetes;
- не совмещать сейчас выпуск MVP и полноценную auth-систему;
- не усложнять backend framework migration перед деплоем.

## Альтернативный путь: один VPS

Если важнее простота расходов и контроль над окружением, Liftbook можно развернуть на одном VPS.

Под это в репозитории уже добавлены:

- [docker-compose.vps.yml](/home/kirill-yashmetov/projects/liftbook/docker-compose.vps.yml)
- [Caddyfile](/home/kirill-yashmetov/projects/liftbook/Caddyfile)
- [apps/web/Dockerfile](/home/kirill-yashmetov/projects/liftbook/apps/web/Dockerfile)
- [apps/api/Dockerfile](/home/kirill-yashmetov/projects/liftbook/apps/api/Dockerfile)
- [.env.vps.example](/home/kirill-yashmetov/projects/liftbook/.env.vps.example)

И команды:

```bash
pnpm vps:migrate
pnpm vps:up
pnpm vps:down
```

Схема:

- `web`
- `api`
- `postgres`
- `caddy`

Все живет на одной машине и поднимается через Docker Compose.

### Почему Caddy

Для первого VPS-релиза Caddy удобнее Nginx в трех вещах:

- автоматически получает и обновляет Let's Encrypt сертификаты;
- конфиг короче и проще для одного домена;
- `reverse_proxy` и маршрутизация `/api` на backend настраиваются почти без церемонии.

Если позже потребуется более специфичная прокси-конфигурация, на Nginx всегда можно перейти.

## Источники

- Vercel monorepos: https://vercel.com/docs/monorepos
- Vercel Next.js: https://vercel.com/docs/concepts/next.js/overview
- Railway monorepo deploy: https://docs.railway.com/guides/monorepo
- Railway PostgreSQL: https://docs.railway.com/guides/postgresql
- Railway pre-deploy command: https://docs.railway.com/deployments/pre-deploy-command
