import { Module } from '@nestjs/common';

import { AuthAccountModule } from './account/account.module';
import { AuthCredentialModule } from './credential/credential.module';
import { AuthEmailVerificationModule } from './email-verification/email-verification.module';
import { AuthOAuthModule } from './oauth/oauth.module';
import { AuthPhoneVerificationModule } from './phone-verification/phone-verification.module';
import { AuthProfileModule } from './profile/profile.module';
import { AuthSessionModule } from './session/session.module';
import { AuthTwoFactorModule } from './two-factor/two-factor.module';

@Module({
  imports: [
    AuthAccountModule,
    AuthCredentialModule,
    AuthEmailVerificationModule,
    AuthPhoneVerificationModule,
    AuthProfileModule,
    AuthSessionModule,
    AuthTwoFactorModule,
    AuthOAuthModule,
  ],
})
export class AuthModule {}
