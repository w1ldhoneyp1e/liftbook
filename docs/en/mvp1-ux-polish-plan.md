# MVP 1 UX Polish Plan

Date: 2026-04-30

Goal: close MVP 1 UX notes without adding new product directions. This document is written so another model can implement each item one by one without extra context.

## 1. Date strip drag should scroll dates, not change day

Problem: dragging the date strip on mobile triggers the page-level swipe and changes the selected date.

Solution:

- Move day-changing swipe handling from the whole `main` element to the content area below the sticky header.
- Or stop touch propagation inside the date strip.
- Preferred: date strip drag scrolls the strip; content swipe changes day.

Files:

- `apps/web/src/features/day/day-screen.tsx`
- `apps/web/src/features/day/components/date-header.tsx`

Definition of Done:

- The date strip scrolls horizontally by touch.
- Selected date does not change while scrolling the strip.
- Swiping the main day content still changes the date.

## 2. Show more dates in the strip

Problem: the date strip has too few dates.

Solution:

- Show 2 weeks before and 1 week after the selected date.
- Make sure the selected date remains visible.

Files:

- `apps/web/src/features/day/lib/date-utils.ts`

Definition of Done:

- The strip includes roughly 14 days back and 7 days forward.
- No visible horizontal scrollbar in WebKit or Firefox.

## 3. Fix selected date styling

Problem: the selected date shadow looks like a clipped border.

Solution:

- Remove the odd shadow outline.
- Use a clear `border` or soft `ring` that is not visually clipped.
- Keep `past / today / future` tones.

Files:

- `apps/web/src/features/day/lib/date-utils.ts`
- `apps/web/src/features/day/components/date-header.tsx`

Definition of Done:

- Selected date looks complete.
- The top edge does not look cut off.

## 4. Improve empty day

Problem: the `Add exercise` placeholder looks too plain.

Solution:

- Center the empty state.
- Remove the background.
- Text for today: `Add your first exercise today`.
- For another date, insert the selected date.
- Keep the `Add` button as the lower floating action button.

Files:

- `apps/web/src/features/day/components/exercise-list.tsx`
- `apps/web/src/shared/i18n/locales/ru.ts`
- `apps/web/src/shared/i18n/locales/en.ts`
- `apps/web/src/shared/i18n/dictionaries.ts`

Definition of Done:

- Empty day is light and centered.
- Text changes according to the selected date.

## 5. Make timer start/reset icon buttons

Problem: text buttons take too much space in the sticky header.

Solution:

- Use lucide icons: `Play`, `Pause`, `RotateCcw`.
- Keep translated `aria-label` strings.

Files:

- `apps/web/src/features/day/components/rest-timer-row.tsx`

Definition of Done:

- Timer buttons are compact.
- Accessibility labels remain.

## 6. Disable collapse all when there is no content

Problem: the button looks active on an empty day.

Solution:

- Pass `disabled={exerciseEntries.length === 0}`.

Files:

- `apps/web/src/features/day/components/exercise-list.tsx`

Definition of Done:

- Button is disabled on empty days.

## 7. Calendar and Settings should open from the top

Problem: those drawers currently open from the bottom.

Solution:

- Use `direction="top"` for `CalendarDrawer` and `SettingsDrawer` if supported.
- If not supported, extend the local drawer wrapper without breaking the exercise picker.
- Keep exercise picker opening from the bottom.

Files:

- `apps/web/src/components/ui/drawer.tsx`
- `apps/web/src/features/day/components/calendar-drawer.tsx`
- `apps/web/src/features/day/components/settings-drawer.tsx`

Definition of Done:

- Calendar and Settings open from the top.
- Exercise picker still opens from the bottom.

## 8. Position add exercise button relative to `main`

Problem: floating button is positioned relative to viewport.

Solution:

- Make `main` a relative app shell.
- Place the button so it is visually bound to the mobile app width.
- On wide screens, the button must not drift outside the app shell.

Files:

- `apps/web/src/features/day/day-screen.tsx`

Definition of Done:

- FAB visually belongs to the mobile app container.

## 9. Remove black edge pixels from popups/drawers

Problem: some drawer edges show tiny black pixels.

Solution:

- Check overlay/content radius and overflow.
- Add `overflow-hidden` to drawer content if needed.
- Ensure background does not bleed through edges.

Files:

- `apps/web/src/components/ui/drawer.tsx`
- drawer components if needed

Definition of Done:

- Drawer edges are clean.

## 10. Calm down sync visual state

Problem: status flickers between `Up to date` and `Syncing...`.

Solution:

- Do not show `Syncing...` for quiet auto-pull when there are no pending changes.
- Or add debounce/quiet mode for auto sync UI.
- Manual sync should still show progress clearly.

Files:

- `apps/web/src/features/day/day-screen.tsx`
- `apps/web/src/features/day/components/settings-drawer.tsx`

Definition of Done:

- User does not see constant sync status flicker.
- Manual sync still gives feedback.

## 11. Remove category horizontal scroll in exercise picker

Problem: categories scroll horizontally.

Solution:

- Use wrapping chips.
- Limit height if needed.
- Keep search above categories.

Files:

- `apps/web/src/features/day/components/exercise-picker-drawer.tsx`

Definition of Done:

- No horizontal category scroll.
- Chips are easy to tap.

## 12. Fix search focus visual state

Problem: autofocus on search looks strange.

Solution:

- Check `Input` focus ring inside drawer.
- If autofocus creates visual noise, remove `autoFocus`.
- Alternative: keep autofocus but soften focus ring in exercise picker.

Files:

- `apps/web/src/features/day/components/exercise-picker-drawer.tsx`
- `apps/web/src/components/ui/input.tsx` only if a systemic change is needed.

Definition of Done:

- Search field does not look broken when drawer opens.

## 13. Improve exercise and set display inside a day

Status: implemented in the current pass.

Solution:

- Make the exercise card compact and calm, without an outer border, shadow, or collapsing behavior.
- Keep the header to the exercise name and muscle group.
- Show sets inline as compact items.
- Edit weight and reps in a popup opened by tapping a set.
- Add a new set with a dedicated `+` button.
- The `...` button next to the exercise currently contains only delete.
- Keep edit/delete actions for a set inside the same popover/popup so the main list stays short.

Files:

- `apps/web/src/features/day/components/exercise-card.tsx`
- `apps/web/src/features/day/components/set-number-control.tsx`
- `apps/web/src/components/ui/popover.tsx`

Definition of Done:

- Exercise cards are compact.
- Sets are easy to edit without crowding the main screen.
- UI remains mobile-first and does not break weight/reps input.

## 14. Make delete safer

Problem: delete buttons are too easy to hit accidentally.

Solution:

- Add confirmation for deleting an exercise.
- Replace set trash icon with `X` and make it visually lighter.
- Even after item 13, deleting a whole exercise should still require confirmation.

Files:

- `apps/web/src/features/day/components/exercise-card.tsx`
- possibly a shared confirm helper/dialog later

Definition of Done:

- Exercise deletion requires confirmation.
- Set deletion is visually lighter and less confused with deleting the whole card.
