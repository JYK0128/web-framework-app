import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { TestWebhookHandler } from './test-webhook.handler';
import { SystemConfigWebhookController } from './webhook.controller';

@Module({ imports: [CqrsModule], controllers: [SystemConfigWebhookController], providers: [TestWebhookHandler] })
export class SystemConfigWebhookModule {}
