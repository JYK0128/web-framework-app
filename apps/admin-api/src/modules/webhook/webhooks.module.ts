import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SendWebhookHandler } from '~/modules/webhook/send-webhook.handler';
import { WebhooksController } from '~/modules/webhook/webhooks.controller';

@Module({ imports: [CqrsModule], controllers: [WebhooksController], providers: [SendWebhookHandler] })
export class WebhooksModule {}
