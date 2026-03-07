# ADR 0008: Cultural And Editorial Guardrails

## Status

Accepted

## Decision

Historical, scholarly, and religious content is treated as authored editorial content, not incidental UI copy.

Athar should:

- keep sourced or reviewable hadith/scholar content under `src/content/**`
- distinguish placeholder content from reviewed content
- avoid inventing authoritative-sounding historical claims in runtime logic
- keep Arabic-capable and RTL-safe presentation constraints in the shared UI baseline

## Consequences

- cultural/editorial review can happen without code archaeology
- placeholder-heavy scaffold chapters remain clearly scoped as scaffold content
- future chapter work has an explicit place to enforce review discipline
