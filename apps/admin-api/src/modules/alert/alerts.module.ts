import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { QnaAlertsController } from '~/modules/alert/qna-alerts.controller';
import { QnaCreatedAlertHandler } from '~/modules/alert/qna-created-alert.handler';
import { SupportAlertsController } from '~/modules/alert/support-alerts.controller';
import { SupportUnansweredAlertHandler } from '~/modules/alert/support-unanswered-alert.handler';

@Module({
  imports: [CqrsModule],
  controllers: [QnaAlertsController, SupportAlertsController],
  providers: [QnaCreatedAlertHandler, SupportUnansweredAlertHandler],
})
export class AlertsModule {}
