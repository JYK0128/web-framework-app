import { Injectable } from '@nestjs/common';

import { MessageService } from '#/infra/notification';
import { SystemContext, type WebhookConfig } from '#/modules/system-configs/system.context';

@Injectable()
export class InquiryAlertService {
  constructor(
    private readonly systemContext: SystemContext,
    private readonly messages: MessageService,
  ) {}

  async sendRoomCreatedAlert(roomId: string): Promise<void> {
    const { webhook } = await this.systemContext.getConfig();
    return this.send(webhook, {
      title: '새 고객지원 상담이 접수되었습니다.',
      details: [`상담 ID: ${roomId}`],
    });
  }

  async sendUnansweredAlert(roomId: string, elapsedMinutes: number): Promise<void> {
    const { webhook } = await this.systemContext.getConfig();
    return this.send(webhook, {
      title: '고객지원 상담에 답변이 필요합니다.',
      details: [`상담 ID: ${roomId}`, `미응답 시간: ${elapsedMinutes}분`],
    });
  }

  async sendQnaCreatedAlert(qnaId: string, priority: string): Promise<void> {
    const { webhook } = await this.systemContext.getConfig();
    return this.send(webhook, {
      title: '새 Q&A 문의가 접수되었습니다.',
      details: [`문의 ID: ${qnaId}`, `우선순위: ${priority}`],
    });
  }

  private async send(
    webhook: WebhookConfig,
    message: { title: string, details: string[] },
  ): Promise<void> {
    const webhookUrl = webhook.webhookUrl.trim();
    if (!webhook.enabled || !webhookUrl) return;

    const text = [message.title, ...message.details].join('\n');
    await this.messages.send({ channel: 'webhook', message: { url: webhookUrl, type: webhook.type, title: message.title, text } });
  }
}
