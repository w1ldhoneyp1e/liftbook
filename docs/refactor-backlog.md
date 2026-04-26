# Refactor Backlog

This document keeps known refactoring ideas that should not interrupt MVP flow but should stay visible.

## i18n

- Split dictionaries by file.
- Use one file per language, for example `en.ts` and `ru.ts`.

## Components

- Decompose large UI components.
- Start with the day screen once behavior stabilizes.
- Likely extraction targets:
  - date header
  - rest timer row
  - exercise card
  - set row
  - set number control
