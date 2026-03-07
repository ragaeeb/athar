# Athar

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/44a7faf7-7205-43ff-b479-32abad5dfc04.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/44a7faf7-7205-43ff-b479-32abad5dfc04)
[![Status](https://img.shields.io/badge/status-vertical%20slice-c9a227)](./docs/architecture.md)
[![Bun](https://img.shields.io/badge/Bun-1.x-000000?logo=bun)](https://bun.sh/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646cff?logo=vite)](https://vite.dev/)
[![MapLibre](https://img.shields.io/badge/MapLibre-5.19-396cb2)](https://maplibre.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.183-000000?logo=three.js)](https://threejs.org/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20%2B%20Playwright-6e9f18)](./package.json)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/ragaeeb/athar?utm_source=oss&utm_medium=github&utm_campaign=ragaeeb%2Fathar&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
[![codecov](https://codecov.io/gh/ragaeeb/athar/graph/badge.svg?token=YTX69MN0H9)](https://codecov.io/gh/ragaeeb/athar)

Athar is a web-based 3D educational map game inspired by Imam al-Bukhari's travels collecting hadith across the classical Islamic world. The current build is a desktop-first vertical slice with a playable Level 1, scholar selection, token collection, teacher encounters, milestone progression, and a completion flow.

## Current Status

- One fully playable level: Bukhara to Makkah
- Raster-tile MapLibre backdrop with React Three Fiber gameplay rendering
- Four playable scholars:
  - Al-Bukhari
  - Muslim b. al-Hajjaj
  - Abu Dawud al-Sijistani
  - Abu Isa al-Tirmidhi
- Levels 2 to 5 are scaffolded but not yet fully implemented

## Tech Stack

- Bun
- Vite
- React 19
- TypeScript
- React Router v7 Data Mode
- Zustand
- MapLibre + `react-map-gl`
- `react-three-map`
- `@react-three/fiber` + `@react-three/drei`
- Tailwind CSS v4
- Biome
- Vitest + Playwright

## Quick Start

```bash
bun install
bun run dev
```

Then open the Vite URL shown in the terminal.

## Scripts

```bash
bun run dev
bun run typecheck
bun run lint
bun run test
bun run test:e2e
bun run build
```

## Project Docs

- [Architecture](./docs/architecture.md)
- [Repo Proposal](./docs/repo-proposal.md)
- [Research Prompt](./docs/research_prompt.md)
- [Future Milestones](./docs/future-milestones.md)
- [Performance Investigation](./docs/performance-lag.md)
- [Agent Guide](./AGENTS.md)

## Current Architecture Summary

- MapLibre renders a raster basemap as the geographic backdrop
- React Three Fiber renders the player, scholars, tokens, obstacles, labels, and milestone buildings
- `react-three-map` bridges the shared WebGL context
- Level content resolves through route loaders and is validated before the gameplay route mounts
- Movement rules run through a fixed-timestep simulation boundary and bridge back into committed stores
- Player placement and camera follow run through the presentation runtime and scene registry
- Gameplay state is split across persistent progression, transient player state, and transient level state

## Current Limitations

- Player speed is still intentionally compressed for gameplay pacing
- Levels 2 to 5 are still content scaffolds
- Hadith excerpts are placeholders and still need sourcing/review
- Mobile controls, richer audio layering, and denser world rendering are still future work

## License / Assets

Asset licensing is not yet finalized in-repo. Asset licensing should be tracked per imported model or audio file before public release.
