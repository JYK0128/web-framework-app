import { Inject, Injectable, Logger } from '@nestjs/common';
import { valueIf } from '@pkg/shared/common';

import { type INotificationChannel, NotificationChannelType, type NotificationPayload, type NotificationSendResult } from '#/infra/notification/notification.interface';

import { type IMessengerAdapter, MESSENGER_ADAPTER, type MessengerMessage } from './messenger.interface';

@Injectable()
export class MessengerChannel implements INotificationChannel {
  readonly channelType = NotificationChannelType.MESSENGER;
  private readonly logger = new Logger(MessengerChannel.name);

  constructor(
    @Inject(MESSENGER_ADAPTER)
    private readonly adapter: IMessengerAdapter,
  ) {}

  /**
   * INotificationChannel 통합 인터페이스 구현
   */
  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    const webhookUrl = payload.recipient.slackWebhookUrl || payload.recipient.webhookUrl;

    const res = await this.adapter.send({
      title: payload.title || '알림',
      text: payload.message,
      webhookUrl,
      sections: valueIf(Boolean(payload.title), [
          {
            label: '내용',
            value: payload.message,
          },
        ]),
    });

    return {
      channel: this.channelType,
      success: res.success,
      messageId: res.messageId,
      error: res.error,
    };
  }

  /**
   * 정형화된 카드 형태의 메시지 전송
   */
  async sendNotification(options: MessengerMessage): Promise<boolean> {
    const res = await this.adapter.send(options);
    if (!res.success) {
      this.logger.warn(`Messenger notification failed: ${res.error}`);
      return false;
    }
    return true;
  }

  /**
   * 단순 텍스트 메시지 전송
   */
  async sendText(text: string, webhookUrl?: string): Promise<boolean> {
    return this.sendNotification({
      title: '알림',
      text,
      webhookUrl,
    });
  }
}
