import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { BrokerConsumer, EVENT_BROKER } from '@pkg/server-core/event-broker';
import { AdminQnaCreatedEvent } from '@pkg/server-core/event-broker/events';
import { RealtimeService } from '@pkg/server-core/realtime';

import { QNA_CREATED_ALERT_TOPIC } from '~/modules/alert/alerts.constants';

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
