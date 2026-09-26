import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigModule } from '#/modules/system-config/system-config.module';

import { AccountRecoveryService } from './account-recovery.service';
import { AuthController } from './auth.controller';
import { authHandlers } from './handlers/index';

@Module({
  imports: [CqrsModule, SystemConfigModule],
  controllers: [AuthController],
  providers: [
    AccountRecoveryService,
    ...authHandlers,
  ],
})
export class AuthModule {}
