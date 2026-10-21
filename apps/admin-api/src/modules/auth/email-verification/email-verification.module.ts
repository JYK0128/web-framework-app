import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthEmailVerificationController } from '~/modules/auth/email-verification/email-verification.controller';
import { EmailVerificationHandler } from '~/modules/auth/email-verification/email-verification.handler';
import { RequestEmailVerificationHandler } from '~/modules/auth/email-verification/request-email-verification.handler';
import { VerifyEmailHandler } from '~/modules/auth/email-verification/verify-email.handler';
import { SystemConfigAdminEmailModule } from '~/modules/system-config/admin-email/admin-email.module';

@Module({
  controllers: [AuthEmailVerificationController],
  imports: [CqrsModule, SystemConfigAdminEmailModule],
  providers: [EmailVerificationHandler, RequestEmailVerificationHandler, VerifyEmailHandler],
})
export class AuthEmailVerificationModule {}
