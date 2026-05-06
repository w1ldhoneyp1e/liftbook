# Local Development

Эта инструкция нужна, чтобы запустить Liftbook локально на ноутбуке и открыть приложение с телефона в той же Wi‑Fi сети.

## 1. Запустить API

Нужно, чтобы работали guest account, login/register и sync.

Из корня проекта:

```bash
pnpm dev:api
```

API поднимется на:

```text
http://localhost:4000
```

## 2. Узнать локальный IP ноутбука

Нужно, чтобы телефон открыл не `localhost`, а адрес ноутбука в сети.

```bash
hostname -I
```

Используй первый IP из вывода

## 3. Запустить web так, чтобы он был доступен по сети

Нужно:

- открыть dev-сервер не только на `localhost`;
- сразу прокинуть правильный адрес API для телефона.

Перейди в `apps/web` и запусти:

```bash
cd apps/web
NEXT_PUBLIC_LIFTBOOK_API_URL=http://<IP_НОУТБУКА>:4000 pnpm dev --hostname 0.0.0.0 --port 3000
```

Пример:
```bash
cd apps/web
NEXT_PUBLIC_LIFTBOOK_API_URL=http://http://10.10.206.77:4000 pnpm dev --hostname 0.0.0.0 --port 3000
```

## 4. Открыть приложение с телефона

Нужно, чтобы проверить реальный mobile web UX: жесты, drawer, клавиатуру, safe-area и PWA-поведение.

Телефон должен быть в той же сети Wi‑Fi.

Открой в браузере телефона:

```text
http://<IP_НОУТБУКА>:3000
```

или, если запускал на другом порту:

```text
http://<IP_НОУТБУКА>:3001
```

## 5. Если нужно более стабильное поведение, чем в `next dev`

Нужно, если dev-режим ведет себя нестабильно на телефоне.

В `apps/web`:

```bash
NEXT_PUBLIC_LIFTBOOK_API_URL=http://<IP_НОУТБУКА>:4000 pnpm build
NEXT_PUBLIC_LIFTBOOK_API_URL=http://<IP_НОУТБУКА>:4000 pnpm start --hostname 0.0.0.0 --port 3000
```

Пример:
```bash
NEXT_PUBLIC_LIFTBOOK_API_URL=http://10.10.206.77:4000 pnpm build
NEXT_PUBLIC_LIFTBOOK_API_URL=http://10.10.206.77:4000 pnpm start --hostname 0.0.0.0 --port 3000
```

После этого открой на телефоне тот же адрес:

```text
http://<IP_НОУТБУКА>:3000
```
