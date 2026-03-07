# ADR 0006: Persistence And Versioning

## Status

Accepted

## Decision

Only progression state persists across sessions.

The progression store:

- exports `SAVE_VERSION`
- uses explicit migrations
- persists only chapter/progression facts

Player state, level runtime state, camera state, animation state, and other transient values do not persist by default.

## Consequences

- reload behavior stays predictable
- migrations are explicit and testable
- future persistence growth must justify itself against the progression-only baseline
