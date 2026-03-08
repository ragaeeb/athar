# ADR 0004: Renderer Seam And Camera Ownership

## Status

Accepted

## Decision

MapLibre remains the authoritative camera host. Three renders gameplay entities through `react-three-map`.

Camera smoothing belongs to the presentation runtime, not the simulation layer and not the input controller.

The simulation layer emits facts. The presentation/runtime layer decides how to visually move the player and how to follow with the camera subject to explicit perf counters.

## Consequences

- camera updates can be tuned independently of gameplay correctness
- manual interaction cooldown logic remains a presentation concern
- future renderer changes should preserve the seam between gameplay facts and visual follow behavior
