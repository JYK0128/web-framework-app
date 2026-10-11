import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { WEBHOOK_HTTP_TIMEOUT_MS } from '#/core/webhook/webhook.config';
import { type IWebhookAdapter, WEBHOOK_MODULE_OPTIONS, type WebhookMessage, type WebhookModuleOptions, type WebhookNotificationLevel } from '#/core/webhook/webhook.interface';

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
  readonly providerName = 'channel-talk';
  private readonly logger = new Logger(ChannelTalkWebhookAdapter.name);
  private readonly defaultWebhookUrl?: string;

  constructor(
    @Inject(WEBHOOK_MODULE_OPTIONS)
    options: WebhookModuleOptions,
  ) {
    this.defaultWebhookUrl = options.channelTalk?.webhookUrl;
  }

  async send(message: WebhookMessage): Promise<void> {
    const webhookUrl = message.webhookUrl || this.defaultWebhookUrl;
    if (!webhookUrl) {
      throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', message: `Channel Talk: webhook URL is required`, status: HttpStatus.BAD_GATEWAY });
    }

    const payload = createPayload(message);

    this.logger.log('[Channel Talk Webhook] 웹훅 전송 요청');
    let res: Response;
    try {
      res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(WEBHOOK_HTTP_TIMEOUT_MS),
      });
    }
    catch (error) {
      this.logger.error('Channel Talk webhook request failed.', error instanceof Error ? error.stack : String(error));
      throw ApplicationError.from(error, { code: 'WEBHOOK_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    if (!res.ok) {
      this.logger.warn(`Channel Talk webhook responded with ${res.status}: ${await res.text()}`);
      throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    this.logger.log('[Channel Talk Webhook] 웹훅 전송 성공');
  }
}
