# Архитектура

## Направление

Liftbook должен начинаться как модульный монолит, а не распределенная микросервисная система.

Код должен быть организован вокруг четких доменных границ, чтобы части можно было позже выделить в сервисы, если продукт вырастет или станет частью большой корпоративной платформы.

## Почему не микросервисы на старте

Микросервисы слишком рано добавят сложность:

- отдельные deployment pipelines;
- сетевые вызовы между доменами;
- распределенные транзакции;
- observability;
- inter-service auth;
- доставка событий и retry;
- versioning API.

Для MVP эти расходы замедлят discovery. Лучше начать с модульного монолита со строгими границами и API, готовыми к интеграции.

## Доменные границы

Потенциальные домены:

- `workout-core`: тренировки, упражнения в тренировке, подходы, повторения, вес, история;
- `exercise-catalog`: встроенные и пользовательские упражнения;
- `programs`: шаблоны и тренировочные планы;
- `sync`: локальный журнал операций, конфликты, server sync;
- `identity`: пользователи, аккаунты, сессии;
- `i18n`: локали, словари, локализованные labels;
- `analytics`: рекорды, прогресс, графики;
- `integrations`: будущие адаптеры для внешних/корпоративных продуктов.

## PWA и Offline-first

Активный тренировочный сценарий не должен зависеть от сети.

Локальное хранение — основной write path во время тренировки. Server sync должен быть асинхронным и устойчивым:

- сначала запись локально;
- запись syncable operations;
- мгновенное обновление UI;
- sync при наличии сети;
- явное разрешение конфликтов;
- мягкие удаления для workout data, чтобы офлайн-удаления можно было синхронизировать позже.

Аккаунт не должен менять local-first write path. Auth открывает backup и multi-device sync, но приложение все равно должно позволять записывать тренировки без сети.

Приложение поддерживает local/guest usage и последующую привязку аккаунта. Это не делает вход блокером первой тренировки.

Первая web-реализация хранит локальную guest account session в IndexedDB после успешного запроса к API. Сессия опциональна и не блокирует локальные записи.

## Структура репозитория

Используем pnpm monorepo:

- `apps/web`: Next.js PWA;
- `apps/api`: custom backend API;
- `packages/domain`: общие доменные типы, схемы и бизнес-правила;
- `packages/config`: общая TS/lint/config-инфраструктура при необходимости.

Такая структура поддерживает модульный монолит сегодня и оставляет пространство для выделения сервисов позже.

## Выбранный frontend stack

- Next.js with App Router
- React
- TypeScript
- pnpm
- Tailwind CSS
- shadcn/ui
- Client-side offline workout shell
- IndexedDB через Dexie
- PWA manifest и service worker
- Локализация/i18n с первой UI-реализации

shadcn/ui подходит для mobile-first приложения, потому что компоненты копируются в кодовую базу и стилизуются Tailwind. Mobile-first поведение обеспечивается layout, spacing, composition и mobile-friendly primitives вроде Drawer.

## Backend direction

Используем custom backend вместо hosted BaaS.

Backend должен начаться как модульный TypeScript service, вероятно в `apps/api`, с границами:

- identity;
- sync;
- workout data;
- integrations.

Backend не обязателен для первого offline logging flow, но контракты нужно учитывать рано, чтобы локальные данные и sync-операции развивались аккуратно.

Текущий skeleton `apps/api` не имеет runtime-зависимостей и определяет health, guest account и sync endpoints до выбора production framework, database и auth provider.

Варианты backend описаны в [исследовании backend](backend-research.md). Вероятное направление — TypeScript modular monolith с PostgreSQL и Fastify или NestJS.

## Варианты локальной БД

### Dexie

Dexie — browser-first wrapper над IndexedDB. Он хорошо подходит для web/PWA-first продукта, когда нужен контроль, низкая сложность и явный sync design.

### WatermelonDB

WatermelonDB — offline-first reactive database, часто используемая в React Native и более крупных локальных моделях. Ее можно рассмотреть, если Liftbook быстро пойдет в React Native или потребует более opinionated database/sync model.

## Начальная рекомендация

Использовать Dexie, если React Native compatibility не становится ближайшим требованием.

Workout experience должен быть client-side offline-first app shell. Не полагаться на server rendering для ключевого сценария в зале.

## Владение данными

Локальные данные — источник истины во время тренировки. Серверные данные становятся долговременным backup и multi-device sync target.

Будущая корпоративная интеграция должна быть моделью выборочного шаринга, а не предположением, что все персональные workout data принадлежат организации.

Шаринг данных должен быть consent-based. Модель интеграции должна позволять выдавать и отзывать доступ к scopes данных тренировок.

## Подготовка к синхронизации

Локальные syncable-сущности должны иметь стабильные client ids, опциональные server ids, timestamps, deleted timestamp и sync status.

Текущий клиент помечает локальные изменения как `pending`. Будущий sync engine сможет искать pending records, отправлять их на backend, обновлять `serverId` и помечать records как `synced`.

Первый sync UI ручной и находится в Settings. Он отправляет pending local records в API, помечает принятые records как `synced` и сохраняет cursor в локальной account session.

Conflict handling намеренно не реализован в MVP UI. Модель данных резервирует `conflict`, чтобы позже показать записи, которые требуют пользовательского или серверного разрешения.

## Риск данных продукта

MVP не различает planned и completed sets. Подходы, созданные из прошлого результата, сразу являются обычными записями.

Это ускоряет логирование, но случайно созданные подходы могут влиять на историю/статистику, пока пользователь их не исправит или не удалит. Позже могут понадобиться undo, change history или более мягкая draft-семантика.
