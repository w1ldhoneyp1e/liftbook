# ADR 0001: Initial Technical Direction

## Status

Proposed

## Context

Liftbook is a mobile-first, offline-first workout journal. The first critical scenario is logging a gym workout on iPhone without internet access.

The product may later become a standalone service or part of a larger corporate HR/training product.

## Decision

Start with a modular monolith and avoid distributed microservices for MVP 1.

Prefer Next.js if it does not make offline-first implementation significantly harder. The workout logging flow must remain client-side and fully available offline.

Prefer Dexie over WatermelonDB for the first web/PWA implementation unless React Native compatibility becomes a near-term requirement.

## Consequences

- Faster MVP delivery.
- Clear domain boundaries without distributed system overhead.
- Future extraction into services remains possible.
- Offline sync must be designed deliberately rather than treated as an afterthought.

## References

- Next.js PWA documentation: https://nextjs.org/docs/app/guides/progressive-web-apps
- MDN Progressive Web Apps: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- Dexie documentation: https://dexie.org/docs/
- WatermelonDB documentation: https://watermelondb.dev/docs
