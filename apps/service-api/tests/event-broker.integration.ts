import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { NestFactory } from '@nestjs/core';
import { EVENT_BROKER } from '../src/infra/event-broker/event-broker.interface';
import { EventBrokerModule } from '../src/infra/event-broker/event-broker.module';
import { EventBus } from '@nestjs/cqrs';
import { createClient } from 'redis';
import { Kafka } from 'kafkajs';
import { RedisStreamsEventBrokerAdapter } from '../src/infra/event-broker/adapters/redis-streams/redis-streams-event-broker.adapter';
import { RedisPubSubEventBrokerAdapter } from '../src/infra/event-broker/adapters/redis-pubsub/redis-pubsub-event-broker.adapter';
import { RabbitMQEventBrokerAdapter } from '../src/infra/event-broker/adapters/rabbitmq/rabbitmq-event-broker.adapter';
import { KafkaEventBrokerAdapter } from '../src/infra/event-broker/adapters/kafka/kafka-event-broker.adapter';
import { InMemoryEventBrokerAdapter } from '../src/infra/event-broker/adapters/in-memory/in-memory-event-broker.adapter';
import { EventBroker } from '../src/infra/event-broker/event-broker.service';

class VerificationEvent { constructor(readonly value: number) {} }
const suffix = randomUUID();
async function waitFor(check: () => boolean, timeout = 30000) {
  const end = Date.now() + timeout;
  while (!check()) {
    if (Date.now() > end) throw new Error('Timed out waiting for event');
    await delay(50);
  }
}
const memory = new InMemoryEventBrokerAdapter({ publish() {} } as unknown as EventBus);
const broker = new EventBroker(memory);

let finished = false;
const stopMemory = await broker.subscribe(VerificationEvent.name, async () => { await delay(20); finished = true; });
await broker.publish(new VerificationEvent(1));
assert.equal(finished, true);
await stopMemory();
const stopFailure = await broker.subscribe(VerificationEvent.name, async () => { throw new Error('expected listener failure'); });
await assert.rejects(broker.publish(new VerificationEvent(1)));
await stopFailure();
const failingBroker = new EventBroker({ name: 'fail', async publish() { throw new Error('publish failed'); } });
await assert.rejects(failingBroker.publishAll([new VerificationEvent(1)]));
let selected = '';
const selectedBroker = new EventBroker({ name: 'selected', async publish() { selected = 'selected'; } });
await selectedBroker.publish(new VerificationEvent(1));
assert.equal(selected, 'selected');
assert.equal(memory.name, 'in-memory');
const app = await NestFactory.createApplicationContext(EventBrokerModule.forRoot(), { logger: false });
try {
  assert.equal(app.get(EventBroker), app.get(EVENT_BROKER.IN_MEMORY));
  assert.throws(() => app.get(EVENT_BROKER.REDIS_PUBSUB));
}
finally { await app.close(); }
for (const defaultAdapter of [undefined, 'redis-pubsub'] as const) {
  const configured = EventBrokerModule.forRoot({ defaultAdapter, redisPubSub: { url: 'redis://unused:6379', topic: 'test' } });
  configured.providers = configured.providers?.map((provider) => provider === RedisPubSubEventBrokerAdapter
    ? { provide: RedisPubSubEventBrokerAdapter, useValue: { name: 'redis-pubsub', async publish() { selected = 'redis-pubsub'; } } }
    : provider);
  const configuredApp = await NestFactory.createApplicationContext(configured, { logger: false });
  try {
    const defaultToken = defaultAdapter === 'redis-pubsub' ? EVENT_BROKER.REDIS_PUBSUB : EVENT_BROKER.IN_MEMORY;
    assert.equal(configuredApp.get(EventBroker), configuredApp.get(defaultToken));
    selected = '';
    await configuredApp.get<EventBroker>(EVENT_BROKER.IN_MEMORY).publish(new VerificationEvent(1));
    assert.equal(selected, '');
    await configuredApp.get<EventBroker>(EVENT_BROKER.REDIS_PUBSUB).publish(new VerificationEvent(1));
    assert.equal(selected, 'redis-pubsub');
  }
  finally { await configuredApp.close(); }
}
for (const defaultAdapter of ['redis-pubsub', 'redis-streams', 'rabbitmq', 'kafka'] as const) {
  assert.throws(() => EventBrokerModule.forRoot({ defaultAdapter }), /not registered/);
}
console.log('Constructor selection, default injection, in-memory listener and publish errors: passed');
if (process.argv.includes('--memory-only')) process.exit(0);

const redis = new RedisStreamsEventBrokerAdapter({ url: 'redis://localhost:16389', stream: `verify:${suffix}` });
await redis.onModuleInit();
try {
  let attempts = 0;
  let completed = false;
  const stop = await redis.subscribe(VerificationEvent.name, async payload => {
    assert.equal((payload as VerificationEvent).value, 1);
    attempts++;
    if (attempts === 1) throw new Error('expected first attempt failure');
    await delay(50);
    completed = true;
  }, { group: 'workers', retryIdleMs: 100 });
  await redis.publish(new VerificationEvent(1));
  await waitFor(() => completed);
  assert.ok(attempts >= 2);
  const client = createClient({ url: 'redis://localhost:16389' });
  await client.connect();
  await waitFor(() => completed);
  await delay(100);
  assert.equal((await client.xPending(`verify:${suffix}`, `workers:${VerificationEvent.name}`)).pending, 0);
  await stop();
  await redis.publish(new VerificationEvent(2));
  let resumed = false;
  const stopAgain = await redis.subscribe(VerificationEvent.name, payload => { resumed = (payload as VerificationEvent).value === 2; }, { group: 'workers', retryIdleMs: 100 });
  await waitFor(() => resumed);
  await stopAgain();
  await client.del(`verify:${suffix}`);
  await client.quit();
  console.log('Redis Streams failure redelivery, ACK, offline backlog, unsubscribe: passed');
}
finally { await redis.onModuleDestroy(); }

const pubsub = new RedisPubSubEventBrokerAdapter({ url: 'redis://localhost:16389', topic: `verify-pubsub:${suffix}` });
await pubsub.onModuleInit();
try {
  let count = 0;
  const stop = await pubsub.subscribe(VerificationEvent.name, async () => { await delay(20); count++; });
  await pubsub.publish(new VerificationEvent(1));
  await waitFor(() => count === 1);
  await stop();
  await pubsub.publish(new VerificationEvent(2));
  await delay(100);
  assert.equal(count, 1);
  console.log('Redis Pub/Sub async listener and unsubscribe: passed');
}
finally { await pubsub.onModuleDestroy(); }

const kafkaAdmin = new Kafka({ brokers: ['localhost:19092'] }).admin();
await kafkaAdmin.connect();
await kafkaAdmin.createTopics({ waitForLeaders: true, topics: [{ topic: `verify-${suffix}.${VerificationEvent.name}`, numPartitions: 1, replicationFactor: 1 }] });
await kafkaAdmin.disconnect();

for (const adapter of [new RabbitMQEventBrokerAdapter({ url: 'amqp://localhost:15679', exchange: `verify-${suffix}` }), new KafkaEventBrokerAdapter({ brokers: ['localhost:19092'], topic: `verify-${suffix}` })]) {
  await adapter.onModuleInit();
  try {
    let attempts = 0;
    let completed = false;
    const stop = await adapter.subscribe(VerificationEvent.name, async payload => {
      assert.equal((payload as VerificationEvent).value, 1);
      attempts++;
      if (attempts === 1) throw new Error('expected first attempt failure');
      await delay(50);
      completed = true;
    }, { group: 'workers' });
    await adapter.publish(new VerificationEvent(1));
    await waitFor(() => completed);
    assert.ok(attempts >= 2);
    await delay(100);
    await stop();
    await adapter.publish(new VerificationEvent(2));
    let resumed = false;
    const stopAgain = await adapter.subscribe(VerificationEvent.name, payload => { resumed = (payload as VerificationEvent).value === 2; }, { group: 'workers' });
    await waitFor(() => resumed);
    await stopAgain();
    console.log(`${adapter.name} failure redelivery, completion, offline backlog, unsubscribe: passed`);
  }
  finally { await adapter.onModuleDestroy(); }
  await assert.rejects(adapter.publish(new VerificationEvent(3)));
}
