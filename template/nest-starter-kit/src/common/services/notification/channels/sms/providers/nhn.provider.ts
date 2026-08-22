import { Injectable, Logger } from '@nestjs/common';

import type { ISmsProvider, SmsMessage, SmsProviderResult } from '#/common/services/notification/channels/sms/sms.interface';

@Injectable()
export class NhnSmsProvider implements ISmsProvider {
  readonly providerName = 'nhn';
  private readonly logger = new Logger(NhnSmsProvider.name);

  async send(message: SmsMessage): Promise<SmsProviderResult> {
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
