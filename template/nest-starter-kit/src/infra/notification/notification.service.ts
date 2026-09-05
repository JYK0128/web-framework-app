import { Inject, Injectable, Logger } from '@nestjs/common';

import { EmailChannel } from './channels/email/email.channel';
import type { EmailMessage } from './channels/email/email.interface';
import { KakaoChannel } from './channels/kakao/kakao.channel';
import type { KakaoMessage } from './channels/kakao/kakao.interface';
import { PushChannel } from './channels/push/push.channel';
import type { PushMessage } from './channels/push/push.interface';
import { SmsChannel } from './channels/sms/sms.channel';
import type { SmsMessage } from './channels/sms/sms.interface';
import { type INotificationChannel, type MarketingAgreement, NOTIFICATION_CHANNELS, NotificationChannelType, type NotificationPayload, type NotificationSendResult } from './notification.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly channelMap = new Map<NotificationChannelType, INotificationChannel>();

  constructor(
    @Inject(NOTIFICATION_CHANNELS)
    channels: INotificationChannel[],
  ) {
    for (const channel of channels) {
      this.channelMap.set(channel.channelType, channel);
    }
  }

  sendEmail(message: EmailMessage): Promise<{ messageId: string | undefined }> {
    return this.getChannel(NotificationChannelType.EMAIL, EmailChannel).sendMail(message);
  }

  sendKakao(message: KakaoMessage): Promise<boolean> {
    return this.getChannel(NotificationChannelType.KAKAO, KakaoChannel).sendAlimtalk(message);
  }

  sendSms(message: SmsMessage): Promise<boolean> {
    return this.getChannel(NotificationChannelType.SMS, SmsChannel).sendMessage(message);
  }

  sendPush(message: PushMessage): Promise<boolean> {
    return this.getChannel(NotificationChannelType.PUSH, PushChannel).sendPush(message);
  }

  /**
   * 단일 채널로 알림을 전송합니다.
   */
  async send(
    channelType: NotificationChannelType,
    payload: NotificationPayload,
  ): Promise<NotificationSendResult> {
    const channel = this.channelMap.get(channelType);
    if (!channel) {
      this.logger.warn(`Notification channel '${channelType}' is not registered`);
      return {
        channel: channelType,
        success: false,
        error: `Channel ${channelType} is not supported or registered`,
      };
    }

    return channel.send(payload);
  }

  /**
   * 지정된 복수 채널로 병렬 발송합니다.
   */
  async sendToChannels(
    channelTypes: NotificationChannelType[],
    payload: NotificationPayload,
  ): Promise<Partial<Record<NotificationChannelType, NotificationSendResult>>> {
    const results: Partial<Record<NotificationChannelType, NotificationSendResult>> = {};

    const settled = await Promise.allSettled(
      channelTypes.map(async (channelType) => {
        const res = await this.send(channelType, payload);
        results[channelType] = res;
      }),
    );

    for (const result of settled) {
      if (result.status === 'rejected') {
        this.logger.error(`Notification channel send failed unexpectedly: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
      }
    }

    return results;
  }

  /**
   * 마케팅 수신동의 설정에 따라 동의된 채널들로만 선별 발송합니다.
   *
   * 예: SMS 동의 시 SMS 발송, 카카오톡 동의 시 알림톡 발송, 이메일 동의 시 이메일 발송
   */
  async sendMarketing(
    agreement: MarketingAgreement,
    payload: NotificationPayload,
  ): Promise<Partial<Record<NotificationChannelType, NotificationSendResult>>> {
    const targetChannels: NotificationChannelType[] = [];

    if (agreement.kakaoAgreed) {
      targetChannels.push(NotificationChannelType.KAKAO);
    }
    if (agreement.smsAgreed) {
      targetChannels.push(NotificationChannelType.SMS);
    }
    if (agreement.emailAgreed) {
      targetChannels.push(NotificationChannelType.EMAIL);
    }
    if (agreement.pushAgreed) {
      targetChannels.push(NotificationChannelType.PUSH);
    }

    if (targetChannels.length === 0) {
      this.logger.debug('No agreed marketing channels found for user. Skipping.');
      return {};
    }

    return this.sendToChannels(targetChannels, payload);
  }

  /**
   * 우선순위 채널(Fallback) 순차 발송을 수행합니다.
   *
   * 예: [NotificationChannelType.KAKAO, NotificationChannelType.SMS]를 전달하면
   * 카카오 알림톡 발송 시도 후 실패 시 SMS로 자동 대체 발송합니다.
   */
  async sendWithFallback(
    channelPriorities: NotificationChannelType[],
    payload: NotificationPayload,
  ): Promise<NotificationSendResult> {
    if (channelPriorities.length === 0) {
      throw new Error('No channels specified for fallback pipeline');
    }

    let lastResult: NotificationSendResult | undefined;

    for (const channelType of channelPriorities) {
      const result = await this.send(channelType, payload);
      if (result.success) {
        return result;
      }

      this.logger.warn(`Channel ${channelType} failed: ${String(result.error)}. Attempting fallback to next channel.`);
      lastResult = result;
    }

    return (
      lastResult ?? {
        channel: channelPriorities[0],
        success: false,
        error: 'All fallback channels failed',
      }
    );
  }

  private getChannel<T extends INotificationChannel>(
    type: NotificationChannelType,
    ChannelClass: new (...args: never[]) => T,
  ): T {
    const channel = this.channelMap.get(type);
    if (!(channel instanceof ChannelClass)) {
      throw new Error(`Notification channel '${type}' is not registered or has an unexpected type`);
    }
    return channel;
  }
}
