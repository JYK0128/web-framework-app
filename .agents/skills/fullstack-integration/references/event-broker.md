# Event Broker

- Follow the `EventBroker` `publish` and `publishAll` contracts.
- Use `src/infra/infra.module.ts` and `EventBrokerModule.forRoot(...)` as the configuration source.
- Adapter names: `in-memory`, `redisPubSub`, `redisStreams`, `kafka`, and `rabbitmq`.
- When adding an adapter, update both `event-broker.interface.ts` and `event-broker.module.ts`.
- Do not create a separate event-publishing entry point.
