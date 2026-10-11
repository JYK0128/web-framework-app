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
- Infrastructure owns foundational database, KV, event-broker, logging/telemetry, and request-language plumbing. Group capability services and their provider adapters together in `core/services/<capability>`; do not split a capability across common and infra merely because it calls an external system.
- Put reusable application orchestration in `core/services/<capability>` (for example user authentication and message dispatch). Domain modules call these services; common services may use infrastructure but must not import domain-module implementations. Keep feature-specific decisions, account workflows, recipients, and message content in domain modules.
- Keep JWT signing/verification and token/session stores in `core/services/auth/user/adapters`; user credential issuance/rotation and shared password policy belong to `core/services/auth/user`. Keep machine authentication separately under `core/services/auth/machine`.
- Domain message senders use the common MessageService; SMTP/SMS/push/messenger/webhook adapters live in `core/services/message/adapters`. Pass delivery configuration and content explicitly rather than making common services depend on system-config feature services.
- Prefer shared contracts or domain events for cross-domain interaction.
- Do not refactor existing cross-module references outside the current scope.
- Treat public HTTP/API contracts, Command/Query ownership, external DTO boundaries, validation/authorization, persistence, and cross-domain events as architectural boundaries.
- Prefer focused changes over broad mechanical refactors.
- Shared identity-verification result checks and normalization belong to `core/services/identity`; provider HTTP/retry/timeout handling lives in its `adapters` directory. Shared TOTP utilities belong to `core/services/auth/user`. Operational alert orchestration belongs to `core/services/alert`, with provider adapters in the same capability’s `adapters` directory.

- Select runtime resources and pass environment/config values in `infra/infra.module.ts`; keep capability implementations in `core/services`. Do not put deployment wiring in a common ServicesModule.
