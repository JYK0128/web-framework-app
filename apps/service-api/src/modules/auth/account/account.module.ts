import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthAccountController } from '~/modules/auth/account/account.controller';
import { FindIdHandler } from '~/modules/auth/account/find-id.handler';
import { RegisterHandler } from '~/modules/auth/account/register.handler';
import { UnregisterHandler } from '~/modules/auth/account/unregister.handler';
import { SystemConfigsModule } from '~/modules/system-config/system-configs.module';

@Module({
  controllers: [AuthAccountController],
  imports: [CqrsModule, SystemConfigsModule],
  providers: [FindIdHandler, RegisterHandler, UnregisterHandler],
})
export class AuthAccountModule {}
