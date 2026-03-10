# Asset Manifest

This manifest inventories every checked-in runtime-facing asset under `public/**` that Athar currently loads in product paths.

Status meanings:

- `verified`: provenance and license are recorded and acceptable for the current release target
- `internal-placeholder`: intended only for the current repo/demo build; replace or re-verify before any broader public release
- `unverified-import`: checked into the repo, but original upstream/source metadata is not yet recorded in-repo

## UI And Brand Assets

| Path | Type | Status | Source | Author | License | Attribution | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public/favicon.svg` | favicon | internal-placeholder | in-repo file | project/repo-local | internal project use | none | Current app favicon for dev/release-candidate builds. |
| `public/icon.png` | app icon / OG image | internal-placeholder | in-repo file | project/repo-local | internal project use | none | Used for Apple touch icon and social preview metadata. |

## Audio Assets

| Path | Cue | Status | Source | Author | License | Attribution | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public/audio/ambient/ambient-city.mp3` | `ambient-city` | internal-placeholder | in-repo placeholder pack | project/repo-local placeholder | internal project use | none | Minimal placeholder ambient loop, not final production mix. |
| `public/audio/ambient/ambient-desert.mp3` | `ambient-desert` | internal-placeholder | in-repo placeholder pack | project/repo-local placeholder | internal project use | none | Minimal placeholder ambient loop, not final production mix. |
| `public/audio/sfx/collect-token.mp3` | `collect-token` | internal-placeholder | in-repo placeholder pack | project/repo-local placeholder | internal project use | none | Short pickup cue used on token collection. |
| `public/audio/sfx/footsteps-walk.mp3` | `footsteps-walk` | internal-placeholder | in-repo placeholder pack | project/repo-local placeholder | internal project use | none | Placeholder movement loop used while traversal input is active. |
| `public/audio/sfx/lose-token.mp3` | `lose-token` | internal-placeholder | in-repo placeholder pack | project/repo-local placeholder | internal project use | none | Loss/confiscation placeholder cue. |
| `public/audio/sfx/obstacle-hit.mp3` | `obstacle-hit` | internal-placeholder | in-repo placeholder pack | project/repo-local placeholder | internal project use | none | Generic obstacle impact placeholder cue. |
| `public/audio/ui/level-complete.mp3` | `level-complete` | internal-placeholder | in-repo placeholder pack | project/repo-local placeholder | internal project use | none | Completion sting placeholder. |
| `public/audio/ui/receive-hadith.mp3` | `receive-hadith` | internal-placeholder | in-repo placeholder pack | project/repo-local placeholder | internal project use | none | Reward/dialogue confirmation placeholder. |
| `public/audio/ui/teacher-encounter.mp3` | `teacher-encounter` | internal-placeholder | in-repo placeholder pack | project/repo-local placeholder | internal project use | none | Encounter notification placeholder. |

## 3D Models

| Path | Runtime Use | Status | Source | Author | License | Attribution | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public/models/characters/player.glb` | playable scholar mesh | unverified-import | source URL not recorded in repo | not yet recorded | not yet recorded | likely required until provenance is verified | Active player mesh used by all scholars. |
| `public/models/player.glb` | legacy duplicate player model | internal-placeholder | in-repo duplicate file | project/repo-local | internal project use | none | Legacy duplicate path; keep for compatibility until removed. |
| `public/models/buildings/thatched-hut.glb` | milestone buildings | unverified-import | source URL not recorded in repo | not yet recorded | not yet recorded | likely required until provenance is verified | Used for hut/caravan-style milestone structures. |
| `public/models/buildings/medieval-house.glb` | milestone buildings | unverified-import | source URL not recorded in repo | not yet recorded | not yet recorded | likely required until provenance is verified | Uses spec/gloss fallback handling in runtime. |
| `public/models/obstacles/guard.glb` | guard obstacle mesh | unverified-import | source URL not recorded in repo | not yet recorded | not yet recorded | likely required until provenance is verified | Used by guard obstacles in active chapters. |
| `public/models/obstacles/rival.glb` | rival obstacle mesh | unverified-import | source URL not recorded in repo | not yet recorded | not yet recorded | likely required until provenance is verified | Used by rival obstacles in active chapters. |
| `public/models/obstacles/scorpion.glb` | scorpion obstacle mesh | unverified-import | source URL not recorded in repo | not yet recorded | not yet recorded | likely required until provenance is verified | Used by scorpion obstacles in active chapters. |
| `public/models/obstacles/viper.glb` | viper obstacle mesh | unverified-import | source URL not recorded in repo | not yet recorded | not yet recorded | likely required until provenance is verified | Used by viper obstacles in active chapters. |
| `public/models/scholars/traveling-scholar.glb` | teacher NPC mesh | unverified-import | source URL not recorded in repo | not yet recorded | not yet recorded | likely required until provenance is verified | Active teacher/scholar NPC model. |

## Release Notes

- This manifest is complete for the current checked-in runtime assets.
- The audio pack is intentionally placeholder-only and should be replaced or re-approved before a broader public release.
- The imported GLB assets are fully inventoried here, but their upstream provenance is still not recorded in-repo. That is a release-governance issue, not an inventory gap.
