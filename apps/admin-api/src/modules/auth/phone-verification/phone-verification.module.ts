import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthPhoneVerificationController } from './phone-verification.controller';
import { VerifyPhoneNumberHandler } from './verify-phone-number.handler';

@Module({
  controllers: [AuthPhoneVerificationController],
  imports: [CqrsModule],
  providers: [VerifyPhoneNumberHandler],
})
export class AuthPhoneVerificationModule {}
