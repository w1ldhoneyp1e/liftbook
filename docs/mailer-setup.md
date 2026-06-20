# Mailer Setup

Короткий алгоритм настройки mailer для Liftbook через SMTP.

## Для чего

Нужно, чтобы Liftbook отправлял:

- письмо подтверждения почты после регистрации;
- повторную отправку письма по кнопке `Подтвердить почту`.

## Шаг 1. Завести SMTP у провайдера

Подойдет Mailganer или другой SMTP-провайдер.

Нужно получить:

- `SMTP host`
- `SMTP port`
- `SMTP user`
- `SMTP password`

## Шаг 2. Подготовить адрес отправителя

Нужен адрес вроде:

- `auth@liftbook.ru`

или

- `hello@liftbook.ru`

## Шаг 3. Настроить DNS домена

У почтового провайдера взять и добавить DNS-записи для домена:

- `SPF`
- `DKIM`
- при наличии `DMARC`

Без этого письма могут не доходить или попадать в спам.

## Шаг 4. Заполнить `.env.vps`

На сервере в `/opt/liftbook/.env.vps` выставить:

```env
LIFTBOOK_APP_ORIGIN=https://liftbook.ru

LIFTBOOK_EMAIL_PROVIDER=smtp
LIFTBOOK_FROM_EMAIL=auth@liftbook.ru
LIFTBOOK_FROM_NAME=Liftbook

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
```

Если провайдер выдал SSL SMTP на `465`, то:

```env
SMTP_PORT=465
SMTP_SECURE=true
```

## Шаг 5. Перерелизить сервер

```bash
cd /opt/liftbook
./scripts/release-vps.sh
```

## Шаг 6. Проверить логи API

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs api --tail=200
```

Если SMTP настроен неправильно, ошибка будет здесь.

## Шаг 7. Проверить отправку

Сценарий:

1. зарегистрировать новый аккаунт;
2. нажать повторную отправку письма;
3. проверить почту;
4. открыть ссылку из письма.

## Что проверить, если письма не приходят

1. В `.env.vps` точно стоит:

```env
LIFTBOOK_EMAIL_PROVIDER=smtp
```

2. Заполнены:

- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASSWORD`

3. Верно выставлен `LIFTBOOK_APP_ORIGIN`

4. DNS-записи `SPF` и `DKIM` уже применились

5. Ошибки нет в:

```bash
docker compose --env-file .env.vps -f docker-compose.vps.yml logs api --tail=200
```
