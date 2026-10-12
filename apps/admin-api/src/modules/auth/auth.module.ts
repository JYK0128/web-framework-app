import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OAuthProviderModule } from '#/core/oauth/oauth.module';
import { SystemConfigsModule } from '#/modules/system-configs/system-configs.module';

import { AccountRecoveryService } from './account-recovery.service';
import { AuthController } from './auth.controller';
import { authHandlers } from './handlers';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  imports: [CqrsModule, SystemConfigsModule, OAuthProviderModule],
  controllers: [AuthController, OAuthController],
  providers: [
    AccountRecoveryService,
    OAuthService,
    ...authHandlers,
  ],
  exports: [AccountRecoveryService],
})
export class AuthModule {}
