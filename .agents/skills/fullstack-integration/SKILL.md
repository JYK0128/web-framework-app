---
name: fullstack-integration
description: >-
  Use when changing NestJS controllers, CQRS handlers, DTOs, entities,
  persistence, infrastructure, or the generated API connection to React.
  Do not apply to frontend-only UI work or isolated TypeScript changes.
---

# Full-stack integration

## References

- CQRS and DTOs → [cqrs](references/cqrs.md)
- Persistence and RequestContext → [persistence](references/persistence.md)
- Guards → [guards](references/guards.md)
- Event Broker → [event-broker](references/event-broker.md)
- API SSOT and codegen → [ssot](references/ssot.md)
- Router → [router](references/router.md)
- Layer boundaries → [boundaries](references/boundaries.md)
- DTO naming and mapping → [dto-conventions](references/dto-conventions.md)

## Rules

1. Inspect the domain implementation and shared abstractions before changing them; prefer current source over documentation.
2. Reuse existing CQRS, DTO, Entity, EventBroker, and EntityManager abstractions. Do not add unrelated layers or refactors.
3. Preserve the `identify → verify → process` business flow when those stages exist; do not split or rename helpers only to satisfy a mechanical layout.
4. Confirm the server contract first, then regenerate OpenAPI clients and use generated React types and hooks.
5. Update relevant references when behavior changes.

Apply [dto-conventions](references/dto-conventions.md) when adding or changing DTOs.

## Architectural scope

Control architectural contracts, not every implementation detail. Treat a finding as blocking when it changes or obscures one of these boundaries:

- public HTTP, Swagger/OpenAPI, or generated-client contracts;
- Command/Query intent, Handler ownership, or admin/public authority;
- external DTO versus internal Payload/domain result boundaries;
- validation, authorization, sensitive data exposure, persistence, or cross-domain events;
- duplicate, orphaned, or parallel contracts that can cause consumers to use different models.

Do not require mechanical uniformity for local variable names, helper-method layout, file placement, or equivalent internal implementations. Keep an existing implementation when it preserves the contract and boundaries. Prefer a focused change over a broad refactor.

When a detail is ambiguous, record it as a design decision or follow-up unless it affects one of the boundaries above.
