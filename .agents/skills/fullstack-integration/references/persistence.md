# Persistence and RequestContext

- Follow the `AppEntityManager` `findByPage` and `findByCursor` contracts for pagination.
- Use the shared configuration for HTTP request units of work and soft-delete filters.
- Check the `RequestContext.create(...)` pattern when using MikroORM in schedulers and event handlers.

Relevant paths: `template/nest-starter-kit/src/infra/database/`, `src/common/interceptors/`, `src/common/core.module.ts`.
