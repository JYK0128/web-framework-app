import { Module } from '@nestjs/common';
import { OAuthProviderModule } from '@pkg/server-core/oauth/oauth-provider.module';

import { SECURITY_CONFIG, SERVICE_ID } from '#/app.config';
import { oauthClient } from '#/core/oauth-client';
import { env } from '#/env';
import { OAuthController } from '#/modules/auth/oauth/oauth.controller';
import { OAuthService } from '#/modules/auth/oauth/oauth.service';

const oauthProviderModule = OAuthProviderModule.forRoot({
  namespace: SERVICE_ID,
  stateTtlMinutes: SECURITY_CONFIG.token.oauthStateTtlMinutes,
  requestTimeoutMs: SECURITY_CONFIG.integrations.httpRequestTimeoutSeconds * 1000,
  allowHttp: env.NODE_ENV === 'development',
  encryptionKey: env.OAUTH_ENCRYPTION_KEY,
  preventJwksRedirects: true,
  httpRequest: oauthClient.request,
});

@Module({
  controllers: [OAuthController],
  imports: [oauthProviderModule],
  providers: [OAuthService],
})
export class AuthOAuthModule {}
