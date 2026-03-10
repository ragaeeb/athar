# Release Checklist

## Scope Freeze

- [ ] Five playable chapters are content-frozen for the release candidate
- [ ] No known merge-blocking gameplay or progression bugs remain
- [ ] Supported platform scope matches the browser/device support matrix

## Required Validation

- [ ] `bun run lint`
- [ ] `bun run typecheck`
- [ ] `bun run test`
- [ ] `bun run test:e2e`
- [ ] `bun run test:perf`
- [ ] `bun run build`

## Required Manual Review

- [ ] Run the five-chapter manual smoke from `docs/ops/qa-regression-checklist.md`
- [ ] Confirm ambient chapter transitions crossfade correctly
- [ ] Confirm final Level 5 completion lands in the legacy panel
- [ ] Confirm replay-safe verified totals behave correctly after reload
- [ ] Confirm no unexpected blocking runtime overlay appears on the primary support target

## Required Ops Docs

- [ ] Browser/device support matrix is current
- [ ] Save-data verification note is current
- [ ] Asset manifest is current
- [ ] Analytics/error-reporting decision is current
- [ ] Deployment/rollback checklist is current

## Known Advisory Items

- [ ] Large-bundle warning during `bun run build` reviewed and accepted for this release candidate
- [ ] Placeholder audio pack status reviewed and accepted
- [ ] Imported GLB provenance status reviewed in the asset manifest

## Final Signoff

- [ ] Known-good commit SHA recorded
- [ ] Release artifact/build recorded
- [ ] Rollback target identified
- [ ] Release candidate approved
