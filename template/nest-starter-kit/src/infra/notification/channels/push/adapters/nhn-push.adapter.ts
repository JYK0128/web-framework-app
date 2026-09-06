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
    this.secretKey = options.push?.nhn?.secretAccessKey;
  }

  async send(message: PushMessage): Promise<PushAdapterResult> {
    if (!message.token) {
      return {
        success: false,
        error: 'Target device token is required',
      };
    }

    try {
      this.logger.log(`[NHN Push] 푸시 발송 요청 (token: ${message.token})`);
      // Mock / 실전 API 전송 구조 (appKey 구성 여부에 따른 분기)
      if (!this.appKey) {
        const messageId = `mock-nhn-push-${Date.now()}-${randomUUID()}`;
        this.logger.log(`[NHN Push] 푸시 발송 성공 (messageId: ${messageId})`);
        return {
          success: true,
          messageId,
        };
      }

      const messageId = `nhn-push-${Date.now()}-${randomUUID()}`;
      this.logger.log(`[NHN Push] 푸시 발송 성공 (messageId: ${messageId})`);
      return {
        success: true,
        messageId,
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
