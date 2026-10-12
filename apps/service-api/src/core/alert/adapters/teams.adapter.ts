import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import axios from 'axios';

import { ALERT_HTTP_TIMEOUT_MS } from '#/core/alert/alert.config';
import { ALERT_MODULE_OPTIONS, type AlertMessage, type AlertModuleOptions, type AlertNotificationLevel, type IAlertAdapter } from '#/core/alert/alert.interface';

const LEVEL_THEME_COLORS: Record<AlertNotificationLevel, string> = {
  info: '3B82F6',
  warn: 'F59E0B',
  error: 'EF4444',
};

@Injectable()
export class TeamsAlertAdapter implements IAlertAdapter {
  private readonly client = axios.create({ validateStatus: () => true });

  readonly providerName = 'teams';
  private readonly logger = new Logger(TeamsAlertAdapter.name);
  private readonly defaultWebhookUrl?: string;

  constructor(
    @Inject(ALERT_MODULE_OPTIONS)
    options: AlertModuleOptions,
  ) {
    this.defaultWebhookUrl = options.teams?.webhookUrl;
  }

  async send(message: AlertMessage): Promise<void> {
    const webhookUrl = message.webhookUrl || this.defaultWebhookUrl;
    if (!webhookUrl) throw new ApplicationError({ code: 'ALERT_SEND_FAILED', message: `Microsoft Teams: webhook URL is required`, status: HttpStatus.BAD_GATEWAY });

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

    this.logger.log('[Teams Alert] 웹훅 전송 요청');
    let res: { status: number, data: unknown };
    try {
      res = await this.client.post(webhookUrl, payload, { timeout: ALERT_HTTP_TIMEOUT_MS });
    }
    catch (err) {
      this.logger.error('Teams webhook request failed.', err instanceof Error ? err.stack : String(err));
      throw ApplicationError.from(err, { code: 'ALERT_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    if (res.status < 200 || res.status >= 300) {
      this.logger.warn(`Teams webhook responded with ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
      throw new ApplicationError({ code: 'ALERT_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    this.logger.log('[Teams Alert] 웹훅 전송 성공');
  }
}
