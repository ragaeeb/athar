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

## Current State Philosophy

Athar currently uses Zustand heavily because it is simple and productive, but the long-term direction is more selective:

- reactive Zustand state should hold committed gameplay and product state
- transient high-frequency presentation data should not automatically become reactive app state
- persistence, completion summaries, and any future history/undo-like systems should only see durable gameplay facts

This distinction matters because not every moving value in a Three scene is meaningful application state.

The same principle applies to logic placement:

- React components should describe structure, lifecycle, and stable bindings
- systems should own batched dirty-flagged or cross-entity runtime work

If a behavior touches many entities, depends on dirty flags, or needs to run repeatedly during motion, it is usually a poor fit for per-entity React component logic.

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

## Planned Near-Term Architecture Shift

The next major refactor is expected to formalize a simulation/presentation split.

### Target split

- simulation owns authoritative gameplay facts and deterministic rule evaluation
- presentation owns per-frame interpolation, mesh transforms, animation mixers, and camera smoothing
- React owns lifecycle, structure, and UI state
- Zustand owns committed gameplay/product state, not every frame-by-frame value

### Scene registry and non-reactive working state

Athar should adopt a scene registry or equivalent presentation service that:

- registers hot visual objects by stable ID
- stores mesh refs, vectors, transient offsets, and dirty entity queues
- allows imperative updates during movement, interpolation, dragging, or physics-like effects
- avoids turning those values into broad reactive state changes

This registry is also the right handoff point for system-owned runtime logic.

Examples:

- a movement/presentation system updates the player mesh and camera without forcing React rerenders
- a geometry rebuild system processes only dirty buildings, labels, or future route props
- an obstacle system advances relevant entities in batches instead of every entity component owning its own update path

Some Zustand-managed state may still be used as an organizational home for this data, but the intended rule is:

- not every value in Zustand should be reactive
- hot transient values may be mutated and consumed internally without triggering React rerenders
- history/persistence layers should ignore presentation-only state

Examples of data that should remain presentation-only where possible:

- camera interpolation targets
- mesh-local offsets
- animation blending state
- temporary platform/wall offsets
- dirty-node collections for systems processing
- per-frame vectors or derived transform caches

## Planned System Model

Athar is expected to move toward a small set of explicit runtime systems.

### What a system means here

A system is not necessarily a full ECS framework. In Athar, a system is any dedicated runtime unit that:

- runs once per frame or on explicit dirty checks
- processes many entities or shared runtime concerns in a batch
- consumes scene-registry refs, transient working state, or authoritative simulation state
- updates presentation objects directly when React rerenders would be the wrong mechanism

### Good candidates for systems

- player movement presentation
- camera follow
- token animation / expiry / recovery presentation
- obstacle behavior updates
- future label visibility or LOD
- future city/building geometry rebuilds
- future combat or military AI updates

### Poor candidates for per-entity React logic

- expensive geometry recalculation triggered by many entity changes
- dirty-flag scanning across collections
- transient platform/wall/object offsets
- repeated mesh transform updates that do not need React awareness

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

The architectural direction is to systemize these areas before the app accumulates large amounts of per-entity React runtime logic.

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

This is currently more reactive than the desired end state. Over time, player-facing committed location and gameplay state should remain here, while purely presentational motion/interpolation data should move behind the presentation layer.

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
- some hot movement/presentation values still risk being treated like general reactive store state
- some future geometry/behavior work could easily land in React entity components when it should instead become system-owned dirty processing
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
