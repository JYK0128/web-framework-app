import { Module } from '@nestjs/common';
import { ChannelTalkWebhookAdapter } from '@pkg/server-core/webhook/adapters/channel-talk.adapter';
import { DiscordWebhookAdapter } from '@pkg/server-core/webhook/adapters/discord.adapter';
import { SlackWebhookAdapter } from '@pkg/server-core/webhook/adapters/slack.adapter';
import { TeamsWebhookAdapter } from '@pkg/server-core/webhook/adapters/teams.adapter';
import { WebhookAdapter } from '@pkg/server-core/webhook/adapters/webhook.adapter';
import { WEBHOOK_ADAPTER } from '@pkg/server-core/webhook/webhook.interface';

import { WebhookService } from './webhook.service';

@Module({
  providers: [
    ChannelTalkWebhookAdapter,
    DiscordWebhookAdapter,
    SlackWebhookAdapter,
    TeamsWebhookAdapter,
    WebhookAdapter,
    WebhookService,
    {
      provide: WEBHOOK_ADAPTER,
      useExisting: WebhookAdapter,
    },
  ],
  exports: [WebhookService],
})
export class WebhookModule {}
