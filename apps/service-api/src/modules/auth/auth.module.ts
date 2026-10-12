import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OAuthProviderModule } from '#/core/oauth/oauth.module';

import { AuthController } from './auth.controller';
import { authHandlers } from './handlers/index';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  imports: [CqrsModule, OAuthProviderModule],
  controllers: [AuthController, OAuthController],
  providers: [
    ...authHandlers,
    OAuthService,
  ],
})
export class AuthModule {}
