# MVP 2: implementation iterations for known issues

Date: 2026-05-01

This document breaks [docs/en/mvp2-found-issues.md](/home/kirill-yashmetov/projects/liftbook/docs/en/mvp2-found-issues.md) into implementation iterations. The grouping principle is to cluster tasks that touch the same screens, components, and UX flows.

## Iteration 1. Add-exercise drawer and empty state without the asset

Goal: quickly improve the first “empty day -> add exercise” flow.

What is included:

- remove the `Search exercise` text above the search field;
- add a clear button inside the search field;
- bring back horizontal category scrolling without a visible scrollbar;
- replace the empty-state text with `You haven’t added an exercise yet`;
- replace the CTA `Add exercise` with an `Add` button;

After that, separately:

- before implementing the image, ask the user to upload the file to:
  - `apps/web/public/images/empty-day.png`

Candidate files:

- `apps/web/src/features/day/components/exercise-picker-drawer.tsx`
- `apps/web/src/features/day/components/exercise-list.tsx`
- `apps/web/src/shared/i18n/**`

## Iteration 2. Set popover

Goal: make two frequently touched controls more understandable and configurable.

What is included:

- in the set popover:
  - close icon closes the popover;
  - `Delete` replaces `Cancel`;
  - explicit `Save` button;

Why these belong together:

- this is a local fix for one of the most frequently used controls;
- it is cleaner to close it separately, without mixing timer work into it.

Candidate files:

- `apps/web/src/features/day/components/exercise-card.tsx`
- `apps/web/src/features/day/**`
- `apps/web/src/shared/domain/**`

## Iteration 3. Weight units and display model

Goal: fix `kg/lb` properly at the model level.

What is included:

- formalize the rule that stored weight is always in kg;
- add a shared helper for weight display;
- switching `kg/lb` must update display across the app without mutating stored data.

Why this is separate:

- this is not just UI polish, but a cross-cutting data and display model change;
- it should be closed earlier, before more screens and representations of weight accumulate.

Candidate files:

- `apps/web/src/shared/domain/**`
- `apps/web/src/features/day/**`
- `apps/web/src/shared/i18n/**`
- possibly `apps/api/**` only if any assumptions about storage units are encoded there

## Iteration 4. Theme and settings

Goal: bring the app to a more mature state at the global settings layer.

What is included:

- dark theme:
  - light;
  - dark;
  - system;
- descriptive helper text for toggles;
- reworked sync block in settings.

Why these belong together:

- they all live in the app settings/application shell layer;
- they touch the same state sources and settings surfaces.

Candidate files:

- `apps/web/src/features/day/components/settings-drawer.tsx`
- `apps/web/src/app/**`
- `apps/web/src/shared/i18n/**`
- `apps/web/src/shared/db/**`

## Iteration 5. Language and app bootstrap

Goal: adjust startup behavior cleanly without mixing it into theming.

What is included:

- first-visit language detection from client data.

Why this is separate:

- it is small in UI surface, but important in bootstrap behavior;
- it is easier to debug independently from theming and settings.

Candidate files:

- `apps/web/src/app/**`
- `apps/web/src/shared/i18n/**`
- `apps/web/src/shared/db/**`

## Iteration 6. Visual consistency and day-screen behavior

Goal: remove visual artifacts and make the day screen feel more alive.

What is included:

- remove the dark edge stripe in drawers/popups;
- add animation for day swipe transitions;
- add muscle-group color coding:
  - exercise cards;
  - calendar;
  - horizontal day strip.

Why these belong together:

- all three are about visual coherence and how the main day screen feels.

Candidate files:

- `apps/web/src/components/ui/drawer.tsx`
- `apps/web/src/features/day/components/date-header.tsx`
- `apps/web/src/features/day/components/calendar-drawer.tsx`
- `apps/web/src/features/day/components/exercise-card.tsx`
- `apps/web/src/features/day/lib/**`

## Recommended order

1. **Iteration 1** — immediate user-facing improvement in the add flow
2. **Iteration 2** — improve the set popover
3. **Iteration 3** — systemic `kg/lb` fix
4. **Iteration 4** — theme and settings
5. **Iteration 5** — startup language
6. **Iteration 6** — visual coherence and animations

## What to start with now

If work starts immediately, I would begin with **Iteration 1**.
