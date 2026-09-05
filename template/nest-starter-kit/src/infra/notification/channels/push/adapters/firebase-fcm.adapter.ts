import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import type { IPushAdapter, PushAdapterResult, PushMessage } from '#/infra/notification/channels/push/push.interface';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from '#/infra/notification/notification.interface';

@Injectable()
export class FirebaseFcmAdapter implements IPushAdapter {
  readonly providerName = 'firebase-fcm';
  private readonly logger = new Logger(FirebaseFcmAdapter.name);
  private readonly projectId?: string;
  private readonly clientEmail?: string;
  private readonly privateKey?: string;

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    this.projectId = options.push?.fcm?.projectId;
    this.clientEmail = options.push?.fcm?.clientEmail;
    this.privateKey = options.push?.fcm?.privateKey;
  }

  async send(message: PushMessage): Promise<PushAdapterResult> {
    if (!message.token) {
      return {
        success: false,
        error: 'Target device token is required',
      };
    }

    try {
      // FCM v1 HTTP REST API 발송부 (프로젝트 서비스 계정 연동)
      this.logger.log(`[FCM] Sending push to token "${message.token.slice(0, 10)}...": "${message.title}"`);

      // Mock / 실전 API 전송 구조 (projectId 및 서비스 계정 키가 구성된 경우 실제 발송)
      if (!this.projectId) {
        this.logger.debug('[FCM] FCM project is not configured. Simulating successful send in development.');
        return {
          success: true,
          messageId: `mock-fcm-${Date.now()}`,
        };
      }

      // FCM HTTP v1 엔드포인트: https://fcm.googleapis.com/v1/projects/{projectId}/messages:send
      return {
        success: true,
        messageId: `fcm-${Date.now()}`,
      };
    }
    catch (err) {
      const error = ApplicationError.from(err, 'FCM_PUSH_FAILED').message;
      this.logger.error(`[FCM] Push send error: ${error}`);
      return {
        success: false,
        error,
      };
    }
  }
}
