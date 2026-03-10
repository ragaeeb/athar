# QA Regression Checklist

## Automated Suite

Run all of these before a release candidate is considered green:

```bash
bun run lint
bun run lint:content-governance
bun run typecheck
bun run test
bun run test:e2e
bun run test:perf
bun run build
```

Expected outcome:

- all blocking checks pass
- `test:perf` remains advisory but should be reviewed if it regresses materially
- `build` may still emit the existing large-bundle warning, but should complete successfully

## Manual Smoke

### Core path

1. Launch with `bun run dev`.
2. Start Level 1 from the home screen.
3. Confirm scholar selection, map load, HUD, and player render correctly.
4. Progress through all five chapters using normal play or deterministic test overrides.
5. Confirm each completion route renders chapter-specific copy.
6. Confirm Level 5 ends in the final legacy panel rather than a missing-next-chapter state.

### Save and replay

1. Complete a chapter with a known verified total.
2. Replay the same chapter with a lower total.
3. Confirm `totalHadithVerified` does not decrease or double-count.
4. Replay again with a higher total.
5. Confirm only the delta above the previous best is added globally.

### Pause / restart

1. Pause during movement.
2. Resume with `Escape` and with the UI button.
3. Restart the chapter mid-run.
4. Confirm chapter-scoped state resets while lifetime progression remains intact.

### Dialogue and teacher flow

1. Trigger a teacher dialogue in each of the route archetypes:
   - short chapter (Level 1)
   - dense chapter (Level 3)
   - final route (Level 5)
2. Confirm `Receive Hadith` preserves carried tokens into chapter tally.
3. Confirm dialogue closes cleanly and does not leave movement stuck.
4. Intentionally trigger an encounter/defeat flow in Levels 1, 3, and 5:
   - trigger a hazard strong enough to produce defeat feedback
   - confirm the defeat banner/copy appears and remains legible
   - confirm token loss is reflected in carried tokens and chapter tally
   - confirm defeat audio/visual cues fire
   - confirm the flow still closes cleanly and chapter progression remains available after restart

### Camera and presentation

1. Walk continuously in each of Levels 1, 3, and 4.
2. Confirm no obvious camera jitter or abrupt follow snaps.
3. Manually pan/zoom away from the player and confirm auto-follow does not immediately steal control.

### Audio

1. Confirm ambient audio starts when a chapter loads.
2. Move between chapters and confirm ambient beds crossfade rather than hard-cut.
3. Confirm token pickup, obstacle, teacher encounter, receive-hadith, and level-complete cues all play.

## Deterministic Test Overrides

Useful route helpers:

- `?atharCompactRoute=1`
- `?atharWalkSpeed=4`
- `window.__atharDev__`

Useful debug flag:

- `?atharDebug=1`

High-signal log events:

- `GAME_LOOP_SPIKE`
- `PRESENTATION_FRAME_SPIKE`
- `LONG_TASK`
- `SCREEN_SPACE_JITTER`
- `CAMERA_FOLLOW_JITTER`

## Signoff

Release QA is only complete when:

- automated suite is green
- five-chapter manual smoke is complete
- save/replay behavior is verified
- no unresolved blocking runtime or content-validation issues remain
