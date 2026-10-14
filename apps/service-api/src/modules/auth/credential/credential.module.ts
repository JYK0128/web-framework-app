import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ChangePasswordHandler } from '#/modules/auth/credential/change-password.handler';
import { AuthCredentialController } from '#/modules/auth/credential/credential.controller';
import { RequestPasswordResetHandler } from '#/modules/auth/credential/request-password-reset.handler';
import { ResetPasswordHandler } from '#/modules/auth/credential/reset-password.handler';
import { SystemConfigsModule } from '#/modules/system-configs/system-configs.module';

@Module({
  controllers: [AuthCredentialController],
  imports: [CqrsModule, SystemConfigsModule],
  providers: [ChangePasswordHandler, RequestPasswordResetHandler, ResetPasswordHandler],
})
export class AuthCredentialModule {}
