import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthAccountController } from '~/modules/auth/account/account.controller';
import { FindIdHandler } from '~/modules/auth/account/find-id.handler';
import { RegisterHandler } from '~/modules/auth/account/register.handler';
import { UnregisterHandler } from '~/modules/auth/account/unregister.handler';
import { AuthEmailVerificationModule } from '~/modules/auth/email-verification/email-verification.module';
import { SystemConfigAdminEmailModule } from '~/modules/system-config/admin-email/admin-email.module';

@Module({
  controllers: [AuthAccountController],
  imports: [CqrsModule, SystemConfigAdminEmailModule, AuthEmailVerificationModule],
  providers: [FindIdHandler, RegisterHandler, UnregisterHandler],
})
export class AuthAccountModule {}
