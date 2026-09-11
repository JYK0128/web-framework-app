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
3. Implement handlers in the `identify → verify → process` order.
4. Confirm the server contract first, then regenerate OpenAPI clients and use generated React types and hooks.
5. Update relevant references when behavior changes.

Apply [dto-conventions](references/dto-conventions.md) when adding or changing DTOs.
