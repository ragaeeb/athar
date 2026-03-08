# ADR 0007: Error And WebGL Recovery

## Status

Accepted

## Decision

Athar handles failure at the route/runtime boundary first.

Expected categories:

- invalid or missing chapter content
- map/asset load failures
- WebGL context lost/restored events

Route-level failures must produce a user-visible route error state. Rendering/runtime failures should prefer recoverable fallbacks over silent breakage.

## Consequences

- route failures are debuggable and testable
- rendering faults are isolated from gameplay rules where possible
- future asset density increases must include disposal and recovery considerations
