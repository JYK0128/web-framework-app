import { Inject, Injectable } from '@nestjs/common';

import { ChannelTalkWebhookAdapter } from '#/core/webhook/adapters/channel-talk-webhook.adapter';
import { DiscordWebhookAdapter } from '#/core/webhook/adapters/discord-webhook.adapter';
import { SlackWebhookAdapter } from '#/core/webhook/adapters/slack-webhook.adapter';
import { TeamsWebhookAdapter } from '#/core/webhook/adapters/teams-webhook.adapter';
import { type IWebhookAdapter, WEBHOOK_MODULE_OPTIONS, type WebhookMessage, type WebhookModuleOptions } from '#/core/webhook/webhook.interface';

@Injectable()
export class WebhookAdapter implements IWebhookAdapter {
  readonly providerName = 'webhook';
  private readonly slackAdapter: SlackWebhookAdapter;
  private readonly discordAdapter: DiscordWebhookAdapter;
  private readonly channelTalkAdapter: ChannelTalkWebhookAdapter;
  private readonly teamsAdapter: TeamsWebhookAdapter;

  constructor(
    @Inject(WEBHOOK_MODULE_OPTIONS)
    options: WebhookModuleOptions,
  ) {
    this.slackAdapter = new SlackWebhookAdapter();
    this.discordAdapter = new DiscordWebhookAdapter(options);
    this.channelTalkAdapter = new ChannelTalkWebhookAdapter(options);
    this.teamsAdapter = new TeamsWebhookAdapter(options);
  }

  async send(message: WebhookMessage): Promise<void> {
    const url = (message.webhookUrl || '').toLowerCase();
    if (url.includes('discord.com')) {
      return this.discordAdapter.send(message);
    }
    if (url.includes('channel.io')) {
      return this.channelTalkAdapter.send(message);
    }
    if (url.includes('office.com') || url.includes('office365.com') || url.includes('teams.microsoft.com') || url.includes('webhook.office.com')) {
      return this.teamsAdapter.send(message);
    }
    return this.slackAdapter.send(message);
  }
}
