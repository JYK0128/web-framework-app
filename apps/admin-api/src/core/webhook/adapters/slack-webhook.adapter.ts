import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { WEBHOOK_HTTP_TIMEOUT_MS } from '#/core/webhook/webhook.config';
import { type IWebhookAdapter, type WebhookMessage, type WebhookNotificationLevel } from '#/core/webhook/webhook.interface';

const LEVEL_ICONS: Record<WebhookNotificationLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '🚨',
};

@Injectable()
export class SlackWebhookAdapter implements IWebhookAdapter {
  readonly providerName = 'slack';
  private readonly logger = new Logger(SlackWebhookAdapter.name);
  async send(message: WebhookMessage): Promise<void> {
    const webhookUrl = message.webhookUrl;
    if (!webhookUrl) {
      throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', message: `Slack: webhook URL is not configured`, status: HttpStatus.BAD_GATEWAY });
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

    this.logger.log('[Slack Webhook] 웹훅 전송 요청');
    let res: Response;
    try {
      res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
        signal: AbortSignal.timeout(WEBHOOK_HTTP_TIMEOUT_MS),
      });
    }
    catch (error) {
      this.logger.error('Slack webhook request failed.', error instanceof Error ? error.stack : String(error));
      throw ApplicationError.from(error, { code: 'WEBHOOK_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    if (!res.ok) {
      this.logger.warn(`Slack webhook responded with ${res.status}: ${await res.text()}`);
      throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    this.logger.log('[Slack Webhook] 웹훅 전송 성공');
  }
}
