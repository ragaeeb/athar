# Athar Architecture

## Purpose

This document has two jobs:

- describe the current runtime architecture of Athar as it exists today
- record the approved near-term target architecture from the revised delivery plan

It should answer:

- what the app is made of
- what state is authoritative versus presentational
- how rendering, movement, camera, and gameplay currently work
- what architectural direction is now approved for the next refactor

## Product Shape

Athar is a web-based 3D historical map game with:

- a geographic map backdrop
- Three.js-rendered gameplay entities
- route-based chapter loading
- one shared vertical-slice gameplay loop reused across chapters

The current shipped shape is still a desktop-first slice. The approved roadmap expands this into a five-chapter game with stronger scholar identity, richer worldbuilding, mobile controls, better content governance, more robust performance controls, and production-grade accessibility/audio/release discipline.

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

## Canonical Repo Structure

The canonical top-level source layout is:

- `src/app`
- `src/content`
- `src/features`
- `src/shared`
- `src/test`

New work should target the canonical structure above and should not reintroduce ownership into legacy duplicate roots.

## Current Runtime Architecture

## App Layer

- `src/app/main.tsx`
  Bootstraps the app, configures MapLibre worker count, initializes audio bootstrap, and mounts the router.
- `src/app/router.ts`
  Defines the route tree.
- `src/app/styles/index.css`
  Tailwind v4 entrypoint and theme styles.

## Route Layer

- `src/app/routes/index.tsx`
  Landing page, scholar selection, progress summary, and level listing.
- `src/app/routes/game/level-route.tsx`
  Main gameplay route. Resolves the level, initializes stores, mounts the map and controllers, and intentionally avoids hot gameplay store subscriptions above the map tree.
- `src/app/routes/game/complete.tsx`
  Completion summary flow.

## Map And Scene Layer

- `src/features/map/components/MapScene.tsx`
  Owns the MapLibre instance, `react-three-map` canvas, map interaction settings, and perf-bridge map view hooks.
- `src/features/map/components/LevelMap.tsx`
  Places level entities and the player marker into the geospatial scene.

## Gameplay Layer

- `src/features/gameplay/controllers/PlayerController.tsx`
  Keyboard input capture for the fixed-timestep gameplay runtime.
- `src/features/gameplay/simulation/core/SimulationRunner.ts`
  Fixed-timestep accumulator that advances pure gameplay systems.
- `src/features/gameplay/systems/GameLoop.tsx`
  React-to-simulation bridge that advances the pure gameplay runtime and commits store-safe results.
- `src/features/gameplay/presentation/PresentationRuntime.tsx`
  Scene-registry-driven player placement and camera follow.
- `src/features/gameplay/presentation/SceneRegistry.ts`
  StrictMode-safe registration for hot visual refs and presentation-only state.
- `src/features/gameplay/systems/CollisionSystem.ts`
  Pure gameplay queries for proximity, encounters, and objective resolution.
- `src/features/gameplay/systems/player-motion.ts`
  Pure movement and camera-follow math.

## State Layer

- `src/features/gameplay/state/game.store.ts`
  Persistent progression and scholar selection.
- `src/features/gameplay/state/player.store.ts`
  Live player state, movement, dialogue, and losable tokens.
- `src/features/gameplay/state/level.store.ts`
  Active level config, objectives, tokens, and completion state.

## Content Layer

- `src/content/characters/characters.ts`
  Scholar identities and gameplay-facing character config.
- `src/content/scholars/scholar-profiles.ts`
  Scholar/teacher profile content.
- `src/content/levels/**`
  Chapter content and level registry data.
- `src/content/audio/cues.ts`
  Audio cue definitions and content-facing mappings.
- `src/shared/constants/**`
  Cross-cutting gameplay constants, asset paths, and tuning values.

## HUD Layer

- `src/features/hud/components/**`
  Active HUD, dialogue, mission panel, counters, and other player-facing overlays. Hot HUD subscriptions should live here rather than in the route shell.

## Debug And Perf Layer

- `src/features/debug/debug.ts`
  Opt-in debug logging.
- `src/features/debug/perf-metrics.ts`
  Perf counters and metrics collection.
- `src/features/debug/dev-tools.ts`
  Browser-side test/dev bridge used by Playwright and perf tooling.
- `src/features/debug/spike-watch.ts`
  Short-lived targeted spike watch windows used to correlate transient hitches with specific UX actions.

## Current State Philosophy

Athar currently uses Zustand heavily because it is simple and productive, but the architecture is already moving toward a more selective model:

- reactive store state should hold committed gameplay and product state
- transient high-frequency presentation data should not automatically become broad reactive app state
- persistence, completion summaries, and any future history/undo-like systems should only see durable gameplay facts
- hot subscriptions should be pushed down close to the UI that consumes them so route-level rerenders do not re-diff the map / Three tree during gameplay

This distinction matters because not every moving value in a Three scene is meaningful application state.

The same rule applies to logic placement:

- React components should describe structure, lifecycle, and stable bindings
- systems should own batched dirty-flagged or cross-entity runtime work

If a behavior touches many entities, depends on dirty flags, or needs to run repeatedly during motion, it is usually a poor fit for per-entity React component logic.

## Current Rendering Model

### Basemap

Athar currently uses raster MapLibre styles instead of vector styles.

Why:

- the map is a backdrop, not the primary interactive content
- the game renders its own labels and gameplay entities
- raster tiles remove the vector tile parsing and tessellation overhead that previously caused major movement lag

### Three Layer

`react-three-map` shares the WebGL context between MapLibre and React Three Fiber. Three renders:

- player
- scholars
- tokens
- milestone buildings
- obstacles
- map labels

### Player placement

The player marker registers once into the scene registry and presentation runtime updates the live Three group imperatively. That keeps hot transforms off broad store subscriptions while preserving authoritative gameplay facts in the simulation/store layer.

## Current Movement And Camera Model

### Authoritative movement

Player movement currently operates in local meter-space relative to the level origin.

Player state keeps:

- `coords`
- `positionMeters`
- `bearing`
- `speed`

The current practical model is:

- movement updates `positionMeters`
- geographic `coords` are derived from the level origin and the meter offset
- collision/objectives use `coords`
- camera follow also uses `coords`

### Camera

Camera follow is owned by `PresentationRuntime`, not by the input controller or the simulation layer.

Current behavior includes:

- deadzone-based follow
- max follow speed
- manual zoom/drag/rotate/pitch cooldown
- `map.jumpTo()` follow updates
- delta caps to prevent runaway leaps during bad frames

This is the current contract for the vertical slice and is already aligned with the approved simulation/presentation split.

## Current Weak Spots

- `react-three-map` precision and ergonomics at country-scale distances still need careful handling
- runtime recovery for map/rendering faults is intentionally minimal and should expand with denser content
- `GameLoop` is now mostly a bridge, but broader entity presentation still has room to move further into the registry over time
- content and historical text remain placeholder-heavy outside Level 1
- audio cues are configured, but checked-in audio assets are not present in `public/audio/**`, so runtime audio currently disables itself cleanly on startup in repo state
- accessibility, localization, and content-governance systems are only partially reflected in the runtime today

## Approved Near-Term Target Architecture

The revised plan approves the following direction. This is now the intended architecture, not a speculative idea.

## Boundary Rules

These are the governing rules for the next refactor:

1. Simulation owns authoritative gameplay facts and deterministic rule evaluation.
2. Presentation owns per-frame interpolation, mesh transforms, animation mixers, camera smoothing, and dirty queues.
3. React owns lifecycle, composition, and UI state.
4. Zustand owns committed gameplay/product state only.
5. Only the progression store persists.
6. Hot transient values may be non-reactive and mutable if React does not need to know about them.
7. Cross-entity or dirty-flagged runtime work belongs in systems, not scattered entity components.
8. Level content must be loaded and validated before the gameplay route mounts.

## Simulation Layer

The approved target is a pure simulation boundary under the canonical gameplay feature area.

Target characteristics:

- fixed-timestep simulation loop independent of R3F render cadence
- no React imports inside simulation code
- no Three imports inside simulation code
- deterministic rule evaluation suitable for pure tests
- explicit subsystem boundaries for movement, collision, objectives, encounters, and win conditions

This boundary should be machine-enforced via lint/import rules, not left as convention.

## Presentation Layer

The approved target is a presentation layer that owns hot visual behavior without using React rerenders as the transport mechanism.

It should include:

- a scene registry keyed by stable entity IDs
- mesh refs, vectors, dirty queues, transient offsets, and interpolation state
- imperative updates for player movement, camera smoothing, and repeated visual transforms
- strict separation from persistence/history-worthy state

The scene registry must be safe under React Strict Mode development behavior:

- duplicate mount/register cycles must not create duplicate entity ownership
- cleanup must be idempotent
- last-write-wins registration is acceptable if cleanup semantics remain correct

## Systems Model

Athar is not committing to a full ECS rewrite today. The approved model is explicit runtime systems first.

A system in Athar is any unit that:

- runs once per frame or on explicit dirty checks
- processes many entities or a shared runtime concern in batch
- consumes simulation state, scene-registry refs, or transient working state
- updates presentation objects directly when React rerenders would be the wrong mechanism

Good candidates:

- movement presentation
- camera follow
- token presentation and expiry/recovery
- obstacle behavior updates
- label visibility or LOD
- future city/building geometry rebuilds
- future combat or military AI

ECS or Miniplex should only be reconsidered if:

- active entity counts regularly exceed roughly 200 in real chapters
- AI/combat behavior clearly outgrows the explicit system model
- profiling shows the system model itself, not content/renderer cost, is the limiting factor

## Content And Routing Contract

Approved target:

- chapter content is authored under `src/content/**`
- content is validated through Zod schemas
- React Router loaders validate and prepare content before route mount
- malformed chapter content fails before gameplay initialization

This is the contract that makes junior content work and AI-assisted content entry safe at scale.

## Persistence Contract

Approved target:

- only progression data persists
- persistence is versioned from the early refactor onward
- migrations are explicit and tested
- transient player/level state does not persist across sessions by default

## UI, Accessibility, And Motion Contract

Approved target:

- semantic tokens and primitive UI skeleton start in the first architecture phase
- typography and body/dialogue font decisions are locked early
- RTL/logical CSS baseline starts before sourced Arabic-capable content scales
- traversal HUD surfaces avoid JS-heavy animation
- Framer Motion is reserved for low-frequency transitions, drawers, dialogs, and obscured or paused states unless profiling proves a hot path is safe

## Performance Contract

Approved target:

- do not drive per-frame transforms through broad reactive subscriptions
- do not keep hot gameplay subscriptions in route shells when only HUD/overlay leaves need them
- do not allow unbudgeted camera update/event churn
- use instancing and culling for repeated high-count entities
- pin bridge dependencies such as `react-three-map` exactly and update them only with senior review and smoke testing
- add explicit route-based asset eviction and Three/WebGL disposal as chapter density grows

MapLibre worker count and prewarming remain tuning concerns, not unconditional architectural laws. They should be benchmarked against the supported device/browser matrix rather than treated as fixed folklore.

## Chapter And Testing Contract

Approved target:

- deterministic simulation tests exist without DOM, MapLibre, or Three
- at least one desktop Playwright smoke is merge-blocking
- perf and mobile smoke start advisory and are promoted to blocking by the end of the density/perf phase
- replay-safe hadith accounting is defined before multiple real chapters ship

## Transition Plan

The next architecture milestone sequence is:

1. consolidate the repo around the canonical structure
2. extract the fixed-timestep simulation boundary
3. introduce the presentation layer and scene registry
4. rework stores around committed vs presentation state
5. move chapter loading to validated route loaders
6. add semantic tokens, primitive skeleton, typography, and RTL baseline
7. migrate Level 1 to the new architecture

That is the point where this document’s current-state and target-state sections should start to converge.

## Operational Docs

- `README.md`
- `AGENTS.md`
- `docs/branding.md`
