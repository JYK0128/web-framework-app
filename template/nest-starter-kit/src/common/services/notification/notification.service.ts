import { Inject, Injectable, Logger } from '@nestjs/common';

import { type INotificationChannel, type MarketingAgreement, NOTIFICATION_CHANNELS, NotificationChannelType, type NotificationPayload, type NotificationSendResult } from './notification.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly channelMap = new Map<NotificationChannelType, INotificationChannel>();

  constructor(
    @Inject(NOTIFICATION_CHANNELS)
    private readonly channels: INotificationChannel[],
  ) {
    for (const channel of channels) {
      this.channelMap.set(channel.channelType, channel);
    }
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
  ): Promise<Record<NotificationChannelType, NotificationSendResult>> {
    const results: Partial<Record<NotificationChannelType, NotificationSendResult>> = {};

    const promises = channelTypes.map(async (channelType) => {
      const res = await this.send(channelType, payload);
      results[channelType] = res;
    });

    await Promise.allSettled(promises);
    return results as Record<NotificationChannelType, NotificationSendResult>;
  }

  /**
   * 마케팅 수신동의 설정에 따라 동의된 채널들로만 선별 발송합니다.
   *
   * 예: SMS 동의 시 SMS 발송, 카카오톡 동의 시 알림톡 발송, 이메일 동의 시 이메일 발송
   */
  async sendMarketing(
    agreement: MarketingAgreement,
    payload: NotificationPayload,
  ): Promise<Record<NotificationChannelType, NotificationSendResult>> {
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
      return {} as Record<NotificationChannelType, NotificationSendResult>;
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
      return {
        channel: NotificationChannelType.SMS,
        success: false,
        error: 'No channels specified for fallback pipeline',
      };
    }

    let lastResult: NotificationSendResult | undefined;

    for (const channelType of channelPriorities) {
      const result = await this.send(channelType, payload);
      if (result.success) {
        return result;
      }

      this.logger.warn(
        `Channel ${channelType} failed: ${result.error ?? 'unknown'}. Attempting fallback to next channel.`,
      );
      lastResult = result;
    }

    return lastResult!;
  }
}
