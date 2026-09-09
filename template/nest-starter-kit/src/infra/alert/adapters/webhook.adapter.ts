import { Inject, Injectable, Logger } from '@nestjs/common';

import { ALERT_MODULE_OPTIONS, type AlertAdapterResult, type AlertMessage, type AlertModuleOptions, type IAlertAdapter } from '#/infra/alert/alert.interface';

import { ChannelTalkAlertAdapter } from './channel-talk.adapter';
import { DiscordAlertAdapter } from './discord.adapter';
import { SlackAlertAdapter } from './slack.adapter';
import { TeamsAlertAdapter } from './teams.adapter';

@Injectable()
export class WebhookAlertAdapter implements IAlertAdapter {
  readonly providerName = 'webhook';
  private readonly logger = new Logger(WebhookAlertAdapter.name);
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

  async send(message: AlertMessage): Promise<AlertAdapterResult> {
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
