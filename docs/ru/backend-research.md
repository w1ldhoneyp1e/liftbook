# Исследование backend

Дата: 2026-04-28

Документ отслеживает backend-направление до замены текущего in-memory API skeleton на persistent service.

Промежуточный этап уже начался: текущий API больше не полностью in-memory. Guest sessions и sync events сохраняются в локальный JSON store. Это не production persistence, но уже полезный шаг между "процесс-память" и PostgreSQL.

Следующий подготовительный слой тоже уже заложен: file store подключен через storage driver boundary. Это значит, что переход на PostgreSQL может идти через новый adapter, без переписывания auth/sync service слоя.

Дополнительно уже выделен config layer и placeholder для `postgres` driver. Это позволяет заранее зафиксировать env-контракт (`PORT`, `LIFTBOOK_STORAGE_DRIVER`, `LIFTBOOK_DATA_FILE`, `DATABASE_URL`) еще до подключения реального database client.

Локальная подготовка под PostgreSQL тоже уже добавлена: `docker-compose.yml`, `.env.example` и первый SQL-скелет `apps/api/db/migrations/0001_initial.sql`. Это еще не реальная БД-интеграция в runtime, но уже конкретизирует будущую схему и локальный developer flow.

Поверх этого теперь есть и локальный migration flow: SQL-файлы из `apps/api/db/migrations` можно применять через `pnpm db:migrate`, который прокидывает их в `psql` внутри compose-сервиса `postgres`.

Следующий рубеж тоже уже взят: `postgres` driver в API теперь не placeholder, а реальная storage-ветка. При наличии `DATABASE_URL` и примененных миграций backend может сохранять `users`, `sessions` и `sync_events` в PostgreSQL.

Дополнительно backend теперь хранит и `sync_records` как текущее server-side состояние сущностей. Это полезно для следующего этапа, где одного append-only event log уже мало.

## Текущая рекомендация

Использовать TypeScript modular monolith с PostgreSQL как основной БД.

Рекомендуемый первый production stack:

- Runtime/API: Fastify или NestJS на Node.js.
- Database: PostgreSQL.
- Data access: Prisma или Drizzle.
- Auth: начать с guest accounts, позже добавить email/OAuth без изменения offline-first write path.
- Sync: append-only `sync_events` плюс current-state таблицы для workouts, exercise entries, custom exercises и settings.

Текущее предпочтение для Liftbook:

- **Fastify + PostgreSQL + Prisma**, если нужен небольшой сервис с явной архитектурой и быстрыми итерациями.
- **NestJS + PostgreSQL + Prisma**, если backend быстро вырастет в большую платформу с модулями, guards, queues, integrations и формальными слоями.

С точки зрения удобства деплоя начинать лучше с **Fastify + PostgreSQL + Prisma**, если мы осознанно не выбираем NestJS по причинам команды/процесса. Это проще контейнеризовать, проще запускать одним сервисом и оставляет путь к NestJS-like модульным границам позже.

## Почему PostgreSQL

Данные Liftbook достаточно relational:

- пользователи владеют тренировками;
- workout days содержат exercise entries;
- exercise entries содержат sets;
- custom exercises принадлежат пользователям;
- sync events требуют порядка, cursors и надежного хранения.

PostgreSQL дает transactions, indexes, JSON fields для sync payloads и хорошие варианты хостинга.

## Fastify

Fastify подходит, если нужен lean API и мы готовы сами владеть архитектурой.

Плюсы:

- меньший вес framework;
- хорошая TypeScript support;
- естественная работа со schemas на уровне route;
- легко мигрировать от текущего minimal HTTP skeleton.

Компромисс:

- нужно самим определить module boundaries, DI pattern, testing conventions и структуру приложения.

Docs: https://fastify.dev/docs/latest/Reference/TypeScript/

## NestJS

NestJS подходит, если backend complexity быстро растет.

Плюсы:

- сильная opinionated architecture;
- modules, providers, guards, interceptors, validation, OpenAPI, health checks и auth patterns из коробки;
- легче держать большой backend организованным.

Компромисс:

- больше framework ceremony, чем нужно для первого persistent sync service.

Docs: https://docs.nestjs.com/

## Prisma

Prisma привлекательна для Liftbook, потому что дает type-safe client и понятный migration workflow.

Плюсы:

- сильный TypeScript DX;
- schema-first models легко читать;
- `prisma migrate` дает простой migration path;
- хорошо подходит для продукта, форма которого еще меняется.

Компромисс:

- дальше от SQL, чем Drizzle;
- generated client и migration workflow добавляют свои conventions.

Docs: https://docs.prisma.io/docs/prisma-orm/quickstart/postgresql

## Drizzle

Drizzle хорош, если хочется быть ближе к SQL и держать ORM-слой тонким.

Плюсы:

- SQL-like TypeScript schema definitions;
- легкий data access;
- явные migrations через drizzle-kit.

Компромисс:

- немного больше ручного моделирования, чем в Prisma;
- команда должна комфортно мыслить ближе к SQL.

Docs: https://orm.drizzle.team/docs/get-started/postgresql-new

## Удобство развертывания

На этом этапе удобство деплоя важнее framework ceremony. Первый реальный backend должен легко запускаться локально, деплоиться одним сервисом и подключаться к managed PostgreSQL.

### Рекомендуемая первая форма деплоя

- Один API service.
- Один managed PostgreSQL.
- Environment variables для secrets и database URL.
- Migration command как явный release/deploy step.
- Dockerfile с самого начала, даже если первый хост умеет deploy напрямую из Git.
- Без Kubernetes, пока продукту он реально не нужен.

### Хостинг-варианты

#### Railway

Railway удобен для раннего продукта: Node services и PostgreSQL могут жить в одном project. Railway PostgreSQL отдает стандартные connection variables, включая `DATABASE_URL`, что хорошо подходит Prisma и Drizzle.

Полезно для:

- быстрого MVP deploy;
- managed Postgres без сложной настройки;
- preview-like окружений;
- минимальной инфраструктурной работы.

Риск:

- platform abstraction может скрывать production details до роста трафика.

Docs: https://docs.railway.com/guides/postgresql

#### Render

Render также прост для monolith API. Он поддерживает web services из Git или Docker images, а сервисы могут общаться через private network. Публичный web service должен слушать `0.0.0.0` и настроенный порт.

Полезно для:

- Git-based deploys;
- Docker deploys для portability;
- managed services с понятным UI.

Риск:

- перед production нужно проверить plan limits, cold starts и backup behavior БД.

Docs: https://render.com/docs/web-services

#### DigitalOcean App Platform

DigitalOcean App Platform — managed PaaS, который деплоит из Git repositories или container images. Поддерживает Node.js buildpacks, Dockerfiles и добавление database при настройке app.

Полезно для:

- более традиционного cloud vendor;
- managed app + managed database в одной экосистеме;
- команды, которая позже может использовать Droplets, Spaces или managed databases напрямую.

Риск:

- больше ощущение cloud console, чем у Railway/Render.

Docs: https://docs.digitalocean.com/products/app-platform/reference/buildpacks/nodejs/

#### Fly.io

Fly.io интересен, когда важны география и portability Docker image. Он использует Docker images как packaging format и запускает apps как lightweight VMs.

Полезно для:

- будущего low-latency global deployment;
- сильного Docker-first workflow;
- большего контроля, чем в обычном PaaS.

Риск:

- больше operational surface area, чем Railway/Render для первого MVP backend.

Docs: https://fly.io/docs/blueprints/working-with-docker

### Влияние framework на деплой

Fastify и NestJS оба деплоятся как обычные Node services. Удобство деплоя не должно быть главным фактором выбора между ними.

Практическая разница:

- Fastify стартует меньше и ближе к одному API service.
- NestJS дает больше структуры, но также больше файлов, decorators и conventions.

Для деплоя оба могут использовать одинаковую форму Dockerfile:

1. install dependencies;
2. build TypeScript;
3. run migrations;
4. start HTTP server on `$PORT`.

### Влияние ORM на деплой

Prisma и Drizzle оба работают с `DATABASE_URL`.

Prisma deployment considerations:

- нужен generated client в build;
- нужна migration command во время release;
- удобно для читаемой схемы и продуктовых итераций.

Drizzle deployment considerations:

- нужна генерация/применение migrations через drizzle-kit;
- ближе к SQL и часто легче runtime;
- требует чуть больше дисциплины вокруг schema evolution.

Для простоты первого persistent backend Prisma немного удобнее, потому что workflow migrations + generated client широко задокументирован и явный.

### Локальная разработка

Когда начнем persistence, нужен Docker Compose для локального PostgreSQL.

Целевые команды:

```bash
pnpm dev:api
pnpm db:migrate
pnpm db:studio
```

Локальный `.env`:

```text
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

### Рекомендация по деплою

Фаза 1:

- Деплоить API + managed PostgreSQL на Railway или Render.
- Использовать Dockerfile только если native Node deploy плохо дружит с pnpm monorepo.
- Держать migrations явными, не прятать их в startup app.

Фаза 2:

- Добавить staging environment.
- Добавить preview deploys для pull requests, если платформа делает это дешево.
- Добавить backups и rehearsal restore.

Фаза 3:

- Вернуться к Fly.io или container platform, если станут важны latency, region placement или infrastructure control.

## Предлагаемые backend milestones

1. Заменить file-based store на PostgreSQL tables.
2. Добавить migrations и database connection config.
3. Перенести guest users и sessions в БД.
4. Перенести sync events и current entity snapshots в БД.
5. Добавить pull sync, исключающий events запрашивающего client.
6. Добавить conflict detection rules.
7. Добавить production auth после стабилизации guest sync path.

## Черновик модели данных

Core tables:

- `users`
- `sessions`
- `devices`
- `exercises`
- `workout_days`
- `exercise_entries`
- `user_settings`
- `sync_events`

Важные sync fields:

- `client_id`
- `local_id`
- `server_id`
- `entity_type`
- `operation`
- `payload`
- `server_version`
- `created_at`
- `updated_at`
- `deleted_at`

## Решения, к которым нужно вернуться

Перед установкой backend dependencies решить:

- Fastify или NestJS.
- Prisma или Drizzle.
- Начинаются ли sync payloads как JSON snapshots или полностью normalized writes.
- Нужен ли Docker Compose для локального PostgreSQL сразу.
