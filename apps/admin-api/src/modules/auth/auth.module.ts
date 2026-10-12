import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SystemConfigsModule } from '#/modules/system-configs/system-configs.module';

import { AuthController } from './auth.controller';
import { authHandlers } from './handlers';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  imports: [CqrsModule, SystemConfigsModule],
  controllers: [AuthController, OAuthController],
  providers: [
    OAuthService,
    ...authHandlers,
  ],
})
export class AuthModule {}
