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
  private readonly userAccessKeyId?: string;
  private readonly secretAccessKey?: string;

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    this.appKey = options.push?.nhn?.appKey;
    this.userAccessKeyId = options.push?.nhn?.userAccessKeyId;
    this.secretAccessKey = options.push?.nhn?.secretAccessKey;
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
      if (!this.appKey || !this.userAccessKeyId || !this.secretAccessKey) {
        return { success: false, error: 'NHN Push AppKey, User Access Key ID, Secret Access Key가 모두 필요합니다.' };
      }

      const response = await fetch(`https://api-push.cloud.toast.com/push/v2.2/appkeys/${encodeURIComponent(this.appKey)}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'X-User-Access-Key-ID': this.userAccessKeyId,
          'X-Secret-Access-Key': this.secretAccessKey,
        },
        body: JSON.stringify({
          target: { type: 'UID', to: [message.token] },
          content: { default: { title: message.title || '알림', body: message.body, ...(message.data ?? {}) } },
          messageType: 'AD',
          timeToLiveMinute: 60,
        }),
      });
      const result = await response.json() as { header?: { isSuccessful?: boolean, resultMessage?: string }, message?: { messageIdString?: string } };
      const success = response.ok && result.header?.isSuccessful === true;
      return {
        success,
        messageId: result.message?.messageIdString,
        error: success ? undefined : result.header?.resultMessage || `NHN Push API HTTP ${response.status}`,
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
