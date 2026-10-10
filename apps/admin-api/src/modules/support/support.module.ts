import { Module } from '@nestjs/common';

import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';
import { SupportNotificationService } from './support-notification.service';

@Module({ controllers: [SupportController], providers: [SupportGateway, SupportNotificationService] })
export class SupportModule {}
