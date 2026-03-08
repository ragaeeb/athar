# ADR 0003: Coordinate Authority And Origin Rebasing

## Status

Accepted

## Decision

Athar keeps player authority in local meter-space relative to the chapter origin, while preserving geospatial coordinates for rendering/collision/camera use.

Shared geographic helpers live in `src/shared/geo.ts`. Map-specific helpers stay in `src/features/map/lib/geo.ts`.

Origin rebasing precision is treated as a tested contract:

- meter offsets must round-trip to chapter-scale route endpoints within tight tolerance
- rebasing helpers must be framework-agnostic

## Consequences

- gameplay logic does not depend on MapLibre APIs
- coordinate math can be unit-tested directly
- future long-route chapters can tighten precision without touching gameplay systems
