import { Injectable } from '@nestjs/common';

export interface SmsMessage {
  to: string
  body: string
}

/**
 * Provider port. Replace this implementation with a Twilio/NHN/SNS adapter
 * without changing SmsService or its callers.
 */
@Injectable()
export class SmsProvider {
  async send(_message: SmsMessage): Promise<void> {
    throw new Error('SMS provider is not configured');
  }
}
