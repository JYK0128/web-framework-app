import { Inject, Injectable, Logger } from '@nestjs/common';

import { type INotificationChannel, NotificationChannelType, type NotificationPayload, type NotificationSendResult } from '#/infra/notification/notification.interface';

import { EMAIL_ADAPTER, type EmailMessage, type IEmailAdapter } from './email.interface';

@Injectable()
export class EmailChannel implements INotificationChannel {
  readonly channelType = NotificationChannelType.EMAIL;
  private readonly logger = new Logger(EmailChannel.name);

  constructor(
    @Inject(EMAIL_ADAPTER)
    private readonly adapter: IEmailAdapter,
  ) {}

  /**
   * INotificationChannel 통합 인터페이스 구현
   */
  async send(payload: NotificationPayload): Promise<NotificationSendResult> {
    const to = payload.recipient.email;

    if (!to) {
      return {
        channel: this.channelType,
        success: false,
        error: 'Email address is missing in recipient',
      };
    }

    const subject = payload.title || '알림';
    const html = payload.html || `<p>${payload.message.replace(/\n/g, '<br/>')}</p>`;

    const res = await this.adapter.send({
      to,
      subject,
      html,
      text: payload.message,
    });

    return {
      channel: this.channelType,
      success: res.success,
      messageId: res.messageId,
      error: res.error,
    };
  }

  /**
   * 이메일 직접 발송 편의 메소드
   */
  async sendMail(message: EmailMessage) {
    const res = await this.adapter.send(message);
    if (!res.success) {
      throw new Error(res.error || 'Failed to send email');
    }
    return { messageId: res.messageId };
  }
}
