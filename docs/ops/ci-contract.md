# CI Contract

## Blocking Checks

- `bun run typecheck`
- `bun run lint`
- `bun run test`
- content validation through route-loader/schema coverage
- desktop smoke through `bun run test:e2e`
- `bun run build`

## Advisory Checks

- `bun run test:perf`
- mobile/browser smoke scenarios
- bundle budget review
- visual regression review

## Notes

- `react-three-map` is pinned exactly and should not be bumped casually
- simulation-boundary enforcement is part of lint and should remain blocking
- content failures should fail before gameplay mount, not during runtime traversal
