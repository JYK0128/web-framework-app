import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import axios from 'axios';

import { ALERT_HTTP_TIMEOUT_MS } from '#/core/alert/alert.config';
import { ALERT_MODULE_OPTIONS, type AlertMessage, type AlertModuleOptions, type AlertNotificationLevel, type IAlertAdapter } from '#/core/alert/alert.interface';

const LEVEL_ICONS: Record<AlertNotificationLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '🚨',
};

function createPayload(message: AlertMessage): { text: string } {
  const lines = [`*${LEVEL_ICONS[message.level ?? 'info']} ${message.title}*`];
  if (message.text) lines.push(message.text);
  for (const section of message.sections ?? []) lines.push(`• *${section.label}*: ${section.value}`);
  for (const field of message.fields ?? []) lines.push(`• *${field.label}*: ${field.value}`);
  if (message.action) lines.push(`👉 <${message.action.url}|${message.action.text}>`);
  if (message.footer) lines.push(`_${message.footer}_`);
  return { text: lines.join('\n') };
}

@Injectable()
export class ChannelTalkAlertAdapter implements IAlertAdapter {
  private readonly client = axios.create({ validateStatus: () => true });

  readonly providerName = 'channel-talk';
  private readonly logger = new Logger(ChannelTalkAlertAdapter.name);
  private readonly defaultWebhookUrl?: string;

  constructor(
    @Inject(ALERT_MODULE_OPTIONS)
    options: AlertModuleOptions,
  ) {
    this.defaultWebhookUrl = options.channelTalk?.webhookUrl;
  }

  async send(message: AlertMessage): Promise<void> {
    const webhookUrl = message.webhookUrl || this.defaultWebhookUrl;
    if (!webhookUrl) throw new ApplicationError({ code: 'ALERT_SEND_FAILED', message: `Channel Talk: webhook URL is required`, status: HttpStatus.BAD_GATEWAY });

    const payload = createPayload(message);

    this.logger.log('[Channel Talk Alert] 웹훅 전송 요청');
    let res: { status: number, data: unknown };
    try {
      res = await this.client.post(webhookUrl, payload, { timeout: ALERT_HTTP_TIMEOUT_MS });
    }
    catch (err) {
      this.logger.error('Channel Talk webhook request failed.', err instanceof Error ? err.stack : String(err));
      throw ApplicationError.from(err, { code: 'ALERT_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    if (res.status < 200 || res.status >= 300) {
      this.logger.warn(`Channel Talk webhook responded with ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
      throw new ApplicationError({ code: 'ALERT_SEND_FAILED', status: HttpStatus.BAD_GATEWAY });
    }

    this.logger.log('[Channel Talk Alert] 웹훅 전송 성공');
  }
}
