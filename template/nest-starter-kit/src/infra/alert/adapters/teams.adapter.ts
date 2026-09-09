import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { EXTERNAL_HTTP_TIMEOUT_MS } from '#/common/configs/integration.config';
import { ALERT_MODULE_OPTIONS, type AlertAdapterResult, type AlertMessage, type AlertModuleOptions, type AlertNotificationLevel, type IAlertAdapter } from '#/infra/alert/alert.interface';

const LEVEL_THEME_COLORS: Record<AlertNotificationLevel, string> = {
  info: '3B82F6',
  warn: 'F59E0B',
  error: 'EF4444',
};

@Injectable()
export class TeamsAlertAdapter implements IAlertAdapter {
  readonly providerName = 'teams';
  private readonly logger = new Logger(TeamsAlertAdapter.name);
  private readonly defaultWebhookUrl?: string;

  constructor(
    @Inject(ALERT_MODULE_OPTIONS)
    options: AlertModuleOptions,
  ) {
    this.defaultWebhookUrl = options.teams?.webhookUrl;
  }

  async send(message: AlertMessage): Promise<AlertAdapterResult> {
    const webhookUrl = message.webhookUrl || this.defaultWebhookUrl;
    if (!webhookUrl) {
      return {
        success: false,
        error: 'Microsoft Teams webhook URL is required',
      };
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

    try {
      this.logger.log('[Teams Alert] 웹훅 전송 요청');
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(EXTERNAL_HTTP_TIMEOUT_MS),
      });

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.warn(`Teams webhook responded with ${res.status}: ${errorText}`);
        return {
          success: false,
          error: `Teams HTTP ${res.status}: ${errorText}`,
        };
      }

      this.logger.log('[Teams Alert] 웹훅 전송 성공');
      return { success: true };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'TEAMS_WEBHOOK_FAILED').message;
      this.logger.error(`Teams webhook error: ${error}`);
      return { success: false, error };
    }
  }
}
