import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthController } from './auth.controller';
import { EmailVerificationService } from './email-verification.service';
import { authHandlers } from './handlers/index';
import { IdentityVerificationController } from './identity-verification.controller';
import { OAuthController } from './oauth.controller';
import { OAuthAuthenticationService } from './oauth-authentication.service';
import { PortoneIdentityService } from './portone-identity.service';

@Module({
  imports: [CqrsModule],
  controllers: [AuthController, IdentityVerificationController, OAuthController],
  providers: [
    ...authHandlers,
    PortoneIdentityService,
    EmailVerificationService,
    OAuthAuthenticationService,
  ],
})
export class AuthModule {}
