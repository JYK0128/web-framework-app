import { Inject, Injectable, Logger } from '@nestjs/common';

import { type INotificationChannel, NotificationChannelType, type NotificationPayload, type NotificationSendResult } from '#/infra/notification/notification.interface';

import { type IPushAdapter, PUSH_ADAPTER, type PushMessage } from './push.interface';

@Injectable()
export class PushChannel implements INotificationChannel {
  readonly channelType = NotificationChannelType.PUSH;
  private readonly logger = new Logger(PushChannel.name);

  constructor(
    @Inject(PUSH_ADAPTER)
    private readonly adapter: IPushAdapter,
  ) {}

  /**
   * INotificationChannel 통합 인터페이스 구현
   */
  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    const token = payload.recipient.pushToken;

    if (!token) {
      return {
        channel: this.channelType,
        success: false,
        error: 'Push device token is missing in recipient',
      };
    }

    const res = await this.adapter.send({
      token,
      title: payload.title || '알림',
      body: payload.message,
      data: payload.metadata
        ? Object.fromEntries(
          Object.entries(payload.metadata).map(([k, v]) => [k, String(v)]),
        )
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
   * 푸시 알림 직접 발송 편의 메소드
   */
  async sendPush(message: PushMessage): Promise<boolean> {
    const res = await this.adapter.send(message);
    if (!res.success) {
      this.logger.warn(`Failed to send push to token ${message.token}: ${res.error}`);
      return false;
    }
    return true;
  }
}
