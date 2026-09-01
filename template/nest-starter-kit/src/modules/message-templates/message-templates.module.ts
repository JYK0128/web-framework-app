import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AlertsGateway } from '#/modules/alerts/alerts.gateway';

import { messageTemplateHandlers } from './handlers';
import { MessageTemplatesController } from './message-templates.controller';

@Module({
  imports: [CqrsModule],
  controllers: [MessageTemplatesController],
  providers: [
    AlertsGateway,
    ...messageTemplateHandlers,
  ],
  exports: [CqrsModule],
})
export class MessageTemplatesModule {}
