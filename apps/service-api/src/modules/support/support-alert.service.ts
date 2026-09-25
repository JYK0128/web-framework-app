import { Injectable, Logger } from '@nestjs/common';
import { TimeUtil } from '@pkg/shared/common';

import { SupportRuntimeConfigService } from './support-runtime-config.service';

type InquiryNotification = Awaited<ReturnType<SupportRuntimeConfigService['getConfig']>>['inquiry']['notification'];

@Injectable()
export class SupportAlertService {
  private readonly logger = new Logger(SupportAlertService.name);

  constructor(private readonly runtimeConfig: SupportRuntimeConfigService) {}

  async sendRoomCreatedAlert(roomId: string): Promise<boolean> {
    const { inquiry } = await this.runtimeConfig.getConfig();
    return this.send(inquiry.notification, {
      title: '새 고객지원 상담이 접수되었습니다.',
      details: [`상담 ID: ${roomId}`],
    });
  }

  async sendUnansweredAlert(roomId: string, elapsedMinutes: number): Promise<boolean> {
    const { inquiry } = await this.runtimeConfig.getConfig();
    return this.send(inquiry.notification, {
      title: '고객지원 상담에 답변이 필요합니다.',
      details: [`상담 ID: ${roomId}`, `미응답 시간: ${elapsedMinutes}분`],
    });
  }

  private async send(
    notification: InquiryNotification,
    message: { title: string, details: string[] },
  ): Promise<boolean> {
    const webhookUrl = notification.webhookUrl.trim();
    if (!notification.enabled || !webhookUrl) return false;

    const text = [message.title, ...message.details].join('\n');
    const payload = this.toPayload(notification.type, message.title, text);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TimeUtil.ms.second(5)),
      });
      if (!response.ok) {
        this.logger.warn(`Support webhook returned HTTP ${response.status}`);
        return false;
      }
      return true;
    }
    catch {
      this.logger.warn('Support webhook delivery failed.');
      return false;
    }
  }

  private toPayload(type: InquiryNotification['type'], title: string, text: string): Record<string, unknown> {
    switch (type) {
      case 'SLACK':
        return {
          blocks: [
            { type: 'header', text: { type: 'plain_text', text: title, emoji: true } },
            { type: 'section', text: { type: 'plain_text', text } },
          ],
        };
      case 'DISCORD':
        return { content: text };
      case 'CHANNEL_TALK':
        return { text };
      case 'TEAMS':
        return {
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          'summary': title,
          title,
          text,
        };
    }
  }
}
