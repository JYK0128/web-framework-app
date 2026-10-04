---
name: event-broker-integration
description: >-
  Use when adding or changing domain event publication, EventBroker adapters,
  broker configuration, or event handlers in the NestJS backend.
---

# Event Broker integration

- Follow the `EventBroker` `publish` and `publishAll` contracts.
- Use `src/infra/infra.module.ts` and `EventBrokerModule.forRoot(...)` as the configuration source.
- Supported adapter names are `in-memory`, `redisPubSub`, `redisStreams`, `kafka`, and `rabbitmq`.
- When adding an adapter, update both `event-broker.interface.ts` and `event-broker.module.ts`.
- Do not create a separate event-publishing entry point.
