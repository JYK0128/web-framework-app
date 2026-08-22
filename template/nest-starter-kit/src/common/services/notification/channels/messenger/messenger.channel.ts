import { Inject, Injectable, Logger } from '@nestjs/common';

import { type INotificationChannel, NotificationChannelType, type NotificationPayload, type NotificationSendResult } from '#/common/services/notification/notification.interface';

import { type IMessengerProvider, MESSENGER_PROVIDER, type MessengerMessage } from './messenger.interface';

@Injectable()
export class MessengerChannel implements INotificationChannel {
  readonly channelType = NotificationChannelType.MESSENGER;
  private readonly logger = new Logger(MessengerChannel.name);

  constructor(
    @Inject(MESSENGER_PROVIDER)
    private readonly provider: IMessengerProvider,
  ) {}

  /**
   * INotificationChannel 통합 인터페이스 구현
   */
  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    const webhookUrl = payload.recipient.slackWebhookUrl || payload.recipient.webhookUrl;

    const res = await this.provider.send({
      title: payload.title || '알림',
      text: payload.message,
      webhookUrl,
      sections: payload.title
        ? [
          {
            label: '내용',
            value: payload.message,
          },
        ]
        : undefined,
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
    const res = await this.provider.send(options);
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
