import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ChangePasswordHandler } from '#/modules/auth/credential/change-password.handler';
import { AuthCredentialController } from '#/modules/auth/credential/credential.controller';
import { PasswordResetEmailHandler } from '#/modules/auth/credential/password-reset-email.handler';
import { RequestPasswordResetHandler } from '#/modules/auth/credential/request-password-reset.handler';
import { ResetPasswordHandler } from '#/modules/auth/credential/reset-password.handler';
import { SystemConfigAdminEmailModule } from '#/modules/system-config/admin-email/admin-email.module';

@Module({
  controllers: [AuthCredentialController],
  imports: [CqrsModule, SystemConfigAdminEmailModule],
  providers: [ChangePasswordHandler, PasswordResetEmailHandler, RequestPasswordResetHandler, ResetPasswordHandler],
})
export class AuthCredentialModule {}
