# MVP 2 Plan

Date: 2026-05-01

MVP 2 goal: make repeated training workflows faster and noticeably improve day-to-day usability without turning Liftbook into a much larger platform too early.

Before active work on new features, the known issues from [docs/en/mvp2-found-issues.md](/home/kirill-yashmetov/projects/liftbook/docs/en/mvp2-found-issues.md) should be closed first.

## Product focus

After MVP 1, we already have:

- a working workout journal;
- an offline-first flow;
- guest account plus basic sync;
- backend running on a self-managed VPS.

So the main question for MVP 2 is no longer “can the product be used”, but:

**how do we reduce workout-time friction and repeated input.**

## Main MVP 2 goals

1. reduce repeated manual input;
2. speed up common workout assembly patterns;
3. make exercise history more useful during the workout itself;
4. avoid inflating the product into a full analytics platform too early.

## What belongs in MVP 2

## 1. Workout templates

Why:

- users often repeat similar workout days;
- right now those days still need to be rebuilt manually.

What to add:

- create a template from the current day;
- apply a template to a selected date;
- edit a template;
- delete a template.

MVP scope:

- no sharing;
- no coach workflows;
- no template marketplace.

## 2. Reuse previous workout

Why:

- this is faster than adding exercises one by one.

What to add:

- copy exercises and sets from a previous day;
- insert them into the current date;
- keep the result editable immediately after insert.

## 3. Exercise history as a working tool

Why:

- over time, a single “previous result” becomes too limited.

What to add:

- an exercise history screen;
- the latest several executions;
- dates plus reps/weight snapshots;
- quick access from the exercise card.

Focus:

- not analytics for its own sake;
- first, a practical decision-making tool during the workout.

## 4. Notes for exercise or set

Why:

- sometimes users need context: technique, pain, tempo, pause, or a short set comment.

What to add:

- short exercise note;
- short set note.

MVP scope:

- no rich text;
- no attachments;
- plain text only.

## 5. Extended set metadata

Why:

- not all sets are equal;
- some users want to distinguish warm-up and working sets.

What to add:

- warm-up;
- working set;
- failure / near failure;
- possibly later: RPE/RIR, but only if it does not overload UX.

Recommendation:

- do not make this mandatory in MVP 2;
- keep it as a lightweight optional tag.

## 6. Exercise catalog expansion

Why:

- 50 exercises was enough for MVP 1, but it will quickly become limiting.

What to add:

- move toward ~150 exercises;
- normalize muscle groups and naming;
- keep user-defined custom exercises as first-class entities.

## What does not belong in MVP 2 yet

- full analytics and large chart surfaces;
- production-grade multi-device sync;
- social features;
- corporate integration;
- coach mode;
- payments;
- roles and organizations.

## Technical focus for MVP 2

These product features will need a few technical foundations:

1. extend the domain model for templates;
2. carefully extend sync payloads for notes and set metadata;
3. evolve the server-side schema safely without breaking existing MVP 1 guest users;
4. avoid slowing down the mobile-first flow in exchange for richer entities.

## Recommended implementation order

### Phase 0. Close known issues

Items from `mvp2-found-issues.md` come first.

Only after that should the new product workflows below be taken on.

If MVP 2 is built iteratively, I would do it in this order:

1. **Exercise history**
2. **Reuse previous workout**
3. **Workout templates**
4. **Notes**
5. **Set metadata**
6. **Catalog expansion**

### Why this order

- history and reuse give immediate practical value;
- templates become clearer after the reuse flow exists;
- notes and set metadata are better added after the main UX model is stable;
- the catalog matters, but should not consume all attention before the core workflow does.

## MVP 2 readiness criteria

MVP 2 can be considered complete if:

- repeated workouts are noticeably faster to assemble than in MVP 1;
- users have a practical way to rely on exercise history;
- notes and set metadata do not overload the main flow;
- the product stays fast in mobile use;
- sync and backend remain compatible with existing MVP 1 data.
