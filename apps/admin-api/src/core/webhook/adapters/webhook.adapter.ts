import { Inject, Injectable } from '@nestjs/common';

import { ChannelTalkAdapter } from '#/core/webhook/adapters/channel-talk.adapter';
import { DiscordAdapter } from '#/core/webhook/adapters/discord.adapter';
import { SlackAdapter } from '#/core/webhook/adapters/slack.adapter';
import { TeamsAdapter } from '#/core/webhook/adapters/teams.adapter';
import { type IWebhookAdapter, WEBHOOK_MODULE_OPTIONS, type WebhookMessage, type WebhookModuleOptions } from '#/core/webhook/webhook.interface';

@Injectable()
export class WebhookAdapter implements IWebhookAdapter {
  readonly providerName = 'webhook';
  private readonly slackAdapter: SlackAdapter;
  private readonly discordAdapter: DiscordAdapter;
  private readonly channelTalkAdapter: ChannelTalkAdapter;
  private readonly teamsAdapter: TeamsAdapter;

  constructor(
    @Inject(WEBHOOK_MODULE_OPTIONS)
    options: WebhookModuleOptions,
  ) {
    this.slackAdapter = new SlackAdapter();
    this.discordAdapter = new DiscordAdapter(options);
    this.channelTalkAdapter = new ChannelTalkAdapter(options);
    this.teamsAdapter = new TeamsAdapter(options);
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
