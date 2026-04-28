# Requirements

## Confirmed Requirements

### Product

- The product name is Liftbook.
- The repository name is `liftbook`.
- The product is primarily a personal workout journal.
- The first useful version must work well on iPhone.
- The product should be free for core usage.
- The product should be mobile-first.
- The product should be offline-first.
- The product should support accounts early, while keeping core workout usage offline-capable.
- Users should be able to use the app without signing in.
- All user-facing UI text should be translatable.

### Core User Scenario

During a workout, the user must be able to:

- Open Liftbook on an iPhone.
- See the current date by default.
- Navigate workout records by date.
- Add workout records without requiring a strict start/finish flow.
- Add exercises.
- Log sets.
- Enter repetitions.
- Enter weight.
- See previous performance for the same exercise.
- Reuse previous sets as default values when adding an exercise, when previous data exists.

### Offline

Everything required for the core workout flow must work without internet:

- Starting and continuing a workout.
- Adding exercises.
- Logging sets, reps, and weight.
- Viewing previous workout data for the current exercise.
- Editing current workout data.
- Persisting all data locally.
- Using the starter exercise catalog after it has been installed/cached locally.

Initial install and first account authentication may require internet access. After that, the core workout flow must remain available offline.

### Sync

- Data should be stored locally first.
- Sync should happen later when network access is available.
- The sync model should be designed early, even if server sync is not part of MVP 1.
- Account-backed sync is desired early.
- Local data remains the primary write path during workouts.
- Guest/local usage should be supported before account creation.
- A signed-in account should unlock backup and sync, not block basic usage.

### Future Integration

The product may later become part of a larger corporate HR/training product for employee learning or development.

Corporate integrations may need workout data for achievements, competitions, or other opt-in mechanics.

### Exercise Catalog

- MVP should include a starter exercise catalog.
- MVP should target around 50 starter exercises.
- A larger catalog around 150 exercises is desirable after the first MVP.
- Exercises should be grouped by muscle group.
- Initial muscle groups should include chest, back, legs, shoulders, biceps, triceps, core, glutes, cardio, full body, and other.
- The default add-exercise flow should start with muscle group selection.
- Users should also be able to search exercises by name immediately.
- Exercises should have a tracking mode that controls what fields are shown during logging.
- Custom exercises are important and should be included in MVP 1 if feasible, or immediately after MVP 1.

Potential tracking modes:

- Weight and repetitions.
- Bodyweight repetitions.
- Time.
- Distance and time.
- Weighted bodyweight.

### Units And Localization

- MVP should support both kg and lb.
- MVP should support Russian and English.
- The localization architecture should support adding more languages later.
- User-facing text must support language switching.
- Domain values that appear in UI, such as muscle group names and exercise names, must be localization-ready.

### Workout Session Model

- A workout does not need a required "start" or "finish" ceremony.
- The app behaves like a set of workout records.
- The primary navigation model is date-based.
- Opening the app should show the current date by default.
- Date navigation should include a compact horizontal date strip.
- Users should be able to open a calendar for date selection.
- The current day screen should show a list of exercises.
- The UI should make it clear when the selected date is not today.
- Past, today, and future dates should be visually distinguished with color.
- Date-state color should be subtle, likely applied to the header/date area or a thin accent, rather than a heavy full-screen background.
- A stronger background tint can be explored in design, but the default direction is restrained.
- Users should be able to edit past dates.
- Users should be able to edit future dates.
- The UI may include a quick return-to-today action when the selected date is not today.
- The exact placement of the return-to-today action is still open.
- Exercises should be expanded by default.
- Users should be able to collapse all exercises.
- Users should be able to collapse a single exercise.
- Users may start a rest timer between sets.
- Approximate workout duration can be inferred from the first rest timer start to the last rest timer end.
- Automatic rest timer behavior should be configurable in settings.
- The exact trigger for automatic rest timer start is not decided yet. Options include after filling set data or after creating/saving a new set.
- The rest timer is an element of the current day screen.

### Previous Result Defaults

- When adding an exercise, Liftbook should immediately create editable sets from the most recent previous result when previous data exists.
- Previous-result defaults should work for past, today, and future dates.
- Sets created from previous results are considered regular completed entries immediately, not a plan that requires confirmation.
- There is no required confirmation step for sets in MVP.
- This behavior should be configurable in settings.

### Set Input

- Weight and repetition input should support direct keyboard entry.
- Weight and repetition input should also support increment/decrement controls.
- The default kg increment/decrement step should be 1 kg.
- The default lb increment/decrement step should be small; the exact value is still open.
- The repetition increment/decrement step should be 1.
- MVP should not require a separate completed/done state for sets.
- Each expanded exercise should provide its own add-set action.
- The add-set action should appear near the existing sets as a potential next set with similar size and shape.

### Exercise Entries

- The same exercise may be added more than once on the same date.

### Empty Day

- Empty days should stay lightweight.
- MVP should show an empty day with a small add-exercise button.
- A richer empty state can be designed later.

### Corporate Data Sharing

- Workout data may be shared with a corporate integration when needed.
- Sharing should be consent-based.

## Open Questions

### Product Scope

- Should workouts be based on templates from day one?
- Should active workout state survive tab/browser closing?
- Which auth methods should be supported first: email/password, magic link, OAuth, passkeys?
- Should custom exercises be in MVP 1 or the first post-MVP release?

### Training Model

- Do we need warm-up sets, working sets, and failure sets?
- Do we need RPE/RIR?
- Do we need unilateral exercises where left/right sides can differ?
- Do we need supersets or circuits?

### Units

- What default lb increment should be used?
- Should weight increments be configurable later?

### History And Progress

- How should the UI display the single previous result compactly?
- Should graphs be part of MVP 1 or later?
- Where should the return-to-today action be placed?
- What exact colors should represent past, today, and future dates?

### Business

- What does "free" mean long-term: no monetization, free core with paid advanced features, or corporate-funded?
- Will future corporate integration require organizations, roles, admin panels, or employee privacy boundaries?
- What should consent-based corporate sharing look like in the product?
