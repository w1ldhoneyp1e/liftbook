# MVP Roadmap

## MVP 1: Offline Workout Journal With Account

Goal: the user can complete a real gym workout using Liftbook on iPhone, fully offline.

Core features:

- Install/open as an app-like mobile experience.
- Guest/local usage without signing in.
- Account support or a clear account-ready path for backup/sync.
- Optional guest account creation from settings when API is available.
- Manual push sync for pending local records after guest account creation.
- Date-based workout navigation with current date shown by default.
- Add workout records without requiring a strict start/finish flow.
- Add exercises to workout.
- Add exercises through muscle group selection with direct name search available.
- Add sets.
- Enter reps and weight.
- Support kg and lb.
- Support Russian and English UI text.
- Include around 50 starter exercises grouped by muscle group.
- Create custom exercises.
- Rename and delete custom exercises.
- Support exercise-specific tracking modes.
- View the previous result for the same exercise.
- Create default sets from the previous result when adding an exercise.
- Add a setting to disable previous-result default set creation.
- Start a rest timer between sets.
- Add a setting for automatic rest timer behavior, if implementation cost is acceptable.
- Show the rest timer inside the current day screen.
- Infer approximate workout duration from rest timer usage.
- View workout history.
- Persist everything locally.

Out of scope:

- Full cloud sync, if account support lands first as identity only.
- Payments.
- Social features.
- Corporate integration.
- Trainer/client mode.
- Workout templates.

## MVP 2: Better Training Workflow

Goal: reduce repeated input and make common routines faster.

Possible features:

- Workout templates.
- Reuse previous workout.
- Expand built-in catalog toward 150 exercises.
- Notes per exercise or set.
- Edit completed workouts.
- Advanced set metadata: warm-up, working set, failure, RPE/RIR.

## MVP 3: Progress And Insights

Goal: make progression visible.

Possible features:

- Personal records.
- Exercise history screen.
- Volume charts.
- Estimated 1RM.
- Recent performance comparison.

## MVP 4: Sync And Multi-Device

Goal: protect data and allow multi-device usage.

Possible features:

- Cloud backup.
- Multi-device sync.
- Conflict handling.
- Export/import.

## MVP 5: Integration Readiness

Goal: prepare Liftbook as a service or module inside a bigger product.

Possible features:

- Public/internal API.
- Organization model.
- Role model.
- Consent-based workout data sharing.
- Integration events.
- Admin/ownership boundaries.
