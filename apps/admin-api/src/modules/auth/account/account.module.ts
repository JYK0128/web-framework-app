import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthEmailVerificationModule } from '#/modules/auth/email-verification/email-verification.module';
import { SystemConfigAdminEmailModule } from '#/modules/system-config/admin-email/admin-email.module';

import { AuthAccountController } from './account.controller';
import { FindIdHandler } from './find-id.handler';
import { RegisterHandler } from './register.handler';
import { UnregisterHandler } from './unregister.handler';

@Module({
  controllers: [AuthAccountController],
  imports: [CqrsModule, SystemConfigAdminEmailModule, AuthEmailVerificationModule],
  providers: [FindIdHandler, RegisterHandler, UnregisterHandler],
})
export class AuthAccountModule {}
