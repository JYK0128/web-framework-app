import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthPhoneVerificationController } from '~/modules/auth/phone-verification/phone-verification.controller';
import { VerifyPhoneNumberHandler } from '~/modules/auth/phone-verification/verify-phone-number.handler';

@Module({
  controllers: [AuthPhoneVerificationController],
  imports: [CqrsModule],
  providers: [VerifyPhoneNumberHandler],
})
export class AuthPhoneVerificationModule {}
