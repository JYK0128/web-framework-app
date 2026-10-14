import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger, type MessageEvent, type OnModuleDestroy, type OnModuleInit, Optional } from '@nestjs/common';
import type { SSEEvent } from '@pkg/server-core/realtime/adapters/sse.interface';
import { REALTIME_MODULE_OPTIONS, type RealtimeModuleOptions } from '@pkg/server-core/realtime/realtime.interface';
import { createClient } from 'redis';
import { Observable, Subject, type Subscription } from 'rxjs';

interface DistributedSSEMessage {
  origin: string
  topic: string
  event: SSEEvent
}

interface SSETopic {
  subject: Subject<MessageEvent>
  subscriberCount: number
  sourceSubscription?: Subscription
}

@Injectable()
export class SSEAdapter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SSEAdapter.name);
  private readonly topics = new Map<string, SSETopic>();
  private readonly instanceId = randomUUID();
  private publisher: ReturnType<typeof createClient> | null = null;
  private subscriber: ReturnType<typeof createClient> | null = null;
  private channel = 'realtime:sse';

  constructor(@Optional() @Inject(REALTIME_MODULE_OPTIONS) private readonly options?: RealtimeModuleOptions) {}

  async onModuleInit(): Promise<void> {
    const configuredRedis = this.options?.sse?.redis;
    if (!configuredRedis) return;
    const { key, ...redisOptions } = configuredRedis;
    this.channel = key ?? this.channel;

    const publisher = createClient(redisOptions);
    const subscriber = publisher.duplicate();
    publisher.on('error', (error: unknown) => this.logger.error(`SSE Redis publisher error: ${error instanceof Error ? error.message : String(error)}`));
    subscriber.on('error', (error: unknown) => this.logger.error(`SSE Redis subscriber error: ${error instanceof Error ? error.message : String(error)}`));
    try {
      await Promise.all([publisher.connect(), subscriber.connect()]);
      await subscriber.subscribe(this.channel, (payload) => this.receiveDistributed(payload));
      this.publisher = publisher;
      this.subscriber = subscriber;
    }
    catch (error) {
      await Promise.allSettled([
        publisher.isOpen ? publisher.quit() : Promise.resolve(),
        subscriber.isOpen ? subscriber.quit() : Promise.resolve(),
      ]);
      throw error;
    }
  }

  stream(topic: string): Observable<MessageEvent> {
    return this.createStream(topic);
  }

  bridge<TData extends string | object>(topic: string, source: Observable<SSEEvent<TData>>): Observable<MessageEvent> {
    return this.createStream(topic, source);
  }

  private createStream(topic: string, source?: Observable<SSEEvent<string | object>>): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const topicState = this.getOrCreateTopic(topic);
      topicState.subscriberCount += 1;

      const eventSubscription = topicState.subject.subscribe(subscriber);
      this.connectSource(topic, topicState, source);

      return () => {
        eventSubscription.unsubscribe();
        this.releaseTopic(topic, topicState);
      };
    });
  }

  publish<TData extends string | object>(topic: string, event: SSEEvent<TData>): number {
    const topicState = this.topics.get(topic);
    topicState?.subject.next(event);
    this.publishDistributed(topic, event);
    return topicState?.subscriberCount ?? 0;
  }

  broadcast<TData extends string | object>(event: SSEEvent<TData>): number {
    let subscriberCount = 0;

    for (const topicState of this.topics.values()) {
      topicState.subject.next(event);
      subscriberCount += topicState.subscriberCount;
    }

    this.publishDistributed('*', event);
    return subscriberCount;
  }

  async onModuleDestroy(): Promise<void> {
    for (const topicState of this.topics.values()) {
      topicState.sourceSubscription?.unsubscribe();
      topicState.subject.complete();
    }
    this.topics.clear();
    const closing: Promise<unknown>[] = [];
    if (this.publisher?.isOpen) closing.push(this.publisher.quit());
    if (this.subscriber?.isOpen) closing.push(this.subscriber.quit());
    const results = await Promise.allSettled(closing);
    for (const result of results) {
      if (result.status === 'rejected') this.logger.error(`Failed to close SSE Redis connection: ${String(result.reason)}`);
    }
  }

  private publishDistributed(topic: string, event: SSEEvent): void {
    if (!this.publisher?.isOpen) return;
    const message = JSON.stringify({ origin: this.instanceId, topic, event } satisfies DistributedSSEMessage);
    if (!message) return;
    void this.publisher.publish(this.channel, message).catch((error: unknown) => {
      this.logger.error(`Failed to publish SSE event to Redis: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  private receiveDistributed(payload: string): void {
    let message: DistributedSSEMessage;
    try {
      message = JSON.parse(payload) as DistributedSSEMessage;
    }
    catch (error) {
      this.logger.error(`Ignoring malformed SSE Redis message: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    if (message.origin === this.instanceId || !message.event || (message.topic !== '*' && typeof message.topic !== 'string')) return;
    if (message.topic === '*') {
      for (const topicState of this.topics.values()) topicState.subject.next(message.event);
      return;
    }
    this.topics.get(message.topic)?.subject.next(message.event);
  }

  private getOrCreateTopic(topic: string): SSETopic {
    const existingTopic = this.topics.get(topic);
    if (existingTopic) return existingTopic;

    const newTopic: SSETopic = {
      subject: new Subject<MessageEvent>(),
      subscriberCount: 0,
    };
    this.topics.set(topic, newTopic);
    return newTopic;
  }

  /**
   * source Observable을 topic Subject에 연결한다.
   * - source가 없으면 아무것도 하지 않는다 (stream() 전용 topic).
   * - 이미 source가 연결된 topic에 새 source가 전달되면 무시하고 경고를 남긴다.
   *   하나의 topic에 복수의 producer를 허용하지 않는 것이 의도된 설계다.
   * - source가 error/complete로 종료되면 topic을 Map에서 제거해 재구독이 가능하도록 한다.
   */
  private connectSource(topic: string, topicState: SSETopic, source?: Observable<SSEEvent<string | object>>): void {
    if (!source) return;

    if (topicState.sourceSubscription) {
      this.logger.warn(`Topic "${topic}" already has a connected source. The new source will be ignored.`);
      return;
    }

    topicState.sourceSubscription = source.subscribe({
      next: (event) => topicState.subject.next(event),
      error: (error: unknown) => {
        topicState.subject.error(error);
        this.topics.delete(topic);
      },
      complete: () => {
        topicState.subject.complete();
        this.topics.delete(topic);
      },
    });
  }

  private releaseTopic(topic: string, topicState: SSETopic): void {
    topicState.subscriberCount = Math.max(0, topicState.subscriberCount - 1);
    if (topicState.subscriberCount === 0 && this.topics.get(topic) === topicState) {
      topicState.sourceSubscription?.unsubscribe();
      topicState.subject.complete();
      this.topics.delete(topic);
    }
  }
}
