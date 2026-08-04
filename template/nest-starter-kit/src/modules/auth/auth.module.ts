import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { PassportModule } from '@nestjs/passport';

import { SessionModule } from '#/common/session/session.module';

import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { Generate2FAHandler } from './handlers/generate-2fa.handler';
import { LoginHandler } from './handlers/login.handler';
import { OAuthLoginHandler } from './handlers/oauth-login.handler';
import { RegisterHandler } from './handlers/register.handler';
import { TurnOff2FAHandler } from './handlers/turn-off-2fa.handler';
import { TurnOn2FAHandler } from './handlers/turn-on-2fa.handler';
import { Verify2FAHandler } from './handlers/verify-2fa.handler';
import { GoogleStrategy } from './strategies/google.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TwoFactorAuthGuard } from './two-factor-auth.guard';

@Module({
  imports: [CqrsModule, PassportModule, SessionModule],
  controllers: [AuthController],
  providers: [
    RegisterHandler,
    LoginHandler,
    OAuthLoginHandler,
    Generate2FAHandler,
    TurnOn2FAHandler,
    TurnOff2FAHandler,
    Verify2FAHandler,
    LocalStrategy,
    GoogleStrategy,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TwoFactorAuthGuard,
    },
  ],
})
export class AuthModule {}
