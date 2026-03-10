# Analytics And Error Reporting Decision

## Current Decision

For the current release candidate:

- no third-party product analytics SDK is shipped
- no third-party client error-reporting SDK is shipped

## Why

This repo is still in a desktop-first release-candidate state and the highest-value work has been:

- finishing the five-chapter playable path
- keeping the runtime stable
- maintaining deterministic CI and local debug tooling

Adding production analytics/error-reporting at this stage would introduce:

- additional privacy and governance work
- more runtime weight in a bundle that already warns on size
- a new operational dependency without a finalized release/distribution plan

## Current Alternatives

Operational visibility currently comes from:

- CI and Playwright coverage
- targeted perf metrics and deterministic dev tools
- opt-in debug logging through `?atharDebug=1`
- browser console/runtime overlays for local QA

## Revisit Trigger

Revisit this decision when all of the following are true:

- deployment target is finalized
- asset/license provenance is resolved for the intended public release
- bundle/code-splitting strategy is revisited
- privacy and data-retention expectations are defined

At that point, add a new ADR or ops note rather than silently introducing a tracking/reporting SDK.
