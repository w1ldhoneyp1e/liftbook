# ADR 0001: начальное техническое направление

## Статус

Предложено

## Контекст

Liftbook — mobile-first, offline-first дневник тренировок. Первый критичный сценарий — записать тренировку в зале на iPhone без интернета.

Позже продукт может стать самостоятельным сервисом или частью крупного корпоративного HR/training-продукта.

## Решение

Начать с модульного монолита и не строить распределенные микросервисы для MVP 1.

Предпочесть Next.js, если он не усложняет offline-first реализацию заметно. Поток записи тренировки должен оставаться client-side и полностью доступным офлайн.

Предпочесть Dexie вместо WatermelonDB для первой web/PWA реализации, если React Native compatibility не станет ближайшим требованием.

## Последствия

- Более быстрая доставка MVP.
- Четкие доменные границы без overhead распределенной системы.
- Возможность будущего выделения сервисов сохраняется.
- Offline sync нужно проектировать осознанно, а не оставлять на потом.

## References

- Next.js PWA documentation: https://nextjs.org/docs/app/guides/progressive-web-apps
- MDN Progressive Web Apps: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- Dexie documentation: https://dexie.org/docs/
- WatermelonDB documentation: https://watermelondb.dev/docs
