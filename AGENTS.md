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

- [src/app/router.ts](src/app/router.ts)
- [src/app/routes/index.tsx](src/app/routes/index.tsx)
- [src/app/routes/game/level-route.tsx](src/app/routes/game/level-route.tsx)
- [src/app/routes/game/complete.tsx](src/app/routes/game/complete.tsx)

### Map / Scene

- [src/features/map/components/MapScene.tsx](src/features/map/components/MapScene.tsx)
- [src/features/map/components/LevelMap.tsx](src/features/map/components/LevelMap.tsx)

### Gameplay

- [src/features/gameplay/systems/GameLoop.tsx](src/features/gameplay/systems/GameLoop.tsx)
- [src/features/gameplay/controllers/PlayerController.tsx](src/features/gameplay/controllers/PlayerController.tsx)
- [src/features/gameplay/presentation/PresentationRuntime.tsx](src/features/gameplay/presentation/PresentationRuntime.tsx)
- [src/features/gameplay/presentation/SceneRegistry.ts](src/features/gameplay/presentation/SceneRegistry.ts)
- [src/features/gameplay/simulation/core/SimulationRunner.ts](src/features/gameplay/simulation/core/SimulationRunner.ts)
- [src/features/gameplay/systems/CollisionSystem.ts](src/features/gameplay/systems/CollisionSystem.ts)
- [src/features/gameplay/systems/player-motion.ts](src/features/gameplay/systems/player-motion.ts)

### State

- [src/features/gameplay/state/game.store.ts](src/features/gameplay/state/game.store.ts)
- [src/features/gameplay/state/player.store.ts](src/features/gameplay/state/player.store.ts)
- [src/features/gameplay/state/level.store.ts](src/features/gameplay/state/level.store.ts)

### Content / Config

- [src/content/levels/types.ts](src/content/levels/types.ts)
- [src/content/levels/registry.ts](src/content/levels/registry.ts)
- [src/content/levels/level-1/config.ts](src/content/levels/level-1/config.ts)
- [src/shared/constants/gameplay.ts](src/shared/constants/gameplay.ts)
- [src/content/scholars/scholar-profiles.ts](src/content/scholars/scholar-profiles.ts)
- [src/shared/geo.ts](src/shared/geo.ts)

### HUD / UI

- [src/features/hud/components/HUD.tsx](src/features/hud/components/HUD.tsx)
- [src/features/hud/components/DialogueBox.tsx](src/features/hud/components/DialogueBox.tsx)
- [src/features/characters/components/CharacterSelect.tsx](src/features/characters/components/CharacterSelect.tsx)

### Tests

- [src/features/gameplay/presentation/SceneRegistry.test.ts](src/features/gameplay/presentation/SceneRegistry.test.ts)
- [src/features/gameplay/simulation/core/SimulationRunner.test.ts](src/features/gameplay/simulation/core/SimulationRunner.test.ts)
- [src/features/gameplay/systems/player-motion.test.ts](src/features/gameplay/systems/player-motion.test.ts)
- [src/features/gameplay/state/gameplay.test.ts](src/features/gameplay/state/gameplay.test.ts)
- [src/features/gameplay/state/player.store.test.ts](src/features/gameplay/state/player.store.test.ts)
- [src/features/gameplay/state/game.store.test.ts](src/features/gameplay/state/game.store.test.ts)
- [src/features/characters/components/CharacterSelect.test.tsx](src/features/characters/components/CharacterSelect.test.tsx)
- [src/app/routes/game/level.loader.test.ts](src/app/routes/game/level.loader.test.ts)
- [src/app/routes/game/complete.test.tsx](src/app/routes/game/complete.test.tsx)
- [src/test/e2e/athar.spec.ts](src/test/e2e/athar.spec.ts)
- [src/test/e2e/athar.perf.spec.ts](src/test/e2e/athar.perf.spec.ts)

## Current Product Reality

- Level 1 is the only truly playable chapter.
- Levels 2–5 are scaffold data, not finished chapters.
- Teacher/hadith content outside the first slice is still placeholder-heavy.
- Mobile controls, richer audio, and advanced city/world rendering are not done yet.
- `public/audio/**` currently contains placeholders only; the app now disables audio at startup when the configured files are missing.

## Architecture Rules

- Keep authoritative gameplay state separate from per-frame presentation behavior.
- Keep simulation code pure: no React, DOM, Three, or MapLibre imports inside `src/features/gameplay/simulation/**`.
- Do not route hot visual transforms through React rerenders unless there is a strong reason.
- Do not keep hot gameplay Zustand subscriptions in route-level components above `MapScene` / `GameLoop` / `LevelMap`; subscribe in leaf HUD/overlay components instead.
- Prefer systems / batched runtime logic over per-entity React logic for dirty-flagged or cross-entity behavior.
- Treat content/config validation as part of the runtime contract, not optional polish.

## Debugging

Debug logging is opt-in through [src/features/debug/debug.ts](src/features/debug/debug.ts).

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
- spike/problem events are intentionally logged in all caps, for example `GAME_LOOP_SPIKE`, `PRESENTATION_FRAME_SPIKE`, `LONG_TASK`

## Perf / Test Bridge

Test-only perf helpers live in [src/features/debug/dev-tools.ts](src/features/debug/dev-tools.ts) and the perf metrics live in [src/features/debug/perf-metrics.ts](src/features/debug/perf-metrics.ts).

The browser test bridge is exposed as:

- `window.__atharDev__`

Use it for deterministic Playwright/perf scenarios, not for product logic.
