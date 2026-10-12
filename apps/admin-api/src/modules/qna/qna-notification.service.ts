import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { AdminQnaCreatedEvent } from '@pkg/shared/server';

import { EVENT_BROKER } from '#/core/event-broker/event-broker.interface';
import { EventBroker } from '#/core/event-broker/event-broker.service';
import { RealtimeService } from '#/core/realtime/realtime.service';

export const QNA_CREATED_TOPIC = 'qna:created';

@Injectable()
export class QnaNotificationService implements OnModuleInit, OnModuleDestroy {
  private unsubscribe?: () => Promise<void>;

  constructor(
    @Inject(EVENT_BROKER.REDIS_PUBSUB)
    private readonly eventBroker: EventBroker,
    private readonly realtime: RealtimeService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.unsubscribe = await this.eventBroker.subscribe<AdminQnaCreatedEvent>(
      AdminQnaCreatedEvent.name,
      (event) => {
        this.realtime.publishSSE(QNA_CREATED_TOPIC, {
          type: 'qna.created',
          data: event,
        });
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.unsubscribe?.();
  }
}
