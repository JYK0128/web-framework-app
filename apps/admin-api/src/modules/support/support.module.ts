import { Module } from '@nestjs/common';

import { SupportNotificationService } from './notification/support-notification.service';
import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';

@Module({ controllers: [SupportController], providers: [SupportGateway, SupportNotificationService] })
export class SupportModule {}
