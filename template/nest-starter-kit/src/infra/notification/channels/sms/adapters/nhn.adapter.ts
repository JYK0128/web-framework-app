import { Injectable, Logger } from '@nestjs/common';

import type { ISmsAdapter, SmsAdapterResult, SmsMessage } from '#/infra/notification/channels/sms/sms.interface';

@Injectable()
export class NhnSmsAdapter implements ISmsAdapter {
  readonly providerName = 'nhn';
  private readonly logger = new Logger(NhnSmsAdapter.name);

  async send(message: SmsMessage): Promise<SmsAdapterResult> {
    try {
      // NHN Cloud Notification API / SMS REST 호출 연동부
      this.logger.log(`[NHN Cloud SMS] To: ${message.to} | Body: ${message.body}`);

      return {
        success: true,
        messageId: `nhn-${Date.now()}`,
      };
    }
    catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(`[NHN Cloud SMS] Send failed to ${message.to}: ${error}`);
      return {
        success: false,
        error,
      };
    }
  }
}
