# ADR 0002: Presentation Boundary And Scene Registry

## Status

Accepted

## Decision

Per-frame visual ownership lives in the presentation layer, not in broad React rerenders.

Athar uses a scene registry under `src/features/gameplay/presentation/**` to:

- register stable entity refs by ID
- store presentation-only dirty flags and transient state
- let presentation systems update hot transforms imperatively

The first active use is the player/camera hot path. Further entity classes should move into the registry over time rather than reintroducing ad hoc per-entity frame logic.

## Consequences

- StrictMode-safe ref registration is required
- authoritative gameplay facts stay in simulation/store state
- transient presentation state is allowed to be mutable and non-persistent
