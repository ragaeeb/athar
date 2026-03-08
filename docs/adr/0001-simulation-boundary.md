# ADR 0001: Simulation Boundary

## Status

Accepted

## Decision

Athar gameplay rules run behind a pure simulation boundary under `src/features/gameplay/simulation/**`.

The simulation layer:

- owns authoritative rule evaluation
- advances on a fixed timestep accumulator
- emits gameplay facts/events instead of mutating React, Three, or MapLibre directly
- does not import React, DOM, Three, `@react-three/fiber`, `react-map-gl`, or `react-three-map`

The React runtime bridge in `src/features/gameplay/systems/GameLoop.tsx` is responsible for:

- reading current app/store input
- advancing the simulation runner
- committing safe store updates
- forwarding emitted events to audio/presentation hooks

## Consequences

- gameplay can be tested without canvas or DOM
- simulation logic scales better than a growing frame-bound React orchestrator
- runtime/presentation bugs can be isolated from rule bugs
