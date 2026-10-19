import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';

import { BrokerConsumer } from '../src/core/event-broker/broker-consumer.decorator';
import { RedisStreamsAdapter } from '../src/core/event-broker/adapters/redis-streams.adapter';
import { type BrokerConsumerOptions, type BrokerListener, EVENT_BROKER } from '../src/core/event-broker/event-broker.interface';
import { EventBrokerModule } from '../src/core/event-broker/event-broker.module';
import { EventBroker } from '../src/core/event-broker/event-broker.service';

export async function verifyBrokerHandlers(): Promise<void> {
  class LocalEvent { constructor(readonly value: number) {} }
  class RemoteEvent {
    constructor(readonly value: number) {}
    doubled(): number { return this.value * 2; }
  }
  let localDeliveries = 0;
  let remoteDeliveries = 0;
  let secondDeliveries = 0;
  let started!: () => void;
  let finish!: () => void;
  let shouldFail = false;
  let handlerStarted = new Promise<void>((resolve) => { started = resolve; });
  let handlerCompletion = new Promise<void>((resolve) => { finish = resolve; });
  @EventsHandler(LocalEvent)
  @BrokerConsumer()
  class LocalHandler implements IEventHandler<LocalEvent> {
    handle(): void { localDeliveries++; }
  }
  @EventsHandler(RemoteEvent)
  @BrokerConsumer({ broker: EVENT_BROKER.REDIS_STREAMS, group: 'handler-workers' })
  class RemoteHandler implements IEventHandler<RemoteEvent> {
    async handle(event: RemoteEvent): Promise<void> {
      assert.ok(event instanceof RemoteEvent);
      assert.equal(event.doubled(), 14);
      remoteDeliveries++;
      started();
      await handlerCompletion;
      if (shouldFail) throw new Error('handler failed');
    }
  }
  @EventsHandler(RemoteEvent)
  @BrokerConsumer({ broker: EVENT_BROKER.REDIS_STREAMS, group: 'handler-workers' })
  class SecondHandler implements IEventHandler<RemoteEvent> {
    handle(): void { secondDeliveries++; }
  }
  const subscriptions: { eventName: string, listener: BrokerListener, options?: BrokerConsumerOptions }[] = [];
  let acknowledgements = 0;
  let stops = 0;
  const fakeStreams = {
    name: 'redis-streams',
    async publish(event: RemoteEvent) {
      for (const subscription of subscriptions.filter((item) => item.eventName === event.constructor.name)) {
        await subscription.listener(JSON.parse(JSON.stringify(event)));
        acknowledgements++;
      }
    },
    async subscribe(eventName: string, listener: BrokerListener, options?: BrokerConsumerOptions) {
      const subscription = { eventName, listener, options };
      subscriptions.push(subscription);
      return async () => { stops++; subscriptions.splice(subscriptions.indexOf(subscription), 1); };
    },
  };
  const brokerModule = EventBrokerModule.forRoot({ redisStreams: { url: 'redis://unused:6379', stream: 'test' } });
  brokerModule.providers = brokerModule.providers?.map((provider) => provider === RedisStreamsAdapter
    ? { provide: RedisStreamsAdapter, useValue: fakeStreams } : provider);
  @Module({ imports: [brokerModule], providers: [LocalHandler, RemoteHandler, SecondHandler] })
  class TestModule {}
  const app = await NestFactory.createApplicationContext(TestModule, { logger: false, abortOnError: false });
  try {
    assert.equal(subscriptions.length, 1, 'same event/group fans out through one subscription');
    assert.equal(subscriptions[0].options?.group, 'handler-workers');
    await app.get(EventBroker).publish(new LocalEvent(1));
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(localDeliveries, 1, 'in-memory EventBus delivery must not be duplicated');
    const externalBroker = app.get<EventBroker>(EVENT_BROKER.REDIS_STREAMS);
    const delivery = externalBroker.publish(new RemoteEvent(7));
    await handlerStarted;
    assert.equal(acknowledgements, 0, 'do not acknowledge while handler is running');
    assert.equal(secondDeliveries, 0);
    finish();
    await delivery;
    assert.equal(acknowledgements, 1);
    assert.equal(remoteDeliveries, 1);
    assert.equal(secondDeliveries, 1);
    shouldFail = true;
    await assert.rejects(externalBroker.publish(new RemoteEvent(7)), /handler failed/);
    assert.equal(acknowledgements, 1, 'failed handler must remain unacknowledged');
    assert.equal(secondDeliveries, 1);
    shouldFail = false;
    await externalBroker.publish(new RemoteEvent(7));
    assert.equal(acknowledgements, 2);
    assert.equal(secondDeliveries, 2);
    await assert.rejects(async () => subscriptions[0].listener(null));
    assert.equal(acknowledgements, 2);
  }
  finally { finish(); await app.close(); }
  assert.equal(stops, 1);
  assert.equal(subscriptions.length, 0);

  @Module({ imports: [EventBrokerModule.forRoot()], providers: [RemoteHandler] })
  class MissingBrokerModule {}
  await assert.rejects(NestFactory.createApplicationContext(MissingBrokerModule, { logger: false, abortOnError: false }));
  console.log('CQRS broker handlers: awaited completion, failure/retry, fanout, class restoration, single local delivery, shutdown and missing-adapter rejection passed');
}

export async function verifyRedisBrokerHandlers(): Promise<void> {
  class DurableHandlerEvent { constructor(readonly value: number) {} }
  const stream = `cqrs-handler-test:${crypto.randomUUID()}`;
  let attempts = 0;
  let completed = false;
  let finish!: () => void;
  const completion = new Promise<void>((resolve) => { finish = resolve; });
  @EventsHandler(DurableHandlerEvent)
  @BrokerConsumer({ broker: EVENT_BROKER.REDIS_STREAMS, group: 'cqrs-workers', retryIdleMs: 100 })
  class DurableHandler implements IEventHandler<DurableHandlerEvent> {
    async handle(event: DurableHandlerEvent): Promise<void> {
      assert.ok(event instanceof DurableHandlerEvent);
      assert.equal(event.value, 9);
      attempts++;
      if (attempts === 1) throw new Error('expected first handler attempt failure');
      await completion;
      completed = true;
    }
  }
  @Module({ imports: [EventBrokerModule.forRoot({ redisStreams: { url: 'redis://localhost:16389', stream } })], providers: [DurableHandler] })
  class DurableTestModule {}
  const { createClient } = await import('redis');
  const client = createClient({ url: 'redis://localhost:16389' });
  const app = await NestFactory.createApplicationContext(DurableTestModule, { logger: false, abortOnError: false });
  try {
    await client.connect();
    await app.get<EventBroker>(EVENT_BROKER.REDIS_STREAMS).publish(new DurableHandlerEvent(9));
    const deadline = Date.now() + 15000;
    while (attempts < 2) {
      assert.ok(Date.now() < deadline, 'failed CQRS handler should be redelivered');
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(completed, false);
    assert.equal((await client.xPending(stream, `cqrs-workers:${DurableHandlerEvent.name}`)).pending, 1);
    finish();
    while ((await client.xPending(stream, `cqrs-workers:${DurableHandlerEvent.name}`)).pending !== 0) {
      assert.ok(Date.now() < deadline, 'successful handler should be acknowledged');
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(completed, true);
  }
  finally {
    finish();
    await app.close();
    if (client.isOpen) { await client.del(stream); await client.quit(); }
  }
  console.log('Real Redis Streams → IEventHandler: failed handling redelivered, pending until completion, ACK after success passed');
}
