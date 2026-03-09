# Level 2 Spec

## Status

Partially implemented for Phase 2.

## Chapter

- id: `level-2`
- title: `The Arabian Heartland: Makkah to Madinah`
- route shape: Makkah -> Juhfa -> Badr -> Madinah
- map style: `city`
- target feel: tighter and denser than Level 1, with repeated scholar banking and shorter hazard windows

## Chapter Goals

- prove the post-refactor architecture can support a second fully playable chapter
- require multiple teacher encounters in a single route
- force the player to bank hadith more than once instead of carrying everything to the final stop
- introduce a denser hazard rhythm than Level 1 without adding new systems

## Authored Parameters

- required hadith: `36`
- required teachers:
  - `ibn-abi-uways`
  - `abdullah-ibn-yusuf`
  - `ali-ibn-al-madini`
- final milestone: `prophets-mosque`
- total authored cluster value: `50`
- obstacle mix:
  - `rival`
  - `flood`
  - `guard`

## Route Beats

1. Start in Makkah and meet Ibn Abi Uways near the sanctuary.
2. Push north to Juhfa and avoid the first pressure corridor.
3. Cross the Badr route, meet Abdullah ibn Yusuf, and keep the satchel intact through the flood band.
4. Enter Madinah, meet Ali ibn al-Madini, and finish at the Prophet's Mosque.

## Editorial Notes

- Runtime teacher dialogue is authored paraphrase, not presented as a direct quotation from a canonical hadith collection.
- Historical notes stay descriptive and avoid overstating precise itineraries for a compressed game route.
- Scholar identity, city labels, and completion copy are authored under the cultural/editorial guardrails from [ADR 0008](docs/adr/0008-cultural-editorial-guardrails.md).

## Phase 2 Checklist

- [x] Level 2 has authored milestones, hazards, teachers, and token clusters.
- [ ] Production Level 2 content is complete and reviewed end to end.
- [x] Completion flow has chapter-specific copy.
- [x] Replay-safe hadith accounting works with a second chapter.
- [x] Desktop deterministic smoke covers Level 2 completion.
- [ ] Mobile smoke is complete for the supported gameplay path.

## Remaining Phase 2 Gaps

- Production Level 2 content still needs a full authored pass beyond the current scaffold-heavy implementation.
- Mobile smoke remains out of scope for the current desktop-first release and should not be treated as complete yet.

## Follow-up Risks

- The checked-in audio cue pack is still a minimal placeholder mix, not final production audio design.
- Teacher dialogue remains authored paraphrase and should still receive domain review before any broader public release.
- PR notes reconciliation: the remaining Level 2 work is the unfinished production content pass and the deferred mobile smoke coverage, which should stay aligned with the checklist above.
