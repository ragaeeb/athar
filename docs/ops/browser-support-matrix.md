# Browser And Device Support Matrix

## Release Target

Athar is currently a desktop-first web game.

Primary supported target for the current release candidate:

- macOS desktop on current stable Chromium
- Windows desktop on current stable Chromium

Manual/advisory coverage:

- macOS Safari 17+
- Desktop Firefox current stable

Explicitly out of scope for the current release candidate:

- iOS Safari
- Android Chrome
- tablet/touch-first gameplay
- narrow mobile layouts

## Functional Expectations

### Merge-blocking expectations

These must pass on the primary supported target:

- app boot and route loading
- chapter progression through Levels 1 to 5
- save persistence and replay-safe verified totals
- keyboard traversal
- pause/restart flow
- completion flow
- audio bootstrap with checked-in placeholder pack
- no blocking runtime overlay during standard smoke flow

### Advisory expectations

These are monitored but not current release blockers:

- `bun run test:perf`
- desktop Safari smoke
- desktop Firefox smoke
- bundle size review
- visual review of imported 3D assets and lighting

## Input Support

Supported:

- keyboard traversal (`WASD` / arrow keys)
- mouse map interaction

Best-effort only:

- touch controls

Not supported:

- gamepad
- mobile gestures as a primary interaction model

## Resolution Guidance

Recommended desktop viewport:

- 1280x800 or larger

Minimum practical QA viewport:

- 1024x768

Below that, UI readability and map/HUD composition are not part of the supported matrix for this release candidate.
