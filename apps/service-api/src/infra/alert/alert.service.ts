import { Inject, Injectable, Logger } from '@nestjs/common';

import { ALERT_ADAPTER, type AlertMessage, type AlertSendResult, type IAlertAdapter } from './alert.interface';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @Inject(ALERT_ADAPTER)
    private readonly adapter: IAlertAdapter,
  ) {}

  /**
   * 구조화된 카드 형태의 운영 알림을 웹훅(Slack/Discord)으로 전송합니다.
   */
  async send(message: AlertMessage): Promise<AlertSendResult> {
    const result = await this.adapter.send(message);
    if (!result.success) {
      this.logger.warn(`Alert delivery failed: ${result.error}`);
    }
    return result;
  }

  /**
   * 단순 텍스트 메시지를 웹훅으로 전송합니다.
   */
  async sendText(text: string, webhookUrl?: string): Promise<AlertSendResult> {
    return this.send({
      title: '운영 알림',
      text,
      webhookUrl,
    });
  }
}
