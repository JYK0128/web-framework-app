import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { TestWebhookHandler } from '#/modules/system-config/webhook/test-webhook.handler';
import { SystemConfigWebhookController } from '#/modules/system-config/webhook/webhook.controller';

@Module({ imports: [CqrsModule], controllers: [SystemConfigWebhookController], providers: [TestWebhookHandler] })
export class SystemConfigWebhookModule {}
