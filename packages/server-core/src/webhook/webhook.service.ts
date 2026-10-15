import { Inject, Injectable } from '@nestjs/common';

import { type IWebhookAdapter, WEBHOOK_ADAPTER, type WebhookMessage } from '#webhook/webhook.interface';

@Injectable()
export class WebhookService {
  constructor(
    @Inject(WEBHOOK_ADAPTER)
    private readonly adapter: IWebhookAdapter,
  ) {}

  /**
   * 구조화된 카드 형태의 운영 알림을 웹훅(Slack/Discord)으로 전송합니다.
   */
  async send(message: WebhookMessage): Promise<void> {
    await this.adapter.send(message);
  }

  /**
   * 단순 텍스트 메시지를 웹훅으로 전송합니다.
   */
  async sendText(text: string, type: WebhookMessage['type'], webhookUrl: string): Promise<void> {
    await this.send({
      type,
      title: '운영 알림',
      text,
      webhookUrl,
    });
  }
}
