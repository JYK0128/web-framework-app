import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthController } from './auth.controller';
import { authHandlers } from './handlers/index';
import { OAuthController } from './oauth.controller';
import { OAuthAuthenticationService } from './oauth-authentication.service';
import { PortoneIdentityService } from './portone-identity.service';

@Module({
  imports: [CqrsModule],
  controllers: [AuthController, OAuthController],
  providers: [
    ...authHandlers,
    PortoneIdentityService,
    OAuthAuthenticationService,
  ],
})
export class AuthModule {}
