# Save-Data Verification

## Current Persistence Contract

Athar persists progression-only state through Zustand `persist` in:

- `src/features/gameplay/state/game.store.ts`

Current persisted contract:

- `SAVE_VERSION = 2`
- current level
- selected scholar
- unlocked level orders
- replay-safe `verifiedHadithByLevel`
- derived `totalHadithVerified`
- `legacyVerifiedHadithBalance`

The following are intentionally not persisted:

- active chapter state
- live player state
- transient level state
- current dialogue / pause / map runtime state

## Verification Evidence

Migration and replay-safe progression behavior are covered by:

- `src/features/gameplay/state/game.store.test.ts`

Release-hardening checks now specifically include:

- malformed persisted state normalization
- clamping invalid `currentLevel`
- replay-safe verified totals per level
- conservative consumption of unattributed legacy totals
- final-chapter completion not unlocking a nonexistent Level 6

## Manual Verification

1. Complete a chapter and reload the app.
2. Confirm unlocked chapters and best verified totals persist.
3. Restart a chapter mid-run and confirm transient run state resets.
4. Replay an already-completed chapter with a lower verified total and confirm global totals do not change.
5. Replay with a higher total and confirm only the delta is added.
6. Complete Level 5 and confirm no Level 6 is unlocked.

## Release Candidate Verdict

Current verdict: verified for the release candidate, based on:

- versioned migration implementation
- direct migration/unit coverage
- final-chapter progression guardrail
- full five-chapter deterministic smoke path
