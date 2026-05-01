# MVP 2: known issues to resolve before new feature work

Date: 2026-05-01

This document tracks issues that should be resolved **before** active MVP 2 feature development. The idea is simple: first remove the rough edges and unfinished MVP 1 behavior, then add new product scope.

## Priority rule

Until the items in this document are closed, they take priority over new feature work from [docs/en/mvp2-plan.md](/home/kirill-yashmetov/projects/liftbook/docs/en/mvp2-plan.md).

## 1. Remove the `Search exercise` text above the search field

Problem:

- the extra label above the search field creates unnecessary visual noise in the add-exercise drawer.

What to do:

- remove the text above the search field;
- keep only the input itself and its placeholder.

## 2. Add an image to the empty state

Problem:

- the empty state still feels too dry.

What to do:

- add an illustration or image to the empty state;
- the image should live in the repository as a static asset.

Important:

- before implementing this item, ask the user to upload the image;
- recommended path: `apps/web/public/images/empty-day.png`

## 3. Rework empty-state text and CTA

Problem:

- the current copy and `Add exercise` label feel heavier than needed.

What to do:

- replace the main text with: `You haven’t added an exercise yet`
- replace the CTA with a button labeled `Add`

## 4. Remove the dark edge stripe in drawers/popups

Problem:

- calendar, settings, and exercise list drawers still show a dark artifact on the edge opposite to the direction they appear from.

What to do:

- inspect `DrawerOverlay`, `DrawerContent`, background, border, overflow, and radius;
- ensure fully clean edges for top/bottom drawers.

## 5. Add a clear button to exercise search

Problem:

- clearing the search currently requires deleting text manually.

What to do:

- add a clear button inside the search input;
- show it only when the query is non-empty.

## 6. Rework buttons in the set-edit popover

Problem:

- the current button behavior does not match user expectations.

What to do:

- the close icon should only close the popover;
- it must not delete the set;
- replace the `Cancel` button with `Delete`;
- `Delete` should use a critical color, but not an overly aggressive one;
- add a clear `Save` button.

## 7. Add dark theme support

Problem:

- under system dark mode, some surfaces stay light while text becomes light too, causing contrast issues.

What to do:

- add settings for:
  - `Light`
  - `Dark`
  - `System`
- wire theme state through the app;
- fix theme-incompatible surfaces.

## 8. Detect language on first visit from client settings

Problem:

- the initial locale does not adapt to the user automatically.

What to do:

- detect the client language on first launch;
- supported startup variants:
  - Russian
  - English
- after the first choice, persist the local preference.

## 9. Add animation for day swipe transitions

Problem:

- day changes by swipe feel too abrupt.

What to do:

- add transition animation between days on the main screen;
- the animation should reflect swipe direction.

## 10. Rework sync section inside settings

Problem:

- the sync block sits too deep in the hierarchy and feels visually overloaded;
- `Synced` can overflow its layout.

What to do:

- move sync-related elements to the same hierarchy level as `Guest account connected`;
- remove the gray nested background;
- fix text/layout so status labels never overflow.

## 11. Store weight in kg and only convert for lb display

Problem:

- switching `kg/lb` should affect all displayed weights correctly.

What to do:

- adopt the rule that weight is always stored in kg;
- convert only at display time for `lb`;
- create a shared weight formatting/display helper;
- feed the current weight-unit setting into it.

## 12. Add descriptive helper text for toggle settings

Problem:

- some toggles are not self-explanatory right now.

What to do:

- add a short description near or below each toggle explaining its effect.

## 13. Rework the timer and add timer settings

Problem:

- the current timer is too limited.

What to do:

- add two modes:
  - countdown timer
  - stopwatch
- add configurable timer duration;
- move timer settings behind a sliders icon in the timer row;
- add settings for:
  - sound on completion
  - vibration on completion
- allow both sound and vibration to be disabled.

## 14. Bring back horizontal category scrolling without visible scrollbar

Problem:

- the current category layout is not the intended product behavior.

What to do:

- muscle-group categories in the add-exercise drawer should return to a horizontal scrolling strip;
- the scrollbar itself should remain hidden.

## 15. Add color coding for muscle groups

Problem:

- muscle groups currently have no visual coding, even though that could help users scan training days quickly.

What to do:

- assign a color to each muscle group;
- use that color:
  - in exercise cards;
  - in the calendar;
  - in the horizontal day strip;
- goal: make it easy to see what was trained on a given day.

## Note about the original list

The original message also contained an empty trailing item `14.` with no content. It is intentionally omitted here because it does not define a task.
