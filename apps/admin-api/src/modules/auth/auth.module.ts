import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigModule } from '#/modules/system-config/system-config.module';

import { AuthController } from './auth.controller';
import { authHandlers } from './handlers';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  imports: [CqrsModule, SystemConfigModule],
  controllers: [AuthController, OAuthController],
  providers: [
    OAuthService,
    ...authHandlers,
  ],
})
export class AuthModule {}
