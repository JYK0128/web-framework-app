import { Module } from '@nestjs/common';

import { AuthAccountModule } from '~/modules/auth/account/account.module';
import { AuthCredentialModule } from '~/modules/auth/credential/credential.module';
import { AuthEmailVerificationModule } from '~/modules/auth/email-verification/email-verification.module';
import { AuthOAuthModule } from '~/modules/auth/oauth/oauth.module';
import { AuthPhoneVerificationModule } from '~/modules/auth/phone-verification/phone-verification.module';
import { AuthProfileModule } from '~/modules/auth/profile/profile.module';
import { ResetDemoDataScheduler } from '~/modules/auth/reset-demo-data.scheduler';
import { AuthSessionModule } from '~/modules/auth/session/session.module';
import { AuthTwoFactorModule } from '~/modules/auth/two-factor/two-factor.module';

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
  providers: [ResetDemoDataScheduler],
})
export class AuthModule {}
