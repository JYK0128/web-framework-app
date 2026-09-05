import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { ALERT_MODULE_OPTIONS, type AlertAdapterResult, type AlertMessage, type AlertModuleOptions, type AlertNotificationLevel, type IAlertAdapter } from '#/infra/alert/alert.interface';

const LEVEL_ICONS: Record<AlertNotificationLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '🚨',
};

@Injectable()
export class ChannelTalkAlertAdapter implements IAlertAdapter {
  readonly providerName = 'channel-talk';
  private readonly logger = new Logger(ChannelTalkAlertAdapter.name);
  private readonly defaultWebhookUrl?: string;

  constructor(
    @Inject(ALERT_MODULE_OPTIONS)
    options: AlertModuleOptions,
  ) {
    this.defaultWebhookUrl = options.channelTalk?.webhookUrl;
  }

  async send(message: AlertMessage): Promise<AlertAdapterResult> {
    const webhookUrl = message.webhookUrl || this.defaultWebhookUrl;
    if (!webhookUrl) {
      return {
        success: false,
        error: 'Channel Talk webhook URL is required',
      };
    }

    const level = message.level ?? 'info';
    const icon = LEVEL_ICONS[level];

    // 채널톡(Channel.io) 인커밍 웹훅 메시지 포맷
    const lines: string[] = [];
    lines.push(`*${icon} ${message.title}*`);
    if (message.text) {
      lines.push(message.text);
    }

    if (message.sections && message.sections.length > 0) {
      for (const s of message.sections) {
        lines.push(`• *${s.label}*: ${s.value}`);
      }
    }

    if (message.fields && message.fields.length > 0) {
      for (const f of message.fields) {
        lines.push(`• *${f.label}*: ${f.value}`);
      }
    }

    if (message.action) {
      lines.push(`👉 <${message.action.url}|${message.action.text}>`);
    }

    if (message.footer) {
      lines.push(`_${message.footer}_`);
    }

    const payload = {
      text: lines.join('\n'),
    };

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.warn(`Channel Talk webhook responded with ${res.status}: ${errorText}`);
        return {
          success: false,
          error: `Channel Talk HTTP ${res.status}: ${errorText}`,
        };
      }

      return { success: true };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'CHANNEL_TALK_WEBHOOK_FAILED').message;
      this.logger.error(`Channel Talk webhook error: ${error}`);
      return { success: false, error };
    }
  }
}
