import { Module } from '@nestjs/common';

import { OAuthProviderModule } from '#/core/oauth/oauth.module';

import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Module({
  controllers: [OAuthController],
  imports: [OAuthProviderModule],
  providers: [OAuthService],
})
export class AuthOAuthModule {}
