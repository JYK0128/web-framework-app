import { Injectable, Logger } from '@nestjs/common';

import { SystemContext } from '#/common/contexts/system.context';
import { type INotificationChannel, NotificationChannelType, type NotificationPayload, type NotificationSendResult } from '#/infra/notification/notification.interface';
import type { NotificationConfigDto, SmsConfigDto } from '#/modules/system-config/dto';

import { AligoSmsAdapter } from './adapters/aligo-sms.adapter';
import { NhnSmsAdapter } from './adapters/nhn-sms.adapter';
import { SolapiSmsAdapter } from './adapters/solapi-sms.adapter';
import type { SmsAdapterResult, SmsMessage } from './sms.interface';

@Injectable()
export class SmsChannel implements INotificationChannel {
  readonly channelType = NotificationChannelType.SMS;
  private readonly logger = new Logger(SmsChannel.name);

  constructor(
    private readonly systemContext: SystemContext,
    private readonly nhnAdapter: NhnSmsAdapter,
    private readonly solapiAdapter: SolapiSmsAdapter,
    private readonly aligoAdapter: AligoSmsAdapter,
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

    const res = await this.sendMessage({ to: phoneNumber, body: payload.message });

    return {
      channel: this.channelType,
      success: res.success,
      messageId: res.messageId,
      error: res.error,
    };
  }

  /**
   * SMS 직접 발송 편의 메소드 (임시 config 오버라이드 지원)
   */
  async sendMessage(message: SmsMessage, overrideConfig?: SmsConfigDto): Promise<SmsAdapterResult> {
    const cfg = overrideConfig ?? (await this.systemContext.getConfig<NotificationConfigDto>('notification'))?.sms;
    const provider = cfg?.provider;

    let res: SmsAdapterResult;
    switch (provider) {
      case 'SOLAPI_SMS': {
        res = await this.solapiAdapter.send(message, cfg?.solapi);
        break;
      }
      case 'ALIGO_SMS': {
        res = await this.aligoAdapter.send(message, cfg?.aligo);
        break;
      }
      default: {
        res = await this.nhnAdapter.send(message, cfg?.nhn);
        break;
      }
    }

    if (!res.success) {
      this.logger.warn(`[SMS] 발송 실패 to ${message.to}: ${res.error}`);
    }
    return res;
  }
}
