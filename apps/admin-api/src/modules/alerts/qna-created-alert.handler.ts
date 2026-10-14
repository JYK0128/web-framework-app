import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { BrokerConsumer } from '@pkg/server-core/event-broker/broker-consumer.decorator';
import { EVENT_BROKER } from '@pkg/server-core/event-broker/event-broker.interface';
import { RealtimeService } from '@pkg/server-core/realtime/realtime.service';
import { AdminQnaCreatedEvent } from '@pkg/shared/server';

import { QNA_CREATED_ALERT_TOPIC } from '#/modules/alerts/alerts.constants';

@EventsHandler(AdminQnaCreatedEvent)
@BrokerConsumer({ broker: EVENT_BROKER.REDIS_PUBSUB })
export class QnaCreatedAlertHandler implements IEventHandler<AdminQnaCreatedEvent> {
  constructor(
    private readonly realtime: RealtimeService,
  ) {}

  handle(event: AdminQnaCreatedEvent): void {
    this.realtime.publishSSE(QNA_CREATED_ALERT_TOPIC, { type: 'qna.created', data: event });
  }
}
