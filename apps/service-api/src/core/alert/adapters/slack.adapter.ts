import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { ALERT_HTTP_TIMEOUT_MS } from '#/core/alert/alert.config';
import { type AlertMessage, type AlertNotificationLevel, type IAlertAdapter } from '#/core/alert/alert.interface';

const LEVEL_ICONS: Record<AlertNotificationLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '🚨',
};

@Injectable()
export class SlackAlertAdapter implements IAlertAdapter {
  readonly providerName = 'slack';
  private readonly logger = new Logger(SlackAlertAdapter.name);
  async send(message: AlertMessage): Promise<void> {
    const webhookUrl = message.webhookUrl;
    if (!webhookUrl) throw new ApplicationError({ code: 'ALERT_DELIVERY_FAILED', message: `Slack: webhook URL is not configured`, status: HttpStatus.BAD_GATEWAY });

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

    this.logger.log('[Slack Alert] 웹훅 전송 요청');
    let res: Response;
    try {
      res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
        signal: AbortSignal.timeout(ALERT_HTTP_TIMEOUT_MS),
      });
    }
    catch (err) {
      this.logger.error('Slack webhook request failed.', err instanceof Error ? err.stack : String(err));
      throw ApplicationError.from(err, { code: 'ALERT_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    if (!res.ok) {
      this.logger.warn(`Slack webhook responded with ${res.status}: ${await res.text()}`);
      throw new ApplicationError({ code: 'ALERT_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    this.logger.log('[Slack Alert] 웹훅 전송 성공');
  }
}
