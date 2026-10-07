---
name: persistence-integration
description: >-
  Use when changing MikroORM entities, repositories, pagination, database
  transactions, RequestContext, or persistence infrastructure in this repository.
  Do not apply to isolated frontend or DTO-only changes.
---

# Persistence integration

- Follow the shared `AppEntityManager` `findByPage` and `findByCursor` contracts.
- Use shared HTTP configuration for request units of work and soft-delete filters.
- Check the `RequestContext.create(...)` pattern when using MikroORM in schedulers and event handlers.
- Inspect the existing entity, migration, seeder, and module registration before adding persistence code.
- Keep persistence concerns in infrastructure and avoid introducing parallel repository abstractions without a boundary requirement.
