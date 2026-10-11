import { Inject, Injectable } from '@nestjs/common';

import { ALERT_ADAPTER, type AlertMessage, type IAlertAdapter } from '#/core/alert/alert.interface';

@Injectable()
export class AlertService {
  constructor(
    @Inject(ALERT_ADAPTER)
    private readonly adapter: IAlertAdapter,
  ) {}

  /**
   * 구조화된 카드 형태의 운영 알림을 웹훅(Slack/Discord)으로 전송합니다.
   */
  async send(message: AlertMessage): Promise<void> {
    await this.adapter.send(message);
  }

  /**
   * 단순 텍스트 메시지를 웹훅으로 전송합니다.
   */
  async sendText(text: string, webhookUrl?: string): Promise<void> {
    await this.send({
      title: '운영 알림',
      text,
      webhookUrl,
    });
  }
}
