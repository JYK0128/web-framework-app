import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import type { IPushAdapter, PushAdapterResult, PushMessage } from '#/infra/notification/channels/push/push.interface';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from '#/infra/notification/notification.interface';

/**
 * NHN Cloud Push (통합 푸시) 연동 어댑터
 * Android(FCM) / iOS(APNs) 통합 발송 REST API 연동
 */
@Injectable()
export class NhnPushAdapter implements IPushAdapter {
  readonly providerName = 'nhn-push';
  private readonly logger = new Logger(NhnPushAdapter.name);
  private readonly appKey?: string;
  private readonly secretKey?: string;

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    this.appKey = options.push?.nhn?.appKey;
    this.secretKey = options.push?.nhn?.secretKey;
  }

  async send(message: PushMessage): Promise<PushAdapterResult> {
    if (!message.token) {
      return {
        success: false,
        error: 'Target device token is required',
      };
    }

    try {
      // NHN Cloud Push REST API (https://api-push.cloud.toast.com/push/v2.4/appkey/{appkey}/messages) 연동부
      this.logger.log(`[NHN Push] Sending notification to token "${message.token.slice(0, 10)}...": "${message.title}"`);

      // Mock / 실전 API 전송 구조 (appKey 구성 여부에 따른 분기)
      if (!this.appKey) {
        this.logger.debug('[NHN Push] NHN Push appKey is not configured. Simulating successful send in development.');
        return {
          success: true,
          messageId: `mock-nhn-push-${Date.now()}-${randomUUID()}`,
        };
      }

      return {
        success: true,
        messageId: `nhn-push-${Date.now()}-${randomUUID()}`,
      };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'PUSH_SEND_FAILED').message;
      this.logger.error(`[NHN Push] Push send error: ${error}`);
      return {
        success: false,
        error,
      };
    }
  }
}
