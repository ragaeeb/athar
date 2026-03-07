# Athar Agent Guide

## Purpose

Athar is a web-based 3D educational map game about hadith journeys. The repo currently contains a desktop-first vertical slice with one playable chapter and the supporting architecture that future chapters will build on.

This file is an onboarding reference for new AI agents working in the repo. It should stay concise and current.

## Read First

- [README.md](README.md)
- [docs/architecture.md](docs/architecture.md)

## Stack

- Bun
- Vite
- React 19 + TypeScript
- React Router v7 Data Mode
- Tailwind CSS v4
- Biome
- Zustand
- MapLibre + `react-map-gl/maplibre`
- `react-three-map/maplibre`
- `@react-three/fiber` / `@react-three/drei`
- Framer Motion
- Howler
- Vitest + Playwright

## Commands

- `bun run dev`
- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run test:e2e`
- `bun run test:perf`
- `bun run build`

## Important Code Areas

### Routing

- [src/router.ts](src/router.ts)
- [src/routes/index.tsx](src/routes/index.tsx)
- [src/routes/game/$levelId.tsx](src/routes/game/$levelId.tsx)
- [src/routes/game/complete.tsx](src/routes/game/complete.tsx)

### Map / Scene

- [src/components/MapScene.tsx](src/components/MapScene.tsx)
- [src/components/LevelMap.tsx](src/components/LevelMap.tsx)

### Gameplay

- [src/game/engine/GameLoop.tsx](src/game/engine/GameLoop.tsx)
- [src/game/engine/PlayerController.tsx](src/game/engine/PlayerController.tsx)
- [src/game/engine/CameraController.tsx](src/game/engine/CameraController.tsx)
- [src/game/engine/CollisionSystem.ts](src/game/engine/CollisionSystem.ts)
- [src/game/engine/player-motion.ts](src/game/engine/player-motion.ts)

### State

- [src/game/store/game.store.ts](src/game/store/game.store.ts)
- [src/game/store/player.store.ts](src/game/store/player.store.ts)
- [src/game/store/level.store.ts](src/game/store/level.store.ts)

### Content / Config

- [src/game/levels/level.types.ts](src/game/levels/level.types.ts)
- [src/game/levels/index.ts](src/game/levels/index.ts)
- [src/game/levels/level1.ts](src/game/levels/level1.ts)
- [src/lib/constants.ts](src/lib/constants.ts)
- [src/lib/hadith-data.ts](src/lib/hadith-data.ts)
- [src/lib/geo.ts](src/lib/geo.ts)

### HUD / UI

- [src/game/hud/HUD.tsx](src/game/hud/HUD.tsx)
- [src/game/hud/DialogueBox.tsx](src/game/hud/DialogueBox.tsx)
- [src/components/CharacterSelect.tsx](src/components/CharacterSelect.tsx)

### Tests

- [src/game/engine/player-motion.test.ts](src/game/engine/player-motion.test.ts)
- [src/game/store/gameplay.test.ts](src/game/store/gameplay.test.ts)
- [src/game/store/player.store.test.ts](src/game/store/player.store.test.ts)
- [src/components/CharacterSelect.test.tsx](src/components/CharacterSelect.test.tsx)
- [src/routes/game/complete.test.tsx](src/routes/game/complete.test.tsx)
- [src/test/e2e/athar.spec.ts](src/test/e2e/athar.spec.ts)
- [src/test/e2e/athar.perf.spec.ts](src/test/e2e/athar.perf.spec.ts)

## Current Product Reality

- Level 1 is the only truly playable chapter.
- Levels 2–5 are scaffold data, not finished chapters.
- Teacher/hadith content outside the first slice is still placeholder-heavy.
- Mobile controls, richer audio, and advanced city/world rendering are not done yet.

## Architecture Rules

- Keep authoritative gameplay state separate from per-frame presentation behavior.
- Do not route hot visual transforms through React rerenders unless there is a strong reason.
- Prefer systems / batched runtime logic over per-entity React logic for dirty-flagged or cross-entity behavior.
- Treat content/config validation as part of the runtime contract, not optional polish.

## Debugging

Debug logging is opt-in through [src/lib/debug.ts](src/lib/debug.ts).

- URL: `?atharDebug=1`
- Console:
  - `window.__atharDebug__?.enable()`
  - `window.__atharDebug__?.disable()`
  - `window.__atharDebug__?.text()`
  - `window.__atharDebug__?.clear()`

High-signal channels:

- `controller`
- `store`
- `player`
- `hud`
- `route`

## Perf / Test Bridge

Test-only perf helpers live in [src/lib/dev-tools.ts](src/lib/dev-tools.ts) and the perf metrics live in [src/lib/perf-metrics.ts](src/lib/perf-metrics.ts).

The browser test bridge is exposed as:

- `window.__atharDev__`

Use it for deterministic Playwright/perf scenarios, not for product logic.
