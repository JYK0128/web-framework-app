import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { BrokerConsumer } from '@pkg/server-core/event-broker/broker-consumer.decorator';
import { EVENT_BROKER } from '@pkg/server-core/event-broker/event-broker.interface';
import { SupportUnansweredAlertEvent } from '@pkg/server-core/event-broker/events';
import { RealtimeService } from '@pkg/server-core/realtime/realtime.service';

import { SUPPORT_UNANSWERED_ALERT_TOPIC } from '#/modules/alert/alerts.constants';

@EventsHandler(SupportUnansweredAlertEvent)
@BrokerConsumer({ broker: EVENT_BROKER.REDIS_PUBSUB })
export class SupportUnansweredAlertHandler implements IEventHandler<SupportUnansweredAlertEvent> {
  constructor(
    private readonly realtime: RealtimeService,
  ) {}

  handle(event: SupportUnansweredAlertEvent): void {
    this.realtime.publishSSE(SUPPORT_UNANSWERED_ALERT_TOPIC, { type: 'support.unanswered', data: event });
  }
}
