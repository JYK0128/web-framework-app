---
name: layer-boundaries
description: >-
  Use when designing or refactoring cross-module architecture, shared packages,
  infrastructure boundaries, domain events, or application layer ownership.
  Do not apply to local implementation-only refactors.
---

# Layer boundaries

- Put shared contracts and utilities in `packages/shared`.
- Put reusable server implementation in `packages/server-core/src/core/<capability>`. A capability belongs there when its behavior and policy are shared and it can accept app configuration or app-owned adapters without importing an app module.
- Keep runtime resource selection, environment configuration, and NestJS composition in each app's `apps/<app>/src/core/core.module.ts`. Do not require a separate `infra.module.ts`; introduce one only when the composition root has enough independent infrastructure wiring to justify it.
- Keep app-owned persistence models, migrations, seeders, and adapters in that app's `src/core`. Identical file contents alone do not make a model shared: check entity ownership, schema evolution, and policy first.
- Common guards, interceptors, middleware, and contexts must not depend on one domain implementation. Their app-specific secrets and identity inputs should be explicit providers or configuration values.
- Group a reusable capability and its provider adapters together in `packages/server-core/src/core/<capability>`; do not split it across shared code and app infrastructure merely because it calls an external system. Keep genuinely app-specific behavior in the app.
- Put reusable application orchestration in `packages/server-core/src/core/<capability>` (for example shared user authentication and message dispatch). Domain modules call these services; shared services must not import app domain modules. Keep feature-specific decisions, account workflows, recipients, and message content in domain modules.
- Keep JWT signing/verification in `packages/server-core/src/core/auth/user/adapters`; keep app-owned token/session stores beside the app persistence adapters when they depend on app entities. User credential issuance/rotation and shared password policy belong to the shared user-auth capability. Keep machine authentication separately under `packages/server-core/src/core/auth/machine`.
- Domain message senders use the common MessageService; SMTP/SMS/push/messenger/webhook adapters live with that capability in `packages/server-core/src/core/notification/adapters` (or `message` if that capability is renamed). Pass delivery configuration and content explicitly rather than making common services depend on system-config feature services.
- Prefer shared contracts or domain events for cross-domain interaction.
- Do not refactor existing cross-module references outside the current scope.
- Treat public HTTP/API contracts, Command/Query ownership, external DTO boundaries, validation/authorization, persistence, and cross-domain events as architectural boundaries.
- Prefer focused changes over broad mechanical refactors.
- Shared identity-verification result checks and normalization belong to `packages/server-core/src/core/phone-identity`; provider HTTP/retry/timeout handling lives in its `adapters` directory. Shared TOTP utilities belong to `packages/server-core/src/core/auth/user`. Operational alert orchestration belongs with its capability in `packages/server-core/src/core`, with provider adapters alongside it.

- Keep app-specific upstream clients local when their error translation or response contract differs. Do not put app-specific upstream codes into a shared client merely to remove duplicate transport code.
