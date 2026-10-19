import { Injectable } from '@nestjs/common';

import { InternalClient } from '#/core/internal-client';

interface SendWebhookResponse {
  accepted: boolean
  sent: boolean
}

@Injectable()
export class InquiryWebhookService {
  constructor(private readonly internalClient: InternalClient) {}

  async sendRoomCreatedWebhook(roomId: string): Promise<void> {
    await this.send({
      title: '새 고객지원 상담이 접수되었습니다.',
      details: [`상담 ID: ${roomId}`],
    });
  }

  async sendUnansweredWebhook(roomId: string, elapsedMinutes: number): Promise<boolean> {
    return this.send({
      title: '고객지원 상담에 답변이 필요합니다.',
      details: [`상담 ID: ${roomId}`, `미응답 시간: ${elapsedMinutes}분`],
    }, `support-unanswered:${roomId}`);
  }

  async sendQnaCreatedWebhook(qnaId: string, priority: string): Promise<void> {
    await this.send({
      title: '새 Q&A 문의가 접수되었습니다.',
      details: [`문의 ID: ${qnaId}`, `우선순위: ${priority}`],
    });
  }

  private async send(
    message: { title: string, details: string[] },
    cooldownKey?: string,
  ): Promise<boolean> {
    const response = await this.internalClient.fetch<SendWebhookResponse>('/internal/webhooks/send', {
      method: 'POST',
      body: {
        title: message.title,
        text: [message.title, ...message.details].join('\n'),
        ...(cooldownKey ? { cooldownKey } : {}),
      },
    });
    return response.accepted;
  }
}
