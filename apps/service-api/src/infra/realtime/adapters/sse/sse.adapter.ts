import { Injectable, Logger, type MessageEvent, type OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject, type Subscription } from 'rxjs';

import type { SSEEvent } from './sse.interface';

interface SSETopic {
  subject: Subject<MessageEvent>
  subscriberCount: number
  sourceSubscription?: Subscription
}

@Injectable()
export class SSEAdapter implements OnModuleDestroy {
  private readonly logger = new Logger(SSEAdapter.name);
  private readonly topics = new Map<string, SSETopic>();

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
    if (!topicState) return 0;

    topicState.subject.next(event);
    return topicState.subscriberCount;
  }

  broadcast<TData extends string | object>(event: SSEEvent<TData>): number {
    let subscriberCount = 0;

    for (const topicState of this.topics.values()) {
      topicState.subject.next(event);
      subscriberCount += topicState.subscriberCount;
    }

    return subscriberCount;
  }

  onModuleDestroy(): void {
    for (const topicState of this.topics.values()) {
      topicState.sourceSubscription?.unsubscribe();
      topicState.subject.complete();
    }
    this.topics.clear();
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
