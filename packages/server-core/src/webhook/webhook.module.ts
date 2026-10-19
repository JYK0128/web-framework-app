import { Module } from '@nestjs/common';

import { ChannelTalkWebhookAdapter } from '#webhook/adapters/channel-talk.adapter';
import { DiscordWebhookAdapter } from '#webhook/adapters/discord.adapter';
import { SlackWebhookAdapter } from '#webhook/adapters/slack.adapter';
import { TeamsWebhookAdapter } from '#webhook/adapters/teams.adapter';
import { WebhookAdapter } from '#webhook/adapters/webhook.adapter';
import { WEBHOOK_ADAPTER } from '#webhook/webhook.interface';

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
