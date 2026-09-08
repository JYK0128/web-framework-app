import { Inject, Injectable, Logger } from '@nestjs/common';

import type { MessengerConfigDto, SmsConfigDto } from '#/modules/system-config/dto';

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

  sendEmail(message: EmailMessage, overrideConfig?: import('#/modules/system-config/dto').NotificationConfigDto['email']): Promise<{ messageId: string | undefined }> {
    return this.getChannel(NotificationChannelType.EMAIL, EmailChannel).sendMail(message, overrideConfig);
  }

  sendKakao(message: KakaoMessage, overrideConfig?: MessengerConfigDto['kakao']) {
    return this.getChannel(NotificationChannelType.KAKAO, KakaoChannel).sendAlimtalk(message, overrideConfig);
  }

  async sendMessenger(recipient: string, message: string, config: MessengerConfigDto): Promise<{ success: boolean, messageId?: string, error?: string }> {
    if (!config.enabled) return { success: false, error: '메신저 발송이 비활성화되어 있습니다.' };
    let url: string;
    let body: Record<string, unknown>;
    let headers: Record<string, string> = { 'content-type': 'application/json' };

    switch (config.provider) {
      case 'LINE':
        if (!config.line?.accessToken) return { success: false, error: 'LINE Channel Access Token이 필요합니다.' };
        url = 'https://api.line.me/v2/bot/message/push';
        headers.authorization = `Bearer ${config.line.accessToken}`;
        body = { to: recipient, messages: [{ type: 'text', text: message }] };
        break;
      case 'WHATSAPP':
        if (!config.whatsapp?.phoneNumberId || !config.whatsapp.accessToken) return { success: false, error: 'WhatsApp Phone Number ID와 Access Token이 필요합니다.' };
        url = `https://graph.facebook.com/v20.0/${config.whatsapp.phoneNumberId}/messages`;
        headers.authorization = `Bearer ${config.whatsapp.accessToken}`;
        body = { messaging_product: 'whatsapp', to: recipient, type: 'text', text: { body: message } };
        break;
      case 'TELEGRAM':
        if (!config.telegram?.botToken) return { success: false, error: 'Telegram Bot Token이 필요합니다.' };
        url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
        body = { chat_id: recipient || config.telegram.chatId, text: message };
        break;
      case 'WECHAT': {
        if (!config.wechat?.appId || !config.wechat.appSecret) return { success: false, error: 'WeChat AppID와 AppSecret이 필요합니다.' };
        const tokenResponse = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(config.wechat.appId)}&secret=${encodeURIComponent(config.wechat.appSecret)}`);
        const token = await tokenResponse.json() as { access_token?: string, errmsg?: string };
        if (!token.access_token) return { success: false, error: token.errmsg || 'WeChat access token 발급에 실패했습니다.' };
        url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token.access_token}`;
        body = { touser: recipient, msgtype: 'text', text: { content: message } };
        break;
      }
      default:
        return { success: false, error: '지원하지 않는 메신저 provider입니다.' };
    }

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const result = await response.json() as Record<string, unknown>;
    const ok = response.ok && (result.ok === undefined || result.ok === true) && (!result.errcode || result.errcode === 0);
    return {
      success: ok,
      messageId: String(result.message_id ?? result.messageId ?? result.id ?? '' ) || undefined,
      error: ok ? undefined : String(result.description ?? result.message ?? result.errmsg ?? `HTTP ${response.status}`),
    };
  }

  sendSms(message: SmsMessage, overrideConfig?: SmsConfigDto) {
    return this.getChannel(NotificationChannelType.SMS, SmsChannel).sendMessage(message, overrideConfig);
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
