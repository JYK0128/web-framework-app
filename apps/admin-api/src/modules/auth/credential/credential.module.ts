import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigAdminEmailModule } from '#/modules/system-config/admin-email/admin-email.module';

import { ChangePasswordHandler } from './change-password.handler';
import { AuthCredentialController } from './credential.controller';
import { PasswordResetEmailHandler } from './password-reset-email.handler';
import { RequestPasswordResetHandler } from './request-password-reset.handler';
import { ResetPasswordHandler } from './reset-password.handler';

@Module({
  controllers: [AuthCredentialController],
  imports: [CqrsModule, SystemConfigAdminEmailModule],
  providers: [ChangePasswordHandler, PasswordResetEmailHandler, RequestPasswordResetHandler, ResetPasswordHandler],
})
export class AuthCredentialModule {}
