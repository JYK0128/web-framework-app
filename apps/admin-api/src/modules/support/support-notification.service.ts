import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { SupportUnansweredAlertEvent } from '@pkg/shared/server';

import { EventBroker } from '#/infra/event-broker/event-broker.service';
import { RealtimeService } from '#/infra/realtime/realtime.service';

const SUPPORT_UNANSWERED_TOPIC = 'support:unanswered';

@Injectable()
export class SupportNotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SupportNotificationService.name);
  private unsubscribe?: () => Promise<void>;

  constructor(
    private readonly eventBroker: EventBroker,
    private readonly realtime: RealtimeService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.unsubscribe = await this.eventBroker.subscribe<SupportUnansweredAlertEvent>(
      SupportUnansweredAlertEvent.name,
      (event) => {
        this.realtime.publishSSE(SUPPORT_UNANSWERED_TOPIC, {
          type: 'support.unanswered',
          data: event,
        });
      },
      { adapter: 'redis-pubsub' },
    );
    this.logger.log('미응답 고객지원 SSE 알림 구독을 시작했습니다.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.unsubscribe?.();
  }
}
