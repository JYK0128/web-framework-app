import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AlertsController } from './alerts.controller';
import { AlertsGateway } from './alerts.gateway';
import { alertHandlers } from './handlers';

@Module({
  imports: [CqrsModule],
  controllers: [AlertsController],
  providers: [
    AlertsGateway,
    ...alertHandlers,
  ],
  exports: [AlertsGateway, CqrsModule],
})
export class AlertsModule {}
