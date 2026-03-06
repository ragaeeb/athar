# Athar Architecture

## Purpose

This document tracks the current architecture of Athar as it exists today, not the ideal end state. It should answer:

- what the app is made of
- what is authoritative state versus derived state
- how rendering, movement, camera, and gameplay flow work
- where the main extension points and architectural risks are

## Product Shape

Athar is a web-based 3D map game with:

- a geographic map backdrop
- Three.js-rendered gameplay entities
- route-based level loading
- one shared vertical-slice gameplay loop reused across levels

The current release target is a desktop-first playable slice. The long-term roadmap includes more levels, richer city scenes, mobile controls, better content pipelines, and potentially additional play modes such as combat or military encounters.

## Tech Stack

- Bun
- Vite
- React 19
- TypeScript
- React Router v7 Data Mode
- Zustand
- MapLibre via `react-map-gl/maplibre`
- `react-three-map/maplibre`
- `@react-three/fiber`
- `@react-three/drei`
- `@react-spring/three`
- Framer Motion
- Tailwind CSS v4
- Howler
- Biome
- Vitest + Playwright

## Runtime Layers

### App Layer

- `src/main.tsx`
  Bootstraps the app, initializes MapLibre worker count, and mounts the router.
- `src/router.ts`
  Defines the route tree.
- `src/App.tsx`
  Shared shell/root layout.

### Route Layer

- `src/routes/index.tsx`
  Landing page, scholar selection, progress summary, level listing.
- `src/routes/game/$levelId.tsx`
  Main gameplay route. Loads a level, initializes state, mounts rendering and controllers.
- `src/routes/game/complete.tsx`
  Completion summary flow.

### Scene Layer

- `src/components/MapScene.tsx`
  Owns the MapLibre map, `react-three-map` canvas, lighting, and map interaction tuning.
- `src/components/LevelMap.tsx`
  Places level entities and the player marker into the scene.

### Gameplay Layer

- `src/game/engine/PlayerController.tsx`
  Keyboard input and player movement updates.
- `src/game/engine/CameraController.tsx`
  Camera follow and manual camera interaction suppression.
- `src/game/engine/GameLoop.tsx`
  Per-frame collision, encounter, milestone, token, and win-condition evaluation.
- `src/game/engine/CollisionSystem.ts`
  Pure gameplay queries for proximity and objective resolution.
- `src/game/engine/player-motion.ts`
  Shared movement and camera math utilities.

### State Layer

- `src/game/store/game.store.ts`
  Persistent progression and scholar selection.
- `src/game/store/player.store.ts`
  Live player state, movement, dialogue, and losable tokens.
- `src/game/store/level.store.ts`
  Active level config, objectives, tokens, completion state.

### Content Layer

- `src/game/levels/*.ts`
  Level configs and registry.
- `src/lib/hadith-data.ts`
  Teacher profiles and placeholder text.
- `src/lib/constants.ts`
  Character config, asset paths, movement numbers, style constants.

## Rendering Architecture

### Basemap

Athar uses raster MapLibre styles rather than vector styles. This is a deliberate performance choice.

Why:

- the map is a backdrop, not the primary interactive content
- the game draws its own labels and 3D entities
- raster tiles remove the vector tile parsing/tessellation cost that caused the earlier movement lag

### Three Layer

`react-three-map` shares the WebGL context between MapLibre and React Three Fiber. Three renders:

- player
- scholars
- tokens
- milestone buildings
- obstacles
- map labels

### Player Placement

The player is not placed through a declarative `NearCoordinates` wrapper anymore. Instead:

- `LevelMap` mounts a `PlayerMarker` inside a `Coordinates` portal at the level origin
- `PlayerMarker` updates its `group.position` imperatively each frame using `coordsToVector3(playerCoords, levelOrigin)`

This was introduced to remove movement jitter caused by declarative per-frame reconciliation.

## Movement And Camera

### Authoritative Movement Model

Player movement operates in local meter-space relative to the level origin.

Player state keeps:

- `coords`
- `positionMeters`
- `bearing`
- `speed`

The current practical model is:

- movement updates `positionMeters`
- geographic `coords` are derived via `offsetCoords(origin, positionMeters)`
- camera follow uses `coords`
- collision and objectives use `coords`

### Camera

Camera follow is owned by `CameraController`, not `PlayerController`.

Current behavior:

- deadzone-based follow
- max follow speed
- manual zoom/drag/rotate/pitch cooldown
- `map.jumpTo()` follow updates
- delta cap to prevent runaway leaps during bad frames

### Current Tradeoff

This architecture is stable enough for the current slice, but it still depends on:

- `react-three-map`
- `coordsToVector3`
- large-scale coordinate conversion from a single level origin

That is workable today, but should be monitored as levels and play modes become more complex.

## Gameplay Flow

The main per-frame loop currently does:

1. prune expired scattered tokens
2. clear expired player hit tokens
3. collect nearby hadith tokens
4. trigger scholar encounters
5. complete reached milestones
6. apply obstacle effects
7. recompute the next objective
8. check the win condition

This is simple and easy to reason about, which is useful at the current stage, but may eventually need systemization if:

- entity counts rise sharply
- AI behaviors get richer
- combat or military systems are added
- multiple concurrent objectives become common

## State Boundaries

### Persistent State

Stored in `game.store.ts`:

- selected scholar
- unlocked levels
- total verified hadith
- last completion summary

### Transient Player State

Stored in `player.store.ts`:

- position
- movement
- current tokens
- dialogue state
- scramble state
- recent hit state

### Transient Level State

Stored in `level.store.ts`:

- loaded level config
- token state
- completed scholars/milestones
- current objectives
- locked hadith
- completion flag

## Extension Points

### Adding A New Scholar

Add or modify an entry in `src/lib/constants.ts`:

- `id`
- display name
- title
- colors
- modifiers
- optional model path

### Adding A New Level

Add a new `LevelConfig` file and register it in `src/game/levels/index.ts`.

### Adding A New Objective Type

Touch points are usually:

- `level.types.ts`
- `CollisionSystem.ts`
- `level.store.ts`
- `HUD.tsx`

### Adding A New Play Mode

For larger features like combat or military encounters, the likely new seams are:

- a dedicated feature folder under `src/game`
- system-specific stores or slices
- system-specific render entities
- system-specific collision/AI modules

This is one of the reasons the repo proposal recommends more feature-oriented partitioning as the codebase grows.

## Current Weak Spots

- `react-three-map` precision and ergonomics at country-scale distances should still be watched.
- The current level span is large and movement speed is still compressed.
- `GameLoop.tsx` is still a central, growing file and may become too crowded as more systems are added.
- Level content and historical text are still placeholder-heavy outside Level 1.
- The current repo layout is serviceable but not yet ideal for long-term AI-assisted scaling.

## Operational Docs

- `README.md`
- `AGENTS.md`
- `docs/future-milestones.md`
- `docs/research_prompt.md`
- `docs/repo-proposal.md`
- `docs/performance-lag.md`
- `docs/claude-opus-4.6-to-gpt-codex-5.4-handoff.md`
