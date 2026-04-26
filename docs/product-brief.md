# Product Brief

## Name

Liftbook

## Vision

Liftbook is a fast, free, mobile-first workout journal for people who train in the gym and need a convenient way to log exercises, sets, reps, and weight.

The product may later become either a standalone service or a feature inside a larger corporate HR/training product.

## Primary Customer View

As a product owner, we want the first version to prove that Liftbook can be used during a real workout without friction:

- The user opens the app on an iPhone.
- The user starts a workout.
- The user adds exercises.
- The user logs sets with weight and reps.
- The user sees or reuses the previous result for the same exercise before doing the next set.
- The app works without internet.

## Target Users

- Ordinary gym-goers who need a simple workout log.
- More advanced athletes who care about previous performance and progression.

## Differentiation

Many workout trackers are paid or become paid after core usage grows. Notes and spreadsheets are flexible but too slow during a workout.

Liftbook should be:

- Free for the core workout journal experience.
- Faster than notes or spreadsheets.
- Reliable offline.
- Focused on entering workout results with minimal taps.

## Product Principles

- Mobile-first: every core screen should be designed for one-handed phone use.
- Offline-first: the workout journal must work without internet.
- Local-first data entry: logging should never wait for a server response.
- Translatable UI: all user-facing text should go through localization.
- Guest-friendly: users should be able to start without signing in.
- Free core: basic workout logging should remain free.

## Future Option

Liftbook may be integrated into a larger corporate product for employee development/training. This suggests the architecture should support:

- API-first integration.
- Domain boundaries.
- Sync and ownership rules.
- Future account and organization concepts.
- Possible extraction of domains into separate services.
- Selective sharing of workout data when corporate features require achievements, challenges, or competitions.
- Consent-based access to personal workout data.
