import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigModule } from '#/modules/system-config/system-config.module';

import { AuthEmailVerificationController } from './email-verification.controller';
import { EmailVerificationHandler } from './email-verification.handler';
import { RequestEmailVerificationHandler } from './request-email-verification.handler';
import { VerifyEmailHandler } from './verify-email.handler';

@Module({
  controllers: [AuthEmailVerificationController],
  imports: [CqrsModule, SystemConfigModule],
  providers: [EmailVerificationHandler, RequestEmailVerificationHandler, VerifyEmailHandler],
})
export class AuthEmailVerificationModule {}
