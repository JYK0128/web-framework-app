import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { ALERT_MODULE_OPTIONS, type AlertAdapterResult, type AlertMessage, type AlertModuleOptions, type AlertNotificationLevel, type IAlertAdapter } from '#/infra/alert/alert.interface';

const LEVEL_COLORS: Record<AlertNotificationLevel, number> = {
  info: 0x3b82f6, // Blue
  warn: 0xf59e0b, // Amber
  error: 0xef4444, // Red
};

@Injectable()
export class DiscordAlertAdapter implements IAlertAdapter {
  readonly providerName = 'discord';
  private readonly logger = new Logger(DiscordAlertAdapter.name);
  private readonly defaultWebhookUrl?: string;

  constructor(
    @Inject(ALERT_MODULE_OPTIONS)
    options: AlertModuleOptions,
  ) {
    this.defaultWebhookUrl = options.discord?.webhookUrl;
  }

  async send(message: AlertMessage): Promise<AlertAdapterResult> {
    const webhookUrl = message.webhookUrl || this.defaultWebhookUrl;
    if (!webhookUrl) {
      return {
        success: false,
        error: 'Discord webhook URL is required',
      };
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

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.warn(`Discord webhook responded with ${res.status}: ${errorText}`);
        return {
          success: false,
          error: `Discord HTTP ${res.status}: ${errorText}`,
        };
      }

      return { success: true };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'DISCORD_WEBHOOK_FAILED').message;
      this.logger.error(`Discord webhook error: ${error}`);
      return { success: false, error };
    }
  }
}
