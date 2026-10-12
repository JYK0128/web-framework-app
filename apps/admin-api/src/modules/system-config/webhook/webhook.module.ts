import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SyncWebhookConfigHandler } from './sync-webhook-config.handler';
import { TestWebhookHandler } from './test-webhook.handler';
import { SystemConfigWebhookController } from './webhook.controller';

@Module({ imports: [CqrsModule], controllers: [SystemConfigWebhookController], providers: [TestWebhookHandler, SyncWebhookConfigHandler] })
export class SystemConfigWebhookModule {}
