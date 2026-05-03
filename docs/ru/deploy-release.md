# Релиз Liftbook на VPS

Дата: 2026-05-03

Этот документ описывает **четкий пошаговый алгоритм релиза на один VPS**.  
Формат намеренно практический: минимум рассуждений, максимум конкретных команд.

## Что должно быть заранее

Перед началом у тебя уже должны быть:

- VPS с Ubuntu и доступом по SSH;
- домен, указывающий на IP VPS;
- Docker и Docker Compose plugin на сервере;
- репозиторий Liftbook, склонированный на сервер, например в `/opt/liftbook`;
- заполненный файл `.env.vps`.

Если все это уже сделано, дальше идем по алгоритму ниже.

---

## Алгоритм первого релиза

### 1. Подключиться к серверу

На локальной машине:

```bash
ssh root@<IP_СЕРВЕРА>
```

Пример:

```bash
ssh root@5.180.174.222
```

### 2. Перейти в директорию проекта

На сервере:

```bash
cd /opt/liftbook
```

### 3. Проверить, что `.env.vps` существует

```bash
ls -la .env.vps
```

Если файла нет, создать его из шаблона:

```bash
cp .env.vps.example .env.vps
nano .env.vps
```

Минимум, что должно быть внутри:

```text
LIFTBOOK_DOMAIN=liftbook.ru

POSTGRES_DB=liftbook
POSTGRES_USER=liftbook
POSTGRES_PASSWORD=сложный_пароль

NEXT_PUBLIC_LIFTBOOK_API_URL=/api

LIFTBOOK_STORAGE_DRIVER=postgres
LIFTBOOK_SYNC_PULL_PAGE_SIZE=100
LIFTBOOK_SESSION_RETENTION_DAYS=30
LIFTBOOK_SYNC_RETENTION_DAYS=90
```

### 4. Поднять только PostgreSQL

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d postgres
```

### 5. Проверить, что PostgreSQL запустился

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml ps
```

В списке должен быть `postgres` в состоянии `Up`.

### 6. Применить миграции

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml run --rm migrate
```

Если все прошло нормально, миграции завершатся без ошибки.

### 7. Поднять весь стек

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d --build
```

Это поднимет:

- `postgres`
- `api`
- `web`
- `caddy`

### 8. Проверить состояние контейнеров

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml ps
```

### 9. Проверить backend health

На сервере:

```bash
curl -I http://127.0.0.1
curl http://127.0.0.1/api/health -H "Host: liftbook.ru"
```

Во втором ответе ожидаем JSON с `ok: true`.

### 10. Проверить сайт снаружи

Уже в браузере:

```text
https://liftbook.ru
```

И отдельно:

```text
https://liftbook.ru/api/health
```

---

## Алгоритм повторного релиза

Когда VPS уже настроен и первый релиз был успешен, дальнейший релиз делается так.

### 1. Подключиться к серверу

```bash
ssh root@<IP_СЕРВЕРА>
```

### 2. Перейти в проект

```bash
cd /opt/liftbook
```

### 3. Запустить автоматический релиз

```bash
pnpm vps:release
```

Или напрямую:

```bash
./scripts/release-vps.sh
```

Это основная рекомендуемая команда для последующих релизов.

---

## Что делает `pnpm vps:release`

Скрипт выполняет релиз в таком порядке:

1. проверяет окружение и нужные файлы;
2. загружает `.env.vps`;
3. проверяет git working tree;
4. делает `git fetch` и `git pull --ff-only`;
5. валидирует `docker compose` конфиг;
6. поднимает PostgreSQL;
7. ждет readiness базы;
8. делает backup БД в `/var/backups/liftbook`;
9. собирает свежие образы `api` и `web`;
10. запускает миграции;
11. поднимает `web`, `api`, `caddy`;
12. проверяет `http://127.0.0.1/api/health`.

---

## Как посмотреть логи, если что-то пошло не так

### Все сервисы сразу

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs --tail=100
```

### Только API

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs api
```

### Только web

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs web
```

### Только caddy

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs caddy
```

### Только postgres

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs postgres
```

---

## Как остановить стек

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml down
```

Или через package script:

```bash
pnpm vps:down
```

---

## Минимальный checklist после релиза

После каждого релиза проверь руками:

1. открывается главная страница;
2. можно добавить упражнение;
3. можно добавить подход;
4. guest account создается;
5. ручная синхронизация проходит;
6. `https://liftbook.ru/api/health` отвечает без ошибки.

---

## Самый короткий сценарий

Если нужен совсем короткий набор команд:

### Первый релиз

```bash
ssh root@<IP_СЕРВЕРА>
cd /opt/liftbook
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d postgres
docker compose --env-file .env.vps -f docker-compose.vps.yml run --rm migrate
docker compose --env-file .env.vps -f docker-compose.vps.yml up -d --build
curl http://127.0.0.1/api/health -H "Host: liftbook.ru"
```

### Следующий релиз

```bash
ssh root@<IP_СЕРВЕРА>
cd /opt/liftbook
pnpm vps:release
```
