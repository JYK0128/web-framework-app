import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { postWebhook } from '#/core/webhook/webhook.http';
import { type IWebhookAdapter, WEBHOOK_MODULE_OPTIONS, type WebhookMessage, type WebhookModuleOptions, type WebhookNotificationLevel } from '#/core/webhook/webhook.interface';

const LEVEL_THEME_COLORS: Record<WebhookNotificationLevel, string> = {
  info: '3B82F6',
  warn: 'F59E0B',
  error: 'EF4444',
};

@Injectable()
export class TeamsAdapter implements IWebhookAdapter {
  readonly providerName = 'teams';
  private readonly logger = new Logger(TeamsAdapter.name);
  private readonly defaultWebhookUrl?: string;

  constructor(
    @Inject(WEBHOOK_MODULE_OPTIONS)
    options: WebhookModuleOptions,
  ) {
    this.defaultWebhookUrl = options.teams?.webhookUrl;
  }

  async send(message: WebhookMessage): Promise<void> {
    const webhookUrl = message.webhookUrl || this.defaultWebhookUrl;
    if (!webhookUrl) {
      throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', message: `Microsoft Teams: webhook URL is required`, status: HttpStatus.BAD_GATEWAY });
    }

    const level = message.level ?? 'info';
    const themeColor = LEVEL_THEME_COLORS[level];

    // Microsoft Teams MessageCard 포맷
    const facts: Array<{ name: string, value: string }> = [];

    if (message.sections) {
      for (const section of message.sections) {
        facts.push({ name: section.label, value: section.value });
      }
    }

    if (message.fields) {
      for (const field of message.fields) {
        facts.push({ name: field.label, value: field.value });
      }
    }

    const sections: unknown[] = [
      {
        activityTitle: message.title,
        activitySubtitle: message.footer,
        text: message.text,
        facts: facts.length > 0 ? facts : undefined,
        markdown: true,
      },
    ];

    const potentialAction = message.action
      ? [
        {
          '@type': 'OpenURI',
          'name': message.action.text,
          'targets': [{ os: 'default', uri: message.action.url }],
        },
      ]
      : undefined;

    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor,
      'summary': message.title,
      sections,
      potentialAction,
    };

    this.logger.log('[Teams Webhook] 웹훅 전송 요청');
    let res: { status: number, data: unknown };
    try {
      res = await postWebhook(webhookUrl, payload);
    }
    catch (error) {
      this.logger.error('Microsoft Teams webhook request failed.', error instanceof Error ? error.stack : String(error));
      throw ApplicationError.from(error, { code: 'WEBHOOK_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    if (res.status < 200 || res.status >= 300) {
      this.logger.warn(`Teams webhook responded with ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
      throw new ApplicationError({ code: 'WEBHOOK_DELIVERY_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    this.logger.log('[Teams Webhook] 웹훅 전송 성공');
  }
}
