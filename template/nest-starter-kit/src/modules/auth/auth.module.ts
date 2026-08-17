import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

import { PermissionGuard } from '#/common/guards/permission.guard';
import { UserVerificationGuard } from '#/common/guards/user-verification.guard';

import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AccountLinkHandler, AccountUnlinkHandler, ChangePasswordHandler, Create2FAChallengeHandler, DeferPasswordHandler, Generate2FAHandler, LoginCredentialHandler, LoginOAuthHandler, TurnOff2FAHandler, TurnOn2FAHandler, UserProfileHandler, UserRegisterHandler, UserUnregisterHandler, Verify2FAChallengeHandler } from './handlers';

const CommandHandlers = [
  UserRegisterHandler,
  AccountLinkHandler,
  AccountUnlinkHandler,
  UserUnregisterHandler,
  LoginCredentialHandler,
  LoginOAuthHandler,
  Generate2FAHandler,
  TurnOn2FAHandler,
  TurnOff2FAHandler,
  Verify2FAChallengeHandler,
  Create2FAChallengeHandler,
  UserProfileHandler,
  ChangePasswordHandler,
  DeferPasswordHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [AuthController],
  providers: [
    ...CommandHandlers,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UserVerificationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AuthModule {}
