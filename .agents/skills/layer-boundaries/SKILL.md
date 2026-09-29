---
name: layer-boundaries
description: >-
  Use when designing or refactoring cross-module architecture, shared packages,
  infrastructure boundaries, domain events, or application layer ownership.
  Do not apply to local implementation-only refactors.
---

# Layer boundaries

- Put shared contracts and utilities in `packages/shared`.
- Common guards, interceptors, and contexts must not depend on one domain implementation.
- Infrastructure owns external systems, databases, and brokers.
- Prefer shared contracts or domain events for cross-domain interaction.
- Do not refactor existing cross-module references outside the current scope.
- Treat public HTTP/API contracts, Command/Query ownership, external DTO boundaries, validation/authorization, persistence, and cross-domain events as architectural boundaries.
- Prefer focused changes over broad mechanical refactors.
