import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigModule } from '#/modules/system-config/system-config.module';

import { ChangePasswordHandler } from './change-password.handler';
import { AuthCredentialController } from './credential.controller';
import { PasswordResetEmailHandler } from './password-reset-email.handler';
import { RequestPasswordResetHandler } from './request-password-reset.handler';
import { ResetPasswordHandler } from './reset-password.handler';

@Module({
  controllers: [AuthCredentialController],
  imports: [CqrsModule, SystemConfigModule],
  providers: [ChangePasswordHandler, PasswordResetEmailHandler, RequestPasswordResetHandler, ResetPasswordHandler],
})
export class AuthCredentialModule {}
