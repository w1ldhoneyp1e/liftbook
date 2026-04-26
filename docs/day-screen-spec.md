# Day Screen MVP Spec

## Purpose

The day screen is the primary Liftbook screen. It is where the user logs exercises, sets, weight, and repetitions for a selected date.

## Layout Priorities

- Mobile-first.
- Dense enough for gym use.
- One-handed friendly.
- Minimal empty states.
- No required start or finish action.

## Header Area

The header should include:

- Current selected date.
- Compact horizontal date strip.
- Calendar button.
- Optional settings/profile access.

The app opens on today's date by default.

The UI should clearly communicate whether the selected date is past, today, or future.

The preferred direction is subtle color differentiation, such as:

- Date/header accent color.
- Thin top or side accent.
- Soft header tint.

A full-screen background tint can be explored, but should stay restrained so the workout inputs remain easy to scan.

Past and future dates are editable.

When the selected date is not today, the UI may show a return-to-today action. Exact placement is still open.

## Date Navigation

Primary date navigation:

- Horizontal date strip.

Secondary date navigation:

- Calendar picker opened from the day screen.

Optional helper:

- Return-to-today action when the selected date is not today.

## Exercise Area

The day screen shows a list of exercises for the selected date.

The same exercise may appear more than once on the same date.

Default behavior:

- Exercises are expanded by default.
- A collapse-all control is available.
- Each exercise has its own collapse/expand control.

## Exercise Item

An expanded exercise item should include:

- Exercise name.
- Muscle group or small metadata if useful.
- Collapse/expand control.
- Set rows.
- Add-set row/action.

## Set Row

For MVP weight-and-reps exercises, a set row should support:

- Weight input.
- Repetition input.
- Keyboard entry.
- Increment/decrement controls.

Default steps:

- Repetitions: 1.
- Weight in kg: 1 kg.
- Weight in lb: small step, exact value still open.

MVP does not require a separate completed/done state for sets. Entered or generated set rows are treated as regular workout entries.

## Add-Set Action

Each expanded exercise has its own add-set action.

The add-set action should be placed near existing sets and look like a potential next set with similar size and shape.

## Empty Day

If the selected date has no exercises, the screen should remain simple and show a small add-exercise button.

A richer empty state can be designed later.

## Rest Timer

The rest timer is part of the day screen.

MVP requires manual timer support.

Automatic timer behavior is configurable and can be implemented when the trigger is decided.
