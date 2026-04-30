# MVP 1 Gap Review

Review date: 2026-04-30

This document records how close the current Liftbook implementation is to MVP 1 and what still needs to be finished before we can call it done.

## Already done

- Mobile-first day screen on an iPhone-like viewport.
- Offline-first local data storage in IndexedDB.
- Guest account through the backend.
- Basic backup/sync via `push` and `pull`.
- Automatic sync when network is available.
- Date navigation with today selected by default.
- Horizontal date strip and calendar.
- Add exercises by muscle group and by search.
- Create custom exercises.
- Rename and delete custom exercises.
- Add and edit sets.
- Enter weight and reps with keyboard and `+ / -` controls.
- Support for `kg` and `lb`.
- English and Russian UI.
- Starter exercise catalog.
- Defaults from the previous result.
- Rest timer on the current day screen.
- Auto-start rest timer setting.
- Server-side sequence cursor.
- Idempotent backend `push`.
- Paginated `pull` with `hasMore`.
- PostgreSQL backend path.
- Lifecycle cleanup for sessions and sync events.

## Partially done

- History.
  We only have the current day screen so far. A separate history screen or compact per-exercise history is still missing.
- Approximate workout duration.
  The rest timer exists, but there is no dedicated user-facing workout duration summary yet.
- Visual distinction between past, today, and future.
  The states already differ, but the presentation can still be polished further.
- Calendar drawer.
  It works, but it is not yet the final polished version.
- Sync status UI.
  Status and counters exist, but the presentation is still more engineering-oriented than user-oriented.

## Later

- Full history and progress views.
- Charts.
- Exercise catalog expansion to 150 exercises.
- Workout templates.
- Full multi-device sync.
- User-facing conflict resolution.
- Corporate integration.
- Payments.
- Production auth.

## Remaining MVP 1 scope

Before MVP 1 is done, we still need to:

1. Walk through the main user flow and remove friction that gets in the way of training.
2. Do a final gap review pass against `requirements.md` and `ux-flow.md`.
3. Make sure docs and code still match.

## Readiness criterion

MVP 1 is ready when:

- the core training flow works on a mobile screen without major UX blockers;
- the offline scenario works;
- guest account and sync continue to work;
- backend smoke and build are green;
- the remaining gaps are intentionally deferred to MVP 2+.
