# ADR 0005: Content Schema Policy

## Status

Accepted

## Decision

Authored chapter content must validate before the gameplay route mounts.

Athar uses:

- authored content under `src/content/**`
- Zod schemas under `src/content/**`
- route loaders to validate and resolve chapter content

Malformed or missing chapter content is treated as a route failure, not as an in-game runtime edge case.

## Consequences

- content regressions fail fast
- junior or AI-assisted content entry is safer
- gameplay controllers do not need to defensively re-validate loaded chapter config
