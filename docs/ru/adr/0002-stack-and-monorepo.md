# ADR 0002: стек и монорепозиторий

## Статус

Принято

## Контекст

Liftbook — mobile-first, offline-first дневник тренировок. Он должен поддерживать локальный/гостевой режим, аккаунты позже и custom backend для backup, sync и будущих интеграций.

## Решение

Использовать pnpm monorepo.

Начальная структура:

- `apps/web`: Next.js PWA.
- `apps/api`: custom backend API, добавляется при начале backend-реализации.
- `packages/domain`: общие domain types, schemas и business rules.
- `packages/config`: общая конфигурация проекта при необходимости.

Frontend stack:

- Next.js with App Router.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- IndexedDB через Dexie для локального offline persistence.

Backend direction:

- Custom TypeScript backend.
- Начать модульно и держать доменные границы явными.
- Не переходить к распределенным микросервисам, пока продукт и масштаб это не оправдают.

## Последствия

- Репозиторий готов для web, backend и shared packages.
- Next.js дает продуктовую структуру и не блокирует offline-first дизайн.
- shadcn/ui подходит для mobile-first, потому что компоненты являются локальным кодом и управляются Tailwind.
- Настройка сложнее, чем у одного Vite app, но лучше подходит будущему продукту с backend и интеграциями.

## References

- Next.js create-next-app docs: https://nextjs.org/docs/app/api-reference/cli/create-next-app
- shadcn/ui Next.js installation: https://ui.shadcn.com/docs/installation/next
- shadcn/ui Drawer docs: https://ui.shadcn.com/docs/components/drawer
