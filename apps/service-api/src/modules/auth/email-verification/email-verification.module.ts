import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthEmailVerificationController } from './email-verification.controller';
import { RequestEmailVerificationHandler } from './request-email-verification.handler';
import { VerifyEmailHandler } from './verify-email.handler';

@Module({
  controllers: [AuthEmailVerificationController],
  imports: [CqrsModule],
  providers: [RequestEmailVerificationHandler, VerifyEmailHandler],
})
export class AuthEmailVerificationModule {}
