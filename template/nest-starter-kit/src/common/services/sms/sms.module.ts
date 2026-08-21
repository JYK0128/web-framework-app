import { Module } from '@nestjs/common';

import { SmsProvider } from './sms.provider';
import { SmsService } from './sms.service';

/**
 * SMS integration boundary.
 * This module is intentionally not imported by AppModule/AuthModule yet.
 */
@Module({
  providers: [SmsProvider, SmsService],
  exports: [SmsProvider, SmsService],
})
export class SmsModule {}
