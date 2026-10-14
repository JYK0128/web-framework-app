import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { QnaAlertsController } from '#/modules/alerts/qna-alerts.controller';
import { QnaCreatedAlertHandler } from '#/modules/alerts/qna-created-alert.handler';
import { SupportAlertsController } from '#/modules/alerts/support-alerts.controller';
import { SupportUnansweredAlertHandler } from '#/modules/alerts/support-unanswered-alert.handler';

@Module({
  imports: [CqrsModule],
  controllers: [QnaAlertsController, SupportAlertsController],
  providers: [QnaCreatedAlertHandler, SupportUnansweredAlertHandler],
})
export class AlertsModule {}
