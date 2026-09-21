---
name: fullstack-integration
description: >-
  Use when changing NestJS controllers, CQRS handlers, DTOs, entities,
  persistence, infrastructure, or the generated API connection to React.
  Do not apply to frontend-only UI work or isolated TypeScript changes.
---

# Full-stack integration

Use the independently discoverable integration skills when their workflow applies:
`cqrs-dto-integration`, `persistence-integration`, `guard-integration`,
`event-broker-integration`, `api-codegen-integration`, `router-conventions`,
and `layer-boundaries`.

## Rules

1. Inspect the domain implementation and shared abstractions before changing them; prefer current source over documentation.
2. Reuse existing CQRS, DTO, Entity, EventBroker, and EntityManager abstractions. Do not add unrelated layers or refactors.
3. Preserve the `identify → verify → process` business flow when those stages exist; do not split or rename helpers only to satisfy a mechanical layout.
4. Confirm the server contract first, then regenerate OpenAPI clients and use generated React types and hooks.
5. Update the relevant independent skill when a repository convention changes.

## Non-negotiable authentication invariants

Apply these rules whenever the task touches authentication, JWTs, M2M, service-to-service calls, config sync, or request forwarding.

- Fail closed. Do not add fallback behavior for authentication, authorization, service identity, M2M verification, config synchronization, or required environment variables. Missing credentials, invalid identity, unavailable required services, and sync failures must return/throw an error; never continue with stale data, `system`, an empty identity, a default token, or a silently skipped operation.
- Do not use `??`, `||`, `catch-and-continue`, or schema defaults to invent an auth identity or hide a required service failure. Optional observability metadata such as `x-request-id` may be omitted, but security inputs may not be substituted.
- Environment variables are explicit contracts: every required variable must be declared in the service `.env`/`.env.example` and validated as required. Never use Zod/schema `.default(...)`, dotenv fallback values, `process.env.X || <value>`, or `process.env.X ?? <value>` for required service URLs, secrets, database/Redis URLs, or other security/runtime configuration. Stable service identity and a statically defined M2M allowlist may live in typed code configuration; secrets and deployment-specific endpoints must not be hardcoded. Missing required external configuration must fail startup with a validation error.
- Use Zod v4 APIs for type-safe runtime contracts. Prefer top-level format schemas such as `z.url()`, `z.email()`, `z.uuid()`, and `z.iso.datetime()` over deprecated chained Zod v3 forms such as `z.string().url()`, `z.string().email()`, `z.string().uuid()`, and `z.string().datetime()`. Keep the inferred schema type as the source of truth; do not weaken it with broad casts or unvalidated `process.env` access.
- Auth JWTs represent users: `sub` is the user ID. M2M JWTs represent machines: `iss` and `sub` are the calling machine ID, and `aud` is the target machine ID. Never put a user ID in an M2M `sub`; do not add actor/delegation claims unless the user explicitly requests a separate delegation contract.
- M2M target selection must be explicit in `aud`. Each receiving machine owns only its local `M2M_ALLOWED_LIST` of trusted callers and rejects any `iss` outside that list. Do not require the caller to maintain a global registry of other machines.
- Keep M2M and user-auth token services separate. Never put refresh-token values in JWT claims such as `jti`; `jti` must be a separate random JWT identifier.
- When two services implement the same M2M contract, share the payload types, machine registry, connection policy, and TTL from a common package. Keep only direction-specific issuer/target wiring local.

## Required verification pass

Before handoff, search both participating services and their shared packages for stale identity names, fallback paths, duplicated M2M contracts, and old documentation. At minimum check for `actorId`, `actorSub`, `requestId` JWT claims, `jti: refreshToken`, fallback defaults around auth/config, and any catch block that continues after M2M or config failure. Run typechecks for both services and the shared package, then run `git diff --check`.

## Architectural scope

Control architectural contracts, not every implementation detail. Treat a finding as blocking when it changes or obscures one of these boundaries:

- public HTTP, Swagger/OpenAPI, or generated-client contracts;
- Command/Query intent, Handler ownership, or admin/public authority;
- external DTO versus internal Payload/domain result boundaries;
- validation, authorization, sensitive data exposure, persistence, or cross-domain events;
- duplicate, orphaned, or parallel contracts that can cause consumers to use different models.

Do not require mechanical uniformity for local variable names, helper-method layout, file placement, or equivalent internal implementations. Keep an existing implementation when it preserves the contract and boundaries. Prefer a focused change over a broad refactor.

When a detail is ambiguous, record it as a design decision or follow-up unless it affects one of the boundaries above.
