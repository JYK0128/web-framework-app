import { Injectable } from '@nestjs/common';
import { ChannelTalkWebhookAdapter } from '@pkg/server-core/webhook/adapters/channel-talk.adapter';
import { DiscordWebhookAdapter } from '@pkg/server-core/webhook/adapters/discord.adapter';
import { SlackWebhookAdapter } from '@pkg/server-core/webhook/adapters/slack.adapter';
import { TeamsWebhookAdapter } from '@pkg/server-core/webhook/adapters/teams.adapter';
import { type IWebhookAdapter, type WebhookMessage } from '@pkg/server-core/webhook/webhook.interface';

@Injectable()
export class WebhookAdapter implements IWebhookAdapter {
  readonly providerName = 'webhook';
  private readonly slackAdapter: SlackWebhookAdapter;
  private readonly discordAdapter: DiscordWebhookAdapter;
  private readonly channelTalkAdapter: ChannelTalkWebhookAdapter;
  private readonly teamsAdapter: TeamsWebhookAdapter;

  constructor(
    slackAdapter: SlackWebhookAdapter,
    discordAdapter: DiscordWebhookAdapter,
    channelTalkAdapter: ChannelTalkWebhookAdapter,
    teamsAdapter: TeamsWebhookAdapter,
  ) {
    this.slackAdapter = slackAdapter;
    this.discordAdapter = discordAdapter;
    this.channelTalkAdapter = channelTalkAdapter;
    this.teamsAdapter = teamsAdapter;
  }

  async send(message: WebhookMessage): Promise<void> {
    switch (message.type) {
      case 'DISCORD': return this.discordAdapter.send(message);
      case 'CHANNEL_TALK': return this.channelTalkAdapter.send(message);
      case 'TEAMS': return this.teamsAdapter.send(message);
      case 'SLACK': return this.slackAdapter.send(message);
    }
  }
}
