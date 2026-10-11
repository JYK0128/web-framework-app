import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import axios from 'axios';

import { WEBHOOK_HTTP_TIMEOUT_MS } from '#/core/webhook/webhook.config';
import { type IWebhookAdapter, WEBHOOK_MODULE_OPTIONS, type WebhookMessage, type WebhookModuleOptions, type WebhookNotificationLevel } from '#/core/webhook/webhook.interface';

const LEVEL_COLORS: Record<WebhookNotificationLevel, number> = {
  info: 0x3b82f6, // Blue
  warn: 0xf59e0b, // Amber
  error: 0xef4444, // Red
};

@Injectable()
export class DiscordAdapter implements IWebhookAdapter {
  private readonly client = axios.create({ validateStatus: () => true });

  readonly providerName = 'discord';
  private readonly logger = new Logger(DiscordAdapter.name);
  private readonly defaultWebhookUrl?: string;

  constructor(
    @Inject(WEBHOOK_MODULE_OPTIONS)
    options: WebhookModuleOptions,
  ) {
    this.defaultWebhookUrl = options.discord?.webhookUrl;
  }

  async send(message: WebhookMessage): Promise<void> {
    const webhookUrl = message.webhookUrl || this.defaultWebhookUrl;
    if (!webhookUrl) {
      throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', message: `Discord: webhook URL is required`, status: HttpStatus.BAD_GATEWAY });
    }

    const level = message.level ?? 'info';
    const color = LEVEL_COLORS[level];

    const fields: Array<{ name: string, value: string, inline?: boolean }> = [];

    if (message.sections) {
      for (const section of message.sections) {
        fields.push({ name: section.label, value: section.value, inline: false });
      }
    }

    if (message.fields) {
      for (const f of message.fields) {
        fields.push({ name: f.label, value: f.value, inline: true });
      }
    }

    const embed: Record<string, unknown> = {
      title: message.title,
      description: message.text,
      color,
      fields,
    };

    if (message.action) {
      embed.url = message.action.url;
    }

    if (message.footer) {
      embed.footer = { text: message.footer };
    }

    this.logger.log('[Discord Webhook] 웹훅 전송 요청');
    let res: { status: number, data: unknown };
    try {
      res = await this.client.post(webhookUrl, { embeds: [embed] }, { timeout: WEBHOOK_HTTP_TIMEOUT_MS });
    }
    catch (error) {
      this.logger.error('Discord webhook request failed.', error instanceof Error ? error.stack : String(error));
      throw ApplicationError.from(error, { code: 'WEBHOOK_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    if (res.status < 200 || res.status >= 300) {
      this.logger.warn(`Discord webhook responded with ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
      throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    this.logger.log('[Discord Webhook] 웹훅 전송 성공');
  }
}
