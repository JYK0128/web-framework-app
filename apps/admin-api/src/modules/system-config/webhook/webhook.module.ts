import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SyncWebhookConfigHandler } from '#/modules/system-config/webhook/sync-webhook-config.handler';
import { TestWebhookHandler } from '#/modules/system-config/webhook/test-webhook.handler';
import { SystemConfigWebhookController } from '#/modules/system-config/webhook/webhook.controller';

@Module({ imports: [CqrsModule], controllers: [SystemConfigWebhookController], providers: [TestWebhookHandler, SyncWebhookConfigHandler] })
export class SystemConfigWebhookModule {}
