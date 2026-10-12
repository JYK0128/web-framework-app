import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { postWebhook } from '#/core/webhook/webhook.http';
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
export class ChannelTalkAdapter implements IWebhookAdapter {
  readonly providerName = 'channel-talk';
  private readonly logger = new Logger(ChannelTalkAdapter.name);
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
      throw new ApplicationError({ code: 'WEBHOOK_SEND_FAILED', message: `Channel Talk: webhook URL is required`, status: HttpStatus.BAD_GATEWAY });
    }

    const payload = createPayload(message);

    this.logger.log('[Channel Talk Webhook] 웹훅 전송 요청');
    let res: { status: number, data: unknown };
    try {
      res = await postWebhook(webhookUrl, payload);
    }
    catch (error) {
      this.logger.error('Channel Talk webhook request failed.', error instanceof Error ? error.stack : String(error));
      throw ApplicationError.from(error, { code: 'WEBHOOK_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    if (res.status < 200 || res.status >= 300) {
      this.logger.warn(`Channel Talk webhook responded with ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
      throw new ApplicationError({ code: 'WEBHOOK_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    this.logger.log('[Channel Talk Webhook] 웹훅 전송 성공');
  }
}
