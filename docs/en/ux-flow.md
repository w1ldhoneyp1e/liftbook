# MVP UX Flow

## Primary Navigation

The main navigation model is date-based.

When the user opens Liftbook, the app shows the current date by default.

The current date screen is the main working screen during a workout.

The UI should make it clear whether the selected date is past, today, or future.

The preferred direction is subtle color differentiation in the date/header area or a thin accent. A full-screen background tint can be explored, but should not make the workout inputs harder to scan.

Past and future dates can be edited.

## Current Date Screen

The current date screen should show:

- Selected date.
- Compact horizontal date navigation.
- Calendar open action.
- List of exercises for that date.
- Add exercise action.
- Rest timer element for the current day.
- Access to settings or profile.

The screen should not require a formal "start workout" or "finish workout" action.

## Add Exercise Flow

Default flow:

1. User taps add exercise.
2. User sees muscle groups.
3. User selects a muscle group.
4. User selects an exercise.
5. Exercise is added to the current date.

Search flow:

1. User taps add exercise.
2. User can immediately search by exercise name.
3. User selects a matching exercise.
4. Exercise is added to the current date.

## Previous Result Defaults

When an exercise is added and previous data exists, Liftbook should immediately create editable sets using the most recent previous result.

Example:

- Previous bench press: 60 kg x 8, 60 kg x 8, 60 kg x 7.
- New bench press entry gets three editable sets with the same weight and reps.

This behavior should be configurable in settings.

Generated previous-result sets are regular entries immediately. There is no confirmation step.

Previous-result defaults should work for past, today, and future dates.

## Exercise List

The active date screen should show a list of exercises.

Exercises are expanded by default.

The user should be able to:

- Collapse all exercises.
- Expand all exercises.
- Collapse or expand a single exercise.

Each expanded exercise should show its sets directly.

## Set Input

Set input should be optimized for fast gym usage.

For weight and repetitions, users should be able to:

- Type a value with the keyboard.
- Increase or decrease a value with controls.

Default steps:

- Repetitions: 1.
- Weight in kg: 1 kg.
- Weight in lb: small step, exact value still open.

MVP does not require a completed checkbox or a separate done state.

Each expanded exercise should show an add-set action near the existing sets. It should feel like the next potential set and be similar in size and shape to existing set rows.

## Empty Day

An empty day should stay visually lightweight.

MVP should show a small add-exercise action. A richer empty state can be designed later.

## Rest Timer

The rest timer belongs to the current date screen.

Manual timer support is required.

Automatic timer behavior should be configurable. The exact automatic trigger is still open:

- After filling set data.
- After creating a new set.
- After saving/confirming a set.
