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

function createPayload(message: WebhookMessage): { text: string } {
  const lines = [`*${LEVEL_ICONS[message.level ?? 'info']} ${message.title}*`];
  if (message.text) lines.push(message.text);
  for (const section of message.sections ?? []) lines.push(`• *${section.label}*: ${section.value}`);
  for (const field of message.fields ?? []) lines.push(`• *${field.label}*: ${field.value}`);
  if (message.action) lines.push(`👉 <${message.action.url}|${message.action.text}>`);
  if (message.footer) lines.push(`_${message.footer}_`);
  return { text: lines.join('\n') };
}

@Injectable()
export class ChannelTalkWebhookAdapter implements IWebhookAdapter {
  private readonly client = axios.create({ validateStatus: () => true });

  readonly providerName = 'channel-talk';
  private readonly logger = new Logger(ChannelTalkWebhookAdapter.name);
  async send(message: WebhookMessage): Promise<void> {
    const webhookUrl = message.webhookUrl;

    const payload = createPayload(message);

    this.logger.log('[Channel Talk Webhook] 웹훅 전송 요청');
    let res: { status: number, data: unknown };
    try {
      res = await this.client.post(webhookUrl, payload, { timeout: WEBHOOK_HTTP_TIMEOUT_MS });
    }
    catch (err) {
      this.logger.error('Channel Talk webhook request failed.', err instanceof Error ? err.stack : String(err));
      throw ApplicationError.from(err, { code: 'WEBHOOK_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    if (res.status < 200 || res.status >= 300) {
      this.logger.warn(`Channel Talk webhook responded with ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
      throw new ApplicationError({ code: 'WEBHOOK_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    this.logger.log('[Channel Talk Webhook] 웹훅 전송 성공');
  }
}
