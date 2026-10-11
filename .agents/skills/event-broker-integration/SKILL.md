---
name: event-broker-integration
description: >-
  Use when adding or changing domain event publication, EventBroker adapters,
  broker configuration, or event handlers in the NestJS backend.
---

# Event Broker integration

- Follow the `EventBroker` `publish` and `publishAll` contracts.
- Use `src/infra/infra.module.ts` and `EventBrokerModule.forRoot(...)` as the configuration source.
- `EventBroker` injection uses `defaultAdapter` from `EventBrokerModule.forRoot(...)`, defaulting to in-memory when omitted. Explicit `EVENT_BROKER.*` constructor tokens always select their own adapter independently. Reject unconfigured defaults at module registration; keep unconfigured external tokens unregistered. Do not add per-call `adapter` selection.
- Runtime adapter names are `in-memory`, `redis-pubsub`, `redis-streams`, `kafka`, and `rabbitmq`; module option keys remain camelCase.
- When adding an adapter, update both `event-broker.interface.ts` and `event-broker.module.ts`.
- Do not create a separate event-publishing entry point.

- Listener contracts support `void | Promise<void>`. Durable adapters acknowledge/commit only after the returned promise succeeds; callers must return/await asynchronous work and throw on failure.
- Redis Streams, RabbitMQ, and Kafka subscriptions require an explicit `group`. Same group shares work; different groups consume independently. Redis Streams groups and Kafka topics/groups are scoped by event name.
- Publishing failures and unknown adapters must throw; do not log and silently skip. In-memory Nest CQRS delivery does not provide durable completion guarantees.
- Pub/Sub is live broadcast, not a durable job queue. Business retry limits, dead-letter policies, and idempotency belong to application services.
- Run `pnpm --filter <api> test:event-broker` against isolated Redis/RabbitMQ/Kafka test endpoints documented in `docs/event-broker.md`.
