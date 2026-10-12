import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigAdminEmailModule } from '#/modules/system-config/admin-email/admin-email.module';

import { AuthEmailVerificationController } from './email-verification.controller';
import { EmailVerificationHandler } from './email-verification.handler';
import { RequestEmailVerificationHandler } from './request-email-verification.handler';
import { VerifyEmailHandler } from './verify-email.handler';

@Module({
  controllers: [AuthEmailVerificationController],
  imports: [CqrsModule, SystemConfigAdminEmailModule],
  providers: [EmailVerificationHandler, RequestEmailVerificationHandler, VerifyEmailHandler],
})
export class AuthEmailVerificationModule {}
