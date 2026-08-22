import { Inject, Injectable, Logger } from '@nestjs/common';

import { type INotificationChannel, NotificationChannelType, type NotificationPayload, type NotificationSendResult } from '#/common/services/notification/notification.interface';

import { type ISmsProvider, SMS_PROVIDER, type SmsMessage } from './sms.interface';

@Injectable()
export class SmsChannel implements INotificationChannel {
  readonly channelType = NotificationChannelType.SMS;
  private readonly logger = new Logger(SmsChannel.name);

  constructor(
    @Inject(SMS_PROVIDER)
    private readonly provider: ISmsProvider,
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
      to: phoneNumber,
      body: payload.message,
    });

    return {
      channel: this.channelType,
      success: res.success,
      messageId: res.messageId,
      error: res.error,
    };
  }

  /**
   * SMS 직접 발송 편의 메소드
   */
  async sendMessage(message: SmsMessage) {
    const res = await this.provider.send(message);
    if (!res.success) {
      this.logger.warn(`Failed to send SMS to ${message.to}: ${res.error}`);
      return false;
    }
    return true;
  }
}
