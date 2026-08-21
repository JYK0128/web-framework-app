import { Injectable, Logger } from '@nestjs/common';

import { SmsProvider } from './sms.provider';

export interface SendSmsOptions {
  phoneNumber: string
  message: string
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly provider: SmsProvider) {}

  async sendMessage({ phoneNumber, message }: SendSmsOptions): Promise<boolean> {
    try {
      await this.provider.send({
        to: phoneNumber,
        body: message,
      });
      this.logger.log(`SMS sent to ${phoneNumber}`);
      return true;
    }
    catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      return false;
    }
  }
}
