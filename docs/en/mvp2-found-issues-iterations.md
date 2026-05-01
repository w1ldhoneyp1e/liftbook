# MVP 2: implementation iterations for known issues

Date: 2026-05-01

This document breaks [docs/en/mvp2-found-issues.md](/home/kirill-yashmetov/projects/liftbook/docs/en/mvp2-found-issues.md) into implementation iterations. The grouping principle is to cluster tasks that touch the same screens, components, and UX flows.

## Iteration 1. Add-exercise drawer and empty state

Goal: quickly improve the first “empty day -> add exercise” flow.

What is included:

- remove the `Search exercise` text above the search field;
- add a clear button inside the search field;
- bring back horizontal category scrolling without a visible scrollbar;
- replace the empty-state text with `You haven’t added an exercise yet`;
- replace the CTA `Add exercise` with an `Add` button;
- add an image to the empty state.

Dependencies:

- before implementing the image, ask the user to upload the file to:
  - `apps/web/public/images/empty-day.png`

Candidate files:

- `apps/web/src/features/day/components/exercise-picker-drawer.tsx`
- `apps/web/src/features/day/components/exercise-list.tsx`
- `apps/web/src/shared/i18n/**`

## Iteration 2. Set popover and timer

Goal: make two frequently touched controls more understandable and configurable.

What is included:

- in the set popover:
  - close icon closes the popover;
  - `Delete` replaces `Cancel`;
  - explicit `Save` button;
- timer rework:
  - countdown mode;
  - stopwatch mode;
  - configurable duration;
  - settings behind a sliders icon;
  - sound and vibration;
  - ability to disable sound and vibration.

Why these belong together:

- both involve compact popover/inline-control patterns;
- they may reuse similar UI decisions.

Candidate files:

- `apps/web/src/features/day/components/exercise-card.tsx`
- `apps/web/src/features/day/components/rest-timer-row.tsx`
- `apps/web/src/features/day/**`
- `apps/web/src/shared/domain/**`

## Iteration 3. Theme, language, and settings

Goal: bring the app to a more mature state at the global settings layer.

What is included:

- dark theme:
  - light;
  - dark;
  - system;
- first-visit language detection from client data;
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

## Iteration 4. Visual consistency and day-screen behavior

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

## Iteration 5. Weight units and display model

Goal: fix `kg/lb` properly at the model level.

What is included:

- formalize the rule that stored weight is always in kg;
- add a shared helper for weight display;
- switching `kg/lb` must update display across the app without mutating stored data.

Why this is separate:

- this is no longer just UI polish, but a cross-cutting data and display model change;
- it is safer not to mix it with the other UI passes.

Candidate files:

- `apps/web/src/shared/domain/**`
- `apps/web/src/features/day/**`
- `apps/web/src/shared/i18n/**`
- possibly `apps/api/**` only if any assumptions about storage units are encoded there

## Recommended order

1. **Iteration 1** — immediate user-facing improvement in the add flow
2. **Iteration 2** — improve frequently used controls
3. **Iteration 3** — settings, theme, language
4. **Iteration 4** — visual coherence and animations
5. **Iteration 5** — systemic `kg/lb` fix

## Why `kg/lb` is not first

Even though it is important, it is more systemic and touches data/display rules across the app. It is more reasonable to do it after the more local UX issues are closed and while fewer adjacent layers are changing at the same time.

## What to start with now

If work starts immediately, I would begin with **Iteration 1**.
