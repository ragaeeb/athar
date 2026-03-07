# Athar Production Implementation Plan

## Purpose

This document turns the current vision, prompt, handoffs, future milestones, repo proposal, branding synthesis, and architecture synthesis into a delivery plan that can be executed in small, reviewable increments.

It is intentionally opinionated. It assumes the team will keep in scope:

- a five-chapter playable game
- the current hybrid MapLibre + Three + React direction
- a simulation-first architecture
- Zod-validated content
- a map-first UI with stronger branding and accessibility
- mobile/touch support
- richer scholar, obstacle, encounter, audio, and worldbuilding systems
- production-grade testing, performance guardrails, and release discipline

It does **not** assume an immediate monorepo rewrite, a full renderer rewrite, or a full ECS rewrite at the start.

## Delivery Principles

1. Ship working increments, not architecture theater.
2. Separate simulation, rendering, content, and UI as early as possible.
3. Separate authoritative gameplay state from per-frame presentation state before scaling movement-heavy features.
4. Keep reactive stores for committed product state, and use non-reactive mutable state/registries for hot transient data that should not trigger rerenders, history, or persistence.
5. Prefer batched systems over per-entity React logic for dirty-flagged, cross-entity, or frame-driven runtime work.
6. Put schema validation and tests in place before scaling content creation.
7. Treat performance, accessibility, and content review as first-class work, not end-of-project cleanup.
8. Keep the codebase optimized for AI-assisted implementation by making boundaries explicit and docs current.

## Scope Summary

## In scope

- complete Levels 1–5 as playable chapters
- sourced and reviewed hadith/scholar content
- remaining obstacle systems
- stronger scholar gameplay identity
- mobile/touch controls
- richer encounters, labels, city forms, lighting, VFX, and audio
- a formal simulation boundary
- content schemas and validation
- asset conventions and pipeline
- performance hardening and regression guardrails
- brand-system enforcement, accessibility, and map-first UX refinement
- release-quality QA, CI, docs, and deployment readiness

## Out of immediate scope

- multiplayer
- cloud saves/accounts
- open-ended procedural world generation
- a monorepo/package split before single-repo boundaries are mature
- a permanent renderer rewrite before adapter seams and benchmarks justify it

## Teaming Model

## Senior developer work

- simulation architecture and game-loop boundaries
- renderer adapter boundaries and map/camera ownership
- performance profiling and rendering strategy decisions
- ECS pilot design and evaluation
- schema architecture and content loading contracts
- CI, release gating, and production readiness standards
- difficult geospatial math, camera, and precision issues
- ADR authoring for major decisions

## Intermediate developer work

- feature implementation inside established boundaries
- obstacle systems, encounter flows, HUD states, input layers
- level content integration once schemas/templates exist
- audio and VFX system wiring
- component primitive extraction and design-system adoption
- test implementation for features and deterministic systems
- asset pipeline scripting with guidance

## Junior developer work

- content entry against validated templates
- copy, metadata, asset manifest upkeep, and license tracking
- straightforward UI states using approved primitives
- focused bug fixes with clear reproduction steps
- unit tests for pure helpers and schemas
- documentation updates, screenshots, and QA checklists
- simple level dressing and data migration work after contracts stabilize

## Workstream Overview

The project is easiest to manage as seven parallel workstreams with explicit sequencing points:

1. Architecture and simulation
2. Content and narrative
3. Gameplay systems
4. Rendering and worldbuilding
5. Brand, UX, and accessibility
6. Asset and audio pipeline
7. QA, CI, and release operations

Not every workstream can start immediately. The dependency map below determines when each one can safely scale.

## Global Dependency Map

### Must happen first

- Phase 0 architecture lock
- schema and content contract definition
- simulation boundary extraction
- presentation-layer / scene-registry boundary introduction
- renderer boundary introduction

### Can scale only after schemas exist

- Level 2–5 authored content
- sourced hadith migration
- junior-heavy content work
- asset manifest population

### Can scale only after the simulation boundary exists

- Miniplex pilot
- mobile controls on shared motion pipeline
- complex obstacle behaviors
- camera and combat experiments
- performance profiling of simulation vs rendering

### Can scale only after UI primitives exist

- traversal vs reading mode polish
- accessibility rollout
- broader HUD/drawer refinements
- onboarding and pause flows

## Phase Plan

## Phase 0 — Architecture Lock And Delivery Rails

### Goal

Turn the current prototype into a stable base for parallel work without changing the shipped feature set yet.

### Deliverables

- ADR: simulation boundary
- ADR: presentation boundary and scene registry ownership
- ADR: coordinate authority and origin rebasing
- ADR: renderer boundary and camera ownership
- ADR: content format and schema policy
- ADR: asset naming and clip naming rules
- initial repo refactor plan aligned with [repo-proposal.md](/Users/rhaq/workspace/athar/docs/repo-proposal.md)
- implementation of `docs/agent-guide.md` or equivalent contributor/AI guide
- finalized production checklist and branch/CI expectations

### Sequential work

1. Review and approve the core ADRs.
2. Freeze the initial architecture direction for the next two phases.
3. Define the minimal file moves allowed in the first refactor so downstream feature work is not destabilized.

### Parallel work

- senior: ADRs and architecture lock
- intermediate: CI cleanup, docs cleanup, existing test stabilization
- junior: asset inventory draft, content audit spreadsheet/checklist, docs index cleanup

### Staffing

- Architecture lead: Senior
- CI and tooling: Intermediate or Senior
- Documentation and audit support: Junior

### Exit criteria

- all core decisions are written down
- contributors know where simulation, presentation, rendering, content, and UI work should land
- CI reflects the current scripts and quality gates

## Phase 1 — Core Refactor: Simulation, Presentation, State, And Schemas

### Goal

Create the core architecture contracts that the rest of the game can build on, including the performance-critical split between committed gameplay state and per-frame visual motion.

### Deliverables

- `src/game/simulation/` or equivalent pure TS boundary
- movement, route, objective, and collision logic extracted from React-heavy code
- clear split between persistent, UI, authoritative gameplay state, and transient presentation state
- `src/game/presentation/` or equivalent scene layer that owns imperative mesh/camera updates
- scene registry for hot visual objects keyed by stable entity IDs
- commit model defining when simulation writes durable state and when presentation interpolates without store writes
- non-reactive working-state containers for hot data such as mesh refs, transient vectors, dirty entity queues, and physics-style offsets
- explicit rules for what is allowed into undo/history/persistence versus what must remain presentation-only
- first batch of runtime systems for dirty-flagged or cross-entity work instead of per-entity React update logic
- renderer adapter seam between gameplay and MapLibre/Three code
- Zod schemas for levels, scholars, milestones, obstacles, objectives, audio cues
- content validation tests in CI
- first version of content templates for level authoring

### Sequential work

1. Extract pure simulation modules.
2. Introduce the presentation boundary and scene registry so per-frame transforms no longer flow through React/Zustand subscriptions.
3. Refactor stores so hot-loop data is not coupled to UI subscriptions and only committed gameplay facts notify React.
4. Introduce non-reactive mutable working state for transient render/physics-style effects that do not belong in history, persistence, or undo-like systems.
5. Move player travel, camera interpolation, and other hot-path transforms onto the presentation layer.
6. Introduce system-owned dirty processing for cross-entity runtime work so React components stay focused on lifecycle and static structure.
7. Add Zod schemas and validation tests.
8. Migrate existing Level 1 and scaffolded Levels 2–5 configs to the validated contract.

### Parallel work

- architecture/simulation extraction can run in parallel with schema design if one senior owns the contract
- scene registry/presentation work can begin in parallel with schema design, but should not diverge from the approved ADR
- test expansion can run in parallel with store cleanup once the presentation contract is frozen
- asset/audio manifests can begin once content IDs are stabilized

### Staffing

- Simulation extraction: Senior
- Presentation boundary and scene registry: Senior
- Store cleanup: Senior or strong Intermediate
- Schema implementation: Intermediate under Senior review
- Validation tests: Intermediate or Junior after schema examples exist
- Content migration: Junior or Intermediate

### Exit criteria

- gameplay rules can be tested without a canvas
- per-frame movement and camera motion no longer depend on high-frequency Zustand/React churn
- transient presentation/physics values no longer pollute persistence, history, or broad UI subscriptions
- dirty-flagged runtime work is handled by systems rather than scattered per-entity React rerender paths
- content fails fast in CI when malformed
- Level 1 still works after the refactor

## Phase 2 — Level 2 Production Vertical Slice

### Goal

Prove the new contracts by shipping the first post-refactor chapter at production quality.

### Deliverables

- Level 2 fully playable
- multiple teacher encounters with sourced/reviewed content
- richer route pacing than Level 1
- production-quality completion flow for Level 2
- first chapter authored entirely through the new validated content model
- updated perf and E2E coverage for Level 2
- first validated use of the new brand feedback hierarchy in a full chapter, including loading, failure, reward, and reading-mode transitions

### Sequential work

1. Finalize Level 2 authored data.
2. Hook Level 2 into the level registry and progression flow.
3. Verify the chapter from start to completion in deterministic tests and Playwright.

### Parallel work

- content authoring
- scholar dialogue/content review
- map labels and milestone placement
- chapter-specific art/audio dressing
- QA script authoring

### Staffing

- Chapter integration: Intermediate
- Content authoring: Junior or Intermediate
- Scholarly content review and sourcing: Senior + domain reviewer
- QA coverage: Intermediate

### Exit criteria

- Level 2 is not a scaffold
- it is complete enough to be shown as the new standard for all remaining chapters

## Phase 3 — Core Gameplay Expansion

### Goal

Finish the remaining core mechanics required by the original game scope before scaling to more chapters.

### Deliverables

- remaining obstacle types:
  - corrupt guard
  - flood zone
  - rival collector
- stronger scholar identities beyond minor stat tweaks
- improved teacher encounter staging and camera language
- pause/restart/debug surface for QA
- first-run onboarding hints
- shared input abstraction ready for both keyboard and touch
- obstacle and encounter hooks wired to the new simulation/presentation split rather than direct store-driven transforms
- gameplay feedback rules applied across ambient, urgent, and reward states
- first gameplay systems beyond movement/camera extracted out of entity components where batching is beneficial

### Sequential work

1. Finish the shared movement/input contract.
2. Add obstacle rules and their render representations.
3. Move suitable obstacle/encounter runtime logic into dedicated systems rather than per-entity component code.
4. Add scholar ability hooks and encounter system upgrades.
5. Add pause/reset/onboarding flows.

### Parallel work

- one engineer can own obstacles
- one can own scholar identity and encounter upgrades
- one can own pause/onboarding/debug UX
- one can pilot additional runtime systems for entities that are trending toward dirty-flag churn
- test work can run alongside each stream

### Staffing

- Input pipeline and encounter architecture: Senior or strong Intermediate
- Obstacle feature work: Intermediate
- QA/debug affordances: Junior or Intermediate
- Content/copy onboarding: Junior

### Exit criteria

- the project supports all core mechanics promised in the prompt, even if not all chapters are complete yet
- the team has a clear rule for when new gameplay/runtime logic belongs in systems instead of entity components

## Phase 4 — Performance Scalability Pass

### Goal

Scale the already-correct architecture before content and visual density increase further.

### Deliverables

- token and obstacle instancing where appropriate
- viewport/distance culling strategy
- renderer-boundary metrics for camera/map/render behavior
- bundle splitting plan and first route/module splits
- stable performance budgets for unit/perf/E2E checks
- evaluation spike for Miniplex on one subsystem
- expansion of the scene registry to additional hot entities only where benchmarks justify it
- expansion of system-owned dirty processing only where benchmarks justify it

### Sequential work

1. Instrument current entity counts and frame cost.
2. Implement the low-risk wins first:
   - instancing
   - culling
   - lazy loading
3. Benchmark whether additional entities should move from declarative React placement to presentation-layer ownership.
4. Benchmark whether geometry/behavior work currently living in entity components should move into batched systems.
5. Run a Miniplex pilot for a contained subsystem.
6. Decide whether to expand Miniplex in later phases.

### Parallel work

- perf instrumentation
- instancing implementation
- bundle splitting
- Miniplex spike

### Staffing

- Perf lead and renderer decisions: Senior
- Instancing/culling: Intermediate
- Bundle splitting: Intermediate
- Benchmark harnesses: Junior or Intermediate under review

### Exit criteria

- later chapters can increase content density without a predictable collapse
- the team has evidence that the Phase 1 simulation/presentation split is holding under denser content
- the team has real data on whether Miniplex should expand

## Phase 5 — Chapters 3 And 4

### Goal

Ship the first two large content-heavy chapters on top of the hardened foundation.

### Deliverables

- Level 3 fully playable Iraq/Baghdad circuit
- Level 4 fully playable Persian survival route
- urban extrusion or procedural city massing for Baghdad-scale spaces
- stronger labels, city identity, and environmental pacing
- dusk/golden-hour lighting where specified
- chapter-specific obstacle mixes and route pacing

### Sequential work

1. Finish the reusable city/worldbuilding primitives.
2. Author and integrate Level 3.
3. Author and integrate Level 4.
4. Expand tests and performance budgets around the denser chapters.

### Parallel work

- Level 3 content and Level 4 content can be authored in parallel once worldbuilding primitives exist
- lighting and label system work can proceed in parallel
- audio pass for each chapter can proceed after chapter IDs/assets stabilize

### Staffing

- Worldbuilding primitives and city rendering: Senior
- Chapter implementation: Intermediate
- Content entry and quest/objective setup: Junior or Intermediate
- Lighting and label polish: Intermediate

### Exit criteria

- Levels 3 and 4 are fully playable, stable, and performance-acceptable

## Phase 6 — Brand System And UX Consolidation

### Goal

Turn the current brand direction into an enforceable UI system and reduce UX drift before final polish.

### Deliverables

- semantic tokens for success, warning, danger, info, focus, disabled, selection, scrim
- reusable UI primitives for buttons, chips, drawers, cards, overlays, toasts
- traversal mode vs reading mode presentation rules implemented
- feedback hierarchy rules for ambient HUD, urgent alerts, and reward moments
- HUD legibility constraints for motion-heavy map states
- contrast/accessibility corrections
- focus-visible and reduced-motion behavior
- mobile/touch UI rules implemented in real components
- cultural/editorial guardrails reflected in content and presentation rules
- iconography direction and illustration/asset style rules
- loading, empty, disabled, and error state patterns
- onboarding and microcopy standards
- localization and RTL baseline rules
- chapter and scholar variation boundaries codified in reusable patterns

### Sequential work

1. Add semantic tokens and component primitives.
2. Define feedback hierarchy, HUD legibility rules, and traversal/reading/reward mode behavior.
3. Refactor the current HUD, drawers, overlays, notifications, and onboarding to use them.
4. Apply accessibility, localization, and contrast constraints across the main surfaces.

### Parallel work

- design-token work
- component primitive extraction
- accessibility audit and fixes
- iconography and illustration guidance
- onboarding and microcopy review
- localization/RTL baseline work
- cultural/editorial review

### Staffing

- Design-system direction: Senior or strong Intermediate
- Primitive implementation: Intermediate
- Accessibility verification: Intermediate
- Iconography/onboarding/localization support: Intermediate
- Content/cultural review updates: Senior + domain reviewer
- Straightforward refactors to use primitives: Junior

### Exit criteria

- the UI is no longer relying on ad hoc utility strings and implicit styling decisions

## Phase 7 — Audio, VFX, And Asset Pipeline Completion

### Goal

Finish the sensory layer and ensure assets can scale without becoming unmanageable.

### Deliverables

- full audio cue implementation
- region/chapter ambient sound design
- collection, encounter, and completion VFX
- audio brand direction and cultural guardrails for instrumentation/texture choices
- asset optimization scripts
- standardized GLB clip naming policy
- asset manifest with source URL, author, license, attribution notes
- optional IFC/GLB richer building path behind feature flags

### Sequential work

1. Finalize asset naming and manifest conventions.
2. Implement audio manager triggers across gameplay.
3. Add VFX and encounter presentation polish.
4. Optimize and validate the assets in CI or preflight scripts.

### Parallel work

- audio pass
- VFX implementation
- manifest and licensing work
- asset optimization script work

### Staffing

- Pipeline and optimization scripts: Senior or Intermediate
- Audio integration: Intermediate
- VFX polish: Intermediate
- Manifest upkeep and attribution: Junior

### Exit criteria

- the game feels materially more finished, and the asset pipeline is no longer informal

## Phase 8 — Level 5 Finale And Endgame Flow

### Goal

Ship the final chapter and complete the core campaign arc.

### Deliverables

- Level 5 fully playable
- final scholar encounters and payoff sequence
- endgame progression and completion summary
- full five-chapter playthrough from fresh profile to finale

### Sequential work

1. Author the Level 5 chapter content.
2. Build the finale and completion flow.
3. Run campaign-wide playthrough validation.

### Parallel work

- Level 5 content
- finale UI and completion narrative
- audio/VFX payoff sequence
- QA scripts for full campaign runs

### Staffing

- Finale structure and pacing: Senior
- Chapter content integration: Intermediate
- Supporting content, copy, and tests: Junior or Intermediate

### Exit criteria

- the game is mechanically and narratively complete in its first production scope

## Phase 9 — Production Hardening And Release Candidate

### Goal

Move from “feature complete” to “release candidate.”

### Deliverables

- full campaign QA matrix
- performance signoff across representative chapter states
- accessibility signoff
- content authenticity and attribution review signoff
- regression suite covering all chapters
- save-data versioning and migration strategy
- release notes, deployment checklist, and rollback plan
- final bundle/perf cleanup

### Sequential work

1. Freeze features except for release blockers.
2. Run full QA across chapters, devices, and input modes.
3. Fix blockers.
4. Produce release candidate build.

### Parallel work

- QA execution
- docs/release checklist
- regression automation
- final perf and bundle cleanup

### Staffing

- Release coordination: Senior
- QA execution: Intermediate and Junior
- Regression fixes: entire team by severity

### Exit criteria

- the game can be confidently shipped as a production-quality first release

## Continuous Parallel Tracks

These tracks should run throughout the plan, not only in one phase.

## Content review track

- historical sourcing
- hadith verification and formatting
- scholar naming consistency
- chapter copy review

## QA and automation track

- grow unit, content, simulation, E2E, and visual regression coverage
- maintain perf guardrails
- keep CI aligned with real scripts

## Documentation track

- ADRs
- architecture docs
- agent guide
- asset guide
- content authoring guide

## Parallelization Matrix

## Strongly parallelizable

- content entry once schemas exist
- asset manifesting once IDs and filenames stabilize
- chapter-specific art/audio dressing once chapter contracts exist
- UI refactors once primitives exist
- test writing once module boundaries stabilize

## Must stay sequential

- architecture ADRs before broad refactors
- schema design before large content migration
- simulation boundary before ECS pilot
- renderer boundary before renderer comparison spikes
- input contract before desktop/touch divergence
- worldbuilding primitives before content-heavy chapter rollout
- feature freeze before release candidate QA

## Milestone Summary

### Milestone A

Architecture locked, schemas in CI, simulation boundary established.

### Milestone B

Level 2 is fully playable on the new contracts.

### Milestone C

All core gameplay systems from the prompt are implemented.

### Milestone D

Performance architecture is hardened and Miniplex viability is proven or rejected with data.

### Milestone E

Levels 3 and 4 are fully playable.

### Milestone F

Brand system, accessibility, audio, and asset pipeline are production-grade.

### Milestone G

Level 5 and the full campaign are complete.

### Milestone H

Release candidate passes QA, performance, and content review.

## Immediate Recommended Start Sequence

If the team needs the practical order for the next few weeks, it should be:

1. Phase 0: architecture lock and ADRs
2. Phase 1: simulation/state/schema refactor
3. Phase 2: Level 2 as the first post-refactor chapter
4. Phase 3: finish remaining core mechanics
5. Phase 4: performance scalability pass

That sequence gives Athar the right balance of shipping progress and architectural safety, without delaying content too long or over-investing in speculative rewrites.
