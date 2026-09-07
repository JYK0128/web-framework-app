import { Injectable, Logger } from '@nestjs/common';

import { SystemContext } from '#/common/contexts/system.context';
import { type INotificationChannel, NotificationChannelType, type NotificationPayload, type NotificationSendResult } from '#/infra/notification/notification.interface';
import type { MessengerConfigDto, NotificationConfigDto } from '#/modules/system-config/dto';

import { AligoAlimtalkAdapter } from './adapters/aligo-alimtalk.adapter';
import { NhnAlimtalkAdapter } from './adapters/nhn-alimtalk.adapter';
import { SolapiAlimtalkAdapter } from './adapters/solapi-alimtalk.adapter';
import type { KakaoAdapterResult, KakaoMessage } from './kakao.interface';

@Injectable()
export class KakaoChannel implements INotificationChannel {
  readonly channelType = NotificationChannelType.KAKAO;
  private readonly logger = new Logger(KakaoChannel.name);

  constructor(
    private readonly systemContext: SystemContext,
    private readonly nhnAdapter: NhnAlimtalkAdapter,
    private readonly solapiAdapter: SolapiAlimtalkAdapter,
    private readonly aligoAdapter: AligoAlimtalkAdapter,
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

    const res = await this.sendAlimtalk({
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
   * 알림톡 직접 발송 편의 메소드 (임시 config 오버라이드 지원)
   */
  async sendAlimtalk(message: KakaoMessage, overrideConfig?: MessengerConfigDto['kakao']): Promise<KakaoAdapterResult> {
    const cfg = overrideConfig ?? (await this.systemContext.getConfig<NotificationConfigDto>('notification'))?.messenger?.kakao;
    const agency = cfg?.agency;

    const baseCommon = {
      plusFriendId: cfg?.plusFriendId,
      senderKey: cfg?.senderKey,
    };

    let res: KakaoAdapterResult;
    switch (agency) {
      case 'SOLAPI': {
        res = await this.solapiAdapter.send(message, { ...baseCommon, ...cfg?.solapi });
        break;
      }
      case 'ALIGO': {
        res = await this.aligoAdapter.send(message, { ...baseCommon, ...cfg?.aligo });
        break;
      }
      default: {
        res = await this.nhnAdapter.send(message, {
          ...baseCommon,
          appKey: cfg?.nhn?.appKey,
          secretKey: cfg?.nhn?.secretKey,
        });
        break;
      }
    }

    if (!res.success) {
      this.logger.warn(`Failed to send Kakao Alimtalk to ${message.recipientPhone}: ${res.error}`);
    }
    return res;
  }
}
