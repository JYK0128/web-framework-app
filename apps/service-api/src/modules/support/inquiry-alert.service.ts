import { Injectable, Logger } from '@nestjs/common';

import { WebhookAdapter } from '#/infra/notification/channels/webhook/webhook.adapter';
import { SystemContext, type WebhookConfig } from '#/modules/system-configs/system.context';

@Injectable()
export class InquiryAlertService {
  private readonly logger = new Logger(InquiryAlertService.name);

  constructor(
    private readonly systemContext: SystemContext,
    private readonly webhookAdapter: WebhookAdapter,
  ) {}

  async sendRoomCreatedAlert(roomId: string): Promise<boolean> {
    const { webhook } = await this.systemContext.getConfig();
    return this.send(webhook, {
      title: '새 고객지원 상담이 접수되었습니다.',
      details: [`상담 ID: ${roomId}`],
    });
  }

  async sendUnansweredAlert(roomId: string, elapsedMinutes: number): Promise<boolean> {
    const { webhook } = await this.systemContext.getConfig();
    return this.send(webhook, {
      title: '고객지원 상담에 답변이 필요합니다.',
      details: [`상담 ID: ${roomId}`, `미응답 시간: ${elapsedMinutes}분`],
    });
  }

  async sendQnaCreatedAlert(qnaId: string, priority: string): Promise<boolean> {
    const { webhook } = await this.systemContext.getConfig();
    return this.send(webhook, {
      title: '새 Q&A 문의가 접수되었습니다.',
      details: [`문의 ID: ${qnaId}`, `우선순위: ${priority}`],
    });
  }

  private async send(
    webhook: WebhookConfig,
    message: { title: string, details: string[] },
  ): Promise<boolean> {
    const webhookUrl = webhook.webhookUrl.trim();
    if (!webhook.enabled || !webhookUrl) return false;

    const text = [message.title, ...message.details].join('\n');
    const payload = this.toPayload(webhook.type, message.title, text);
    const result = await this.webhookAdapter.send({ url: webhookUrl, type: webhook.type, payload });
    if (!result.success) this.logger.warn(`Webhook delivery failed: ${result.error ?? 'unknown error'}`);
    return result.success;
  }

  private toPayload(type: WebhookConfig['type'], title: string, text: string): Record<string, unknown> {
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
