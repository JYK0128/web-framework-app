import { Inject, Injectable } from '@nestjs/common';

import { ChannelTalkAlertAdapter } from '#/infra/alert/adapters/channel-talk.adapter';
import { DiscordAlertAdapter } from '#/infra/alert/adapters/discord.adapter';
import { SlackAlertAdapter } from '#/infra/alert/adapters/slack.adapter';
import { TeamsAlertAdapter } from '#/infra/alert/adapters/teams.adapter';
import { ALERT_MODULE_OPTIONS, type AlertMessage, type AlertModuleOptions, type IAlertAdapter } from '#/infra/alert/alert.interface';

@Injectable()
export class WebhookAlertAdapter implements IAlertAdapter {
  readonly providerName = 'webhook';
  private readonly slackAdapter: SlackAlertAdapter;
  private readonly discordAdapter: DiscordAlertAdapter;
  private readonly channelTalkAdapter: ChannelTalkAlertAdapter;
  private readonly teamsAdapter: TeamsAlertAdapter;

  constructor(
    @Inject(ALERT_MODULE_OPTIONS)
    options: AlertModuleOptions,
  ) {
    this.slackAdapter = new SlackAlertAdapter();
    this.discordAdapter = new DiscordAlertAdapter(options);
    this.channelTalkAdapter = new ChannelTalkAlertAdapter(options);
    this.teamsAdapter = new TeamsAlertAdapter(options);
  }

  async send(message: AlertMessage): Promise<void> {
    const url = (message.webhookUrl || '').toLowerCase();
    if (url.includes('discord.com')) {
      await this.discordAdapter.send(message);
      return;
    }
    if (url.includes('channel.io')) {
      await this.channelTalkAdapter.send(message);
      return;
    }
    if (url.includes('office.com') || url.includes('office365.com') || url.includes('teams.microsoft.com') || url.includes('webhook.office.com')) {
      await this.teamsAdapter.send(message);
      return;
    }
    await this.slackAdapter.send(message);
  }
}
