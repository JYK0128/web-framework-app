import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthEmailVerificationController } from '#/modules/auth/email-verification/email-verification.controller';
import { RequestEmailVerificationHandler } from '#/modules/auth/email-verification/request-email-verification.handler';
import { VerifyEmailHandler } from '#/modules/auth/email-verification/verify-email.handler';
import { SystemConfigsModule } from '#/modules/system-configs/system-configs.module';

@Module({
  controllers: [AuthEmailVerificationController],
  imports: [CqrsModule, SystemConfigsModule],
  providers: [RequestEmailVerificationHandler, VerifyEmailHandler],
})
export class AuthEmailVerificationModule {}
