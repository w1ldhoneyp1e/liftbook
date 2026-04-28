# Architecture

## Direction

Liftbook should start as a modular monolith, not as a distributed microservice system.

The codebase should be organized around clear domain boundaries so that parts can later be extracted into services if the product grows or becomes part of a larger corporate platform.

## Why Not Start With Microservices

Microservices would introduce early complexity:

- Separate deployment pipelines.
- Network calls between domains.
- Distributed transactions.
- Observability requirements.
- Inter-service authentication.
- Event delivery and retry logic.
- API versioning.

For MVP work, these costs would slow product discovery. The better initial tradeoff is a modular monolith with strict boundaries and integration-ready APIs.

## Domain Boundaries

Potential domains:

- `workout-core`: workouts, exercises in workout, sets, reps, weight, history.
- `exercise-catalog`: built-in and custom exercises.
- `programs`: workout templates and training plans.
- `sync`: local operation log, conflict handling, server synchronization.
- `identity`: users, accounts, sessions.
- `i18n`: locale routing, translation dictionaries, localized domain labels.
- `analytics`: personal records, progression, charts.
- `integrations`: future adapters for external/corporate products.

## PWA And Offline-First

The active workout flow must not depend on network availability.

Local persistence is the primary write path during workouts. Server sync should be asynchronous and resilient:

- Write locally first.
- Record syncable operations.
- Update UI immediately.
- Sync when online.
- Resolve conflicts explicitly.
- Prefer soft deletes for workout data so offline deletions can be synchronized later.

Account support should not change the local-first write path. Authentication can unlock backup and multi-device sync, but the app must still let users log workouts when the network is unavailable.

The app should support local/guest usage and later account attachment. This prevents sign-in from becoming a blocker during the first workout.

The first web implementation stores a local guest account session in IndexedDB after a successful API request. This session is optional and should never block local workout writes.

## Repository Structure

Use a pnpm monorepo:

- `apps/web`: Next.js PWA application.
- `apps/api`: custom backend API, added when backend work starts.
- `packages/domain`: shared domain types, schemas, and business rules.
- `packages/config`: shared TypeScript, lint, and formatting configuration if needed.

This structure supports a modular monolith today and gives us room to split services later.

## Chosen Frontend Stack

- Next.js with App Router
- React
- TypeScript
- pnpm
- Tailwind CSS
- shadcn/ui
- Client-side offline workout shell
- IndexedDB-based local database
- PWA manifest and service worker
- Localization/i18n support from the first UI implementation

shadcn/ui is acceptable for a mobile-first app because components are copied into the codebase and styled with Tailwind CSS. Mobile-first behavior will come from our layout, spacing, component composition, and use of mobile-friendly primitives such as Drawer where appropriate.

## Backend Direction

Use a custom backend rather than a hosted backend-as-a-service.

The backend should start as a modular TypeScript service, likely in `apps/api`, with clear boundaries for:

- identity
- sync
- workout data
- integrations

The backend is not required for the first offline logging flow, but its contracts should be considered early so local data and sync operations can evolve cleanly.

The initial repository skeleton includes `apps/api` as a dependency-free Node service. It defines health, guest account, and sync endpoints before choosing a production web framework, database, or authentication provider.

Backend implementation options are tracked in [Backend Research](backend-research.md). The likely direction is a TypeScript modular monolith with PostgreSQL and either Fastify or NestJS.

## Local Database Options

### Dexie

Dexie is a browser-first wrapper around IndexedDB. It is a good fit for a web/PWA-first product when we want control, relatively low complexity, and explicit sync design.

### WatermelonDB

WatermelonDB is an offline-first reactive database often used in React Native contexts and larger local data models. It can be considered if Liftbook is expected to move strongly toward React Native or needs a more opinionated database/sync model.

## Initial Recommendation

Use Dexie initially unless future React Native compatibility becomes a near-term requirement.

Keep the workout experience as a client-side offline-first app shell. Avoid relying on server rendering for core gym usage.

## Data Ownership

Local data is the source of truth while the user is training. Server-side data becomes the durable backup and multi-device sync target.

Future corporate integration should be modeled as selective data sharing, not as a default assumption that all personal workout data belongs to an organization.

Data sharing should be consent-based. The integration model should make it possible to grant and revoke access to workout data scopes.

## Sync Preparation

Local entities that can later sync to the backend should have stable client ids, optional server ids, timestamps, a deleted timestamp, and a sync status.

The current client marks local changes as `pending`. A later sync engine can scan pending records, push them to the backend, update `serverId`, and mark records as `synced` after confirmation.

The first sync UI is manual and lives in Settings. It sends pending local records to the API, marks accepted records as `synced`, and stores the returned cursor on the local account session.

Conflict handling is intentionally not implemented in MVP UI yet. The data model reserves `conflict` as a sync status so the product can later surface records that need user or server-side resolution.

## Product Data Risk

MVP does not distinguish planned and completed sets. Sets generated from previous results are regular entries immediately.

This keeps logging fast, but it means accidental generated sets can affect history/statistics unless the user edits or deletes them. Later versions may need undo, change history, or softer draft semantics if this becomes a real usability issue.
