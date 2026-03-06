# Athar Agent Guide

## Project Purpose

Athar is a web-based 3D educational map game inspired by Imam al-Bukhari's travels collecting hadith. The current build is a Phase 1 desktop-first vertical slice: title screen, scholar selection, one playable Level 1, core token/teacher/objective loops, and a completion screen.

The long-term intent is to expand this into a multi-level historical journey with richer city rendering, more scholars, more obstacle types, better audiovisual polish, and mobile controls.

## Tech Stack

- Bun for package management and scripts
- Vite + React 19 + TypeScript
- React Router v7 Data Mode via `createBrowserRouter`
- Tailwind CSS v4
- Biome for formatting and linting
- Zustand for state management
- MapLibre via `react-map-gl/maplibre`
- `react-three-map/maplibre` for geospatial Three.js placement
- `@react-three/fiber` + `@react-three/drei`
- `@react-spring/three` for token scatter animation
- Framer Motion for UI motion
- Howler for audio
- Playwright + Vitest for testing

## Key Docs To Read First

- [docs/prompt.md](docs/prompt.md)
  The original product and architecture prompt.
- [docs/architecture.md](docs/architecture.md)
  The current runtime architecture and subsystem boundaries.
- [docs/implementation_plan.md](docs/implementation_plan.md)
  The initial implementation plan that drove the current build.
- [docs/repo-proposal.md](docs/repo-proposal.md)
  The proposed repo organization for long-term scaling and AI-friendly DX.
- [docs/research_prompt.md](docs/research_prompt.md)
  Reusable prompt for deep research agents.
- [docs/future-milestones.md](docs/future-milestones.md)
  Deferred scope from the prompt.
- [docs/claude-opus-4.6-to-gpt-codex-5.4-handoff.md](docs/claude-opus-4.6-to-gpt-codex-5.4-handoff.md)
  The latest high-signal handoff describing the current stable rendering/performance architecture.

## Commands

- `bun run dev`
- `bun run typecheck`
- `bun run biome:check`
- `bun run test`
- `bun run test:e2e`
- `bun run build`

## Repo Structure

### App Shell And Routing

- [src/main.tsx](src/main.tsx)
  App bootstrap.
- [src/App.tsx](src/App.tsx)
  Shared app shell.
- [src/router.ts](src/router.ts)
  Routing source of truth.
- [src/routes/index.tsx](src/routes/index.tsx)
  Title screen and scholar select.
- [src/routes/game/$levelId.tsx](src/routes/game/$levelId.tsx)
  Main gameplay route.
- [src/routes/game/complete.tsx](src/routes/game/complete.tsx)
  Completion screen.

### Map And Scene

- [src/components/MapScene.tsx](src/components/MapScene.tsx)
  Wraps MapLibre + `react-three-map` canvas, basemap style, and interaction tuning.
- [src/components/LevelMap.tsx](src/components/LevelMap.tsx)
  Places all entities into the geospatial scene.

### Gameplay Engine

- [src/game/engine/GameLoop.tsx](src/game/engine/GameLoop.tsx)
  Per-frame orchestration for gameplay state.
- [src/game/engine/PlayerController.tsx](src/game/engine/PlayerController.tsx)
  Keyboard input and player movement only.
- [src/game/engine/CameraController.tsx](src/game/engine/CameraController.tsx)
  Camera follow and manual interaction suppression.
- [src/game/engine/player-motion.ts](src/game/engine/player-motion.ts)
  Pure movement and camera math. This is the best place to add more unit tests before changing runtime behavior.
- [src/game/engine/CollisionSystem.ts](src/game/engine/CollisionSystem.ts)
  Token, teacher, obstacle, and milestone collision logic.

### Entities

- [src/game/entities/PlayerCharacter.tsx](src/game/entities/PlayerCharacter.tsx)
  GLB/procedural player render and animation playback.
- [src/game/entities/TeacherNPC.tsx](src/game/entities/TeacherNPC.tsx)
- [src/game/entities/ObstacleEntity.tsx](src/game/entities/ObstacleEntity.tsx)
- [src/game/entities/HadithToken.tsx](src/game/entities/HadithToken.tsx)
- [src/game/entities/Milestone3DBuilding.tsx](src/game/entities/Milestone3DBuilding.tsx)

### State

- [src/game/store/game.store.ts](src/game/store/game.store.ts)
  Persistent progression and selected character.
- [src/game/store/player.store.ts](src/game/store/player.store.ts)
  Live player state. Currently holds both `coords` and `positionMeters`.
- [src/game/store/level.store.ts](src/game/store/level.store.ts)
  Level config, tokens, objectives, completion state.

### Content And Config

- [src/game/levels/level.types.ts](src/game/levels/level.types.ts)
  Shared level types.
- [src/game/levels/level1.ts](src/game/levels/level1.ts)
  The only truly playable level today.
- [src/game/levels/level2.ts](src/game/levels/level2.ts)
- [src/game/levels/level3.ts](src/game/levels/level3.ts)
- [src/game/levels/level4.ts](src/game/levels/level4.ts)
- [src/game/levels/level5.ts](src/game/levels/level5.ts)
  Levels 2 to 5 are placeholders/scaffolds, not finished content.
- [src/lib/constants.ts](src/lib/constants.ts)
  Character configs, feature flags, asset paths, movement constants.
- [src/lib/hadith-data.ts](src/lib/hadith-data.ts)
  Placeholder teacher text and historical notes.
- [src/lib/geo.ts](src/lib/geo.ts)
  Geographic conversion helpers. This file is critical when debugging coordinate-space issues.
- [src/lib/audio.ts](src/lib/audio.ts)
  Optional audio bootstrap and fallback behavior.

### HUD

- [src/game/hud/HUD.tsx](src/game/hud/HUD.tsx)
  Top-level in-game HUD and drawers.
- [src/game/hud/DialogueBox.tsx](src/game/hud/DialogueBox.tsx)
  Teacher encounter UI.
- [src/game/hud/MissionPanel.tsx](src/game/hud/MissionPanel.tsx)
- [src/game/hud/HadithCounter.tsx](src/game/hud/HadithCounter.tsx)
- [src/game/hud/NavigationLegend.tsx](src/game/hud/NavigationLegend.tsx)

### Tests

- [src/game/store/gameplay.test.ts](src/game/store/gameplay.test.ts)
  Store-level gameplay transitions.
- [src/game/engine/player-motion.test.ts](src/game/engine/player-motion.test.ts)
  Unit tests for movement and camera math.
- [src/components/CharacterSelect.test.tsx](src/components/CharacterSelect.test.tsx)
- [src/routes/game/complete.test.tsx](src/routes/game/complete.test.tsx)
- [src/test/e2e/athar.spec.ts](src/test/e2e/athar.spec.ts)

## What Is Actually Implemented

- Bun/Vite/React app shell
- Explicit React Router v7 Data Mode routes
- Tailwind v4 and Biome setup
- Character select with config-driven variants
- Level registry with one playable level
- Keyboard movement
- Token collection, scattering, rebanking
- Teacher encounter flow and completion
- Objective prioritization and navigation text
- Completion route
- Optional model/audio asset paths with fallbacks

## What Is Still Incomplete

- Only Level 1 is truly playable
- Teacher/hadith content is placeholder text
- Many prompt obstacle types and level layouts are not built
- Mobile joystick/touch controls are not built
- Audio cues and atmosphere are minimal
- City extrusion / richer architecture is not built
- Levels 2 to 5 remain mostly scaffold content

## Debug Logging Strategy

Debug logging is opt-in and centralized in:

- [src/lib/debug.ts](src/lib/debug.ts)

### How To Enable

- Add `?atharDebug=1` to the URL, or
- Run `window.__atharDebug__?.enable()` in the browser console

### How To Read Or Export Logs

- `window.__atharDebug__?.logs`
- `window.__atharDebug__?.text()`
- `window.__atharDebug__?.clear()`
- `window.__atharDebug__?.disable()`

Logs are deliberately flattened into one-line text for easier copy/paste.

### High-Value Channels

- `controller`
  Input events, movement steps, manual camera interaction, movement stop
- `store`
  Player position/bearing writes
- `player`
  GLB load, clip selection, pose updates
- `hud`
  Navigation/objective updates
- `route`
  Dev-tools attachment and route-level lifecycle

Noisy frame-by-frame marker logs were intentionally removed because they obscured the useful signals.

## Current Risk Area

The earlier movement and camera instability was resolved, but the current architectural watchpoints are:

- `coordsToVector3` precision over very large route spans
- growth pressure on `GameLoop.tsx` as more mechanics are added
- scaling costs from many `Coordinates` portals as entity counts rise
- long-term repo organization as new play modes arrive

Read [docs/architecture.md](docs/architecture.md), [docs/performance-lag.md](docs/performance-lag.md), and [docs/claude-opus-4.6-to-gpt-codex-5.4-handoff.md](docs/claude-opus-4.6-to-gpt-codex-5.4-handoff.md) before changing the rendering or movement stack.
