import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ChangePasswordHandler } from './change-password.handler';
import { AuthCredentialController } from './credential.controller';
import { RequestPasswordResetHandler } from './request-password-reset.handler';
import { ResetPasswordHandler } from './reset-password.handler';

@Module({
  controllers: [AuthCredentialController],
  imports: [CqrsModule],
  providers: [ChangePasswordHandler, RequestPasswordResetHandler, ResetPasswordHandler],
})
export class AuthCredentialModule {}
