import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { WEBHOOK_HTTP_TIMEOUT_MS } from '@pkg/server-core/webhook/webhook.config';
import { type IWebhookAdapter, type WebhookMessage, type WebhookNotificationLevel } from '@pkg/server-core/webhook/webhook.interface';
import { ApplicationError } from '@pkg/shared/common';
import axios from 'axios';

const LEVEL_ICONS: Record<WebhookNotificationLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '🚨',
};

function buildSlackBlocks(message: WebhookMessage, icon: string): unknown[] {
  const blocks: unknown[] = [{ type: 'header', text: { type: 'plain_text', text: `${icon} ${message.title}`, emoji: true } }];
  if (message.text) blocks.push({ type: 'section', text: { type: 'mrkdwn', text: message.text } });
  for (const section of message.sections ?? []) {
    const quoted = section.value.replace(/\n/g, '\n>');
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*${section.label}*\n>${quoted}` } });
  }
  if (message.fields?.length) {
    blocks.push({ type: 'section', fields: message.fields.map((field) => ({ type: 'mrkdwn', text: `*${field.label}*\n>${field.value.replace(/\n/g, '\n>')}` })) });
  }
  if (message.action) blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `<${message.action.url}|${message.action.text}>` } });
  if (message.footer) blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: message.footer }] });
  return blocks;
}

@Injectable()
export class SlackWebhookAdapter implements IWebhookAdapter {
  private readonly client = axios.create({ validateStatus: () => true });

  readonly providerName = 'slack';
  private readonly logger = new Logger(SlackWebhookAdapter.name);
  async send(message: WebhookMessage): Promise<void> {
    const webhookUrl = message.webhookUrl;
    if (!webhookUrl) throw new ApplicationError({ code: 'WEBHOOK_SEND_FAILED', message: `Slack: webhook URL is not configured`, status: HttpStatus.BAD_GATEWAY });

    const level = message.level ?? 'info';
    const icon = LEVEL_ICONS[level];
    const blocks = buildSlackBlocks(message, icon);

    this.logger.log('[Slack Webhook] 웹훅 전송 요청');
    let res: { status: number, data: unknown };
    try {
      res = await this.client.post(webhookUrl, { blocks }, { timeout: WEBHOOK_HTTP_TIMEOUT_MS });
    }
    catch (err) {
      this.logger.error('Slack webhook request failed.', err instanceof Error ? err.stack : String(err));
      throw ApplicationError.from(err, { code: 'WEBHOOK_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    if (res.status < 200 || res.status >= 300) {
      this.logger.warn(`Slack webhook responded with ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
      throw new ApplicationError({ code: 'WEBHOOK_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    this.logger.log('[Slack Webhook] 웹훅 전송 성공');
  }
}
