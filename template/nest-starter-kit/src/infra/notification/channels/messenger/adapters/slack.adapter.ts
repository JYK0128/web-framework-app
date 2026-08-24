import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import type { IMessengerAdapter, MessengerAdapterResult, MessengerMessage, MessengerNotificationLevel } from '#/infra/notification/channels/messenger/messenger.interface';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from '#/infra/notification/notification.interface';

const LEVEL_ICONS: Record<MessengerNotificationLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '🚨',
};

@Injectable()
export class SlackMessengerAdapter implements IMessengerAdapter {
  readonly providerName = 'slack';
  private readonly logger = new Logger(SlackMessengerAdapter.name);
  private readonly defaultWebhookUrl?: string;

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    this.defaultWebhookUrl = options.messenger?.slack?.webhookUrl;
  }

  async send(message: MessengerMessage): Promise<MessengerAdapterResult> {
    const webhookUrl = message.webhookUrl ? message.webhookUrl : this.defaultWebhookUrl;
    if (!webhookUrl) {
      this.logger.debug('Slack webhook URL is not configured. Skipping message.');
      return {
        success: false,
        error: 'Slack webhook URL is not configured',
      };
    }

    const level = message.level ?? 'info';
    const icon = LEVEL_ICONS[level];
    const blocks: unknown[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${icon} ${message.title}`,
          emoji: true,
        },
      },
    ];

    if (message.text) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message.text,
        },
      });
    }

    if (message.sections && message.sections.length > 0) {
      for (const section of message.sections) {
        const quoted = section.value.replace(/\n/g, '\n>');
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${section.label}*\n>${quoted}`,
          },
        });
      }
    }

    if (message.fields && message.fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: message.fields.map((f) => ({
          type: 'mrkdwn',
          text: `*${f.label}*\n>${f.value.replace(/\n/g, '\n>')}`,
        })),
      });
    }

    if (message.action) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<${message.action.url}|${message.action.text}>`,
        },
      });
    }

    if (message.footer) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: message.footer,
          },
        ],
      });
    }

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.warn(`Slack webhook responded with ${res.status}: ${errorText}`);
        return {
          success: false,
          error: `Slack HTTP ${res.status}: ${errorText}`,
        };
      }

      return {
        success: true,
      };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'SLACK_WEBHOOK_FAILED').message;
      this.logger.error(`Slack webhook error: ${error}`);
      return {
        success: false,
        error,
      };
    }
  }
}
