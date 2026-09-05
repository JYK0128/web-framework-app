import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import type { ISmsAdapter, SmsAdapterResult, SmsMessage } from '#/infra/notification/channels/sms/sms.interface';
import { NOTIFICATION_MODULE_OPTIONS, type NotificationModuleOptions } from '#/infra/notification/notification.interface';

/**
 * AWS SNS SMS 연동 어댑터
 */
@Injectable()
export class AwsSnsSmsAdapter implements ISmsAdapter {
  readonly providerName = 'aws-sns';
  private readonly logger = new Logger(AwsSnsSmsAdapter.name);
  private readonly region: string;
  private readonly senderId?: string;

  constructor(
    @Inject(NOTIFICATION_MODULE_OPTIONS)
    options: NotificationModuleOptions,
  ) {
    this.region = options.sms?.sns?.region || 'ap-northeast-2';
    this.senderId = options.sms?.sns?.senderId;
  }

  async send(message: SmsMessage): Promise<SmsAdapterResult> {
    try {
      // AWS SNS REST or SDK PublishCommand 연동부
      this.logger.log(`[AWS SNS SMS] Region: ${this.region} | To: ${message.to} | Body: ${message.body} | SenderId: ${this.senderId ?? 'N/A'}`);

      return {
        success: true,
        messageId: `sns-${Date.now()}-${randomUUID()}`,
      };
    }
    catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(`[AWS SNS SMS] Send failed to ${message.to}: ${error}`);
      return {
        success: false,
        error,
      };
    }
  }
}
