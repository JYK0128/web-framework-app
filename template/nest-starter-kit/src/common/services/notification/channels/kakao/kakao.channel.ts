import { Inject, Injectable, Logger } from '@nestjs/common';

import { type INotificationChannel, NotificationChannelType, type NotificationPayload, type NotificationSendResult } from '#/common/services/notification/notification.interface';

import { type IKakaoProvider, KAKAO_PROVIDER, type KakaoMessage } from './kakao.interface';

@Injectable()
export class KakaoChannel implements INotificationChannel {
  readonly channelType = NotificationChannelType.KAKAO;
  private readonly logger = new Logger(KakaoChannel.name);

  constructor(
    @Inject(KAKAO_PROVIDER)
    private readonly provider: IKakaoProvider,
  ) {}

  /**
   * INotificationChannel 통합 인터페이스 구현
   */
  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    const phoneNumber = payload.recipient.phone;

    if (!phoneNumber) {
      return {
        channel: this.channelType,
        success: false,
        error: 'Phone number is missing in recipient',
      };
    }

    const res = await this.provider.send({
      recipientPhone: phoneNumber,
      templateCode: payload.templateId,
      templateArgs: payload.templateArgs,
      title: payload.title,
      message: payload.message,
    });

    return {
      channel: this.channelType,
      success: res.success,
      messageId: res.messageId,
      error: res.error,
    };
  }

  /**
   * 알림톡 직접 발송 편의 메소드
   */
  async sendAlimtalk(message: KakaoMessage) {
    const res = await this.provider.send(message);
    if (!res.success) {
      this.logger.warn(`Failed to send Kakao Alimtalk to ${message.recipientPhone}: ${res.error}`);
      return false;
    }
    return true;
  }
}
