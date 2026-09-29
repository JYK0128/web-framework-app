import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigsModule } from '#/modules/system-configs/system-configs.module';

import { AccountRecoveryService } from './account-recovery.service';
import { AuthController } from './auth.controller';
import { authHandlers } from './handlers/index';
import { PortoneIdentityService } from './portone-identity.service';

@Module({
  imports: [CqrsModule, SystemConfigsModule],
  controllers: [AuthController],
  providers: [
    AccountRecoveryService,
    PortoneIdentityService,
    ...authHandlers,
  ],
  exports: [AccountRecoveryService],
})
export class AuthModule {}
