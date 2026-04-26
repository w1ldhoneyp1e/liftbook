# Domain Model Draft

## Core Entities

### User

Represents a person using Liftbook. Account support is desired early, but local workout logging must not depend on an active network connection.

Users may start as local/guest users and later attach an account for backup and sync.

### Exercise

Represents a movement that can be added to a workout record.

Important fields:

- Stable id.
- Localized name.
- Muscle group ids.
- Tracking mode.
- Built-in or custom flag.

### Muscle Group

Represents a group used to browse and filter exercises.

Initial examples:

- Chest
- Back
- Legs
- Shoulders
- Biceps
- Triceps
- Core
- Glutes
- Full body
- Cardio
- Other

Names must be localized.

### Workout Record

Represents a user's workout entry. It does not require a strict start or finish event.

Important fields:

- User id or local owner id.
- Workout date.
- Local created timestamp.
- Optional title.
- Optional notes.
- Exercise entries.
- Optional inferred duration.

### Exercise Entry

Represents one exercise inside a workout record.

The same exercise can appear more than once in the same workout record.

Important fields:

- Exercise id.
- Position/order.
- Set entries.
- Previous-result source, if defaults were generated from prior history.

### Set Entry

Represents a set entry.

MVP does not distinguish planned vs completed sets. Sets generated from previous results are treated as regular entries immediately and can be edited or deleted.

Possible fields depend on exercise tracking mode:

- Weight.
- Weight unit.
- Repetitions.
- Duration.
- Distance.
- Bodyweight flag.
- Notes.

### Rest Timer Event

Represents rest timing between sets.

Rest timer events can be used to infer approximate workout duration from the first rest start to the last rest end.

### User Settings

Represents preferences that affect logging and display.

Important fields:

- Preferred weight unit: kg or lb.
- Locale: initially ru or en.
- Automatic rest timer setting.
- Previous-result defaults enabled flag.
- Kg increment step, default 1 kg.
- Lb increment step, default still open.

### Sharing Consent

Represents user consent to share workout data with an external or corporate integration.

Important fields:

- Integration id.
- Scope of shared data.
- Consent status.
- Granted timestamp.
- Revoked timestamp.

## Previous Result Rule

When a user adds an exercise to a workout record, Liftbook should find the most recent previous workout record containing the same exercise.

If found, Liftbook can pre-create the same number of sets with the same weight and repetition values as editable defaults.

Only the single most recent previous result is needed for MVP.

## Starter Catalog Scope

MVP should include around 50 built-in exercises. A larger catalog around 150 exercises is desirable after MVP 1.

Custom exercises are important and should be implemented in MVP 1 if feasible, or immediately after MVP 1.
