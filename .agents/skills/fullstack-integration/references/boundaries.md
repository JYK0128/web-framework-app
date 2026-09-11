# Layer boundaries

- Put shared contracts and utilities in `packages/shared`.
- Common guards, interceptors, and contexts must not depend on a specific domain implementation.
- Infrastructure owns external systems, databases, and brokers.
- Prefer shared contracts or domain events for cross-domain interaction.
- Do not refactor existing cross-module references outside the current scope.

Relevant paths: `template/nest-starter-kit/src/modules/`, `src/infra/`, `src/common/`, `packages/shared/src/`.
