import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthController } from './auth.controller';
import { AccountLinkHandler, AccountUnlinkHandler, ChangePasswordHandler, Create2FAChallengeHandler, DeferPasswordHandler, Generate2FAHandler, LoginCredentialHandler, LoginOAuthHandler, TurnOff2FAHandler, TurnOn2FAHandler, UserRegisterHandler, UserUnregisterHandler, Verify2FAChallengeHandler } from './handlers';
import { CleanupExpiredSessionsScheduler, CleanupExpiredVerificationsScheduler } from './schedulers';

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
  ChangePasswordHandler,
  DeferPasswordHandler,
];

const Schedulers = [
  CleanupExpiredSessionsScheduler,
  CleanupExpiredVerificationsScheduler,
];

@Module({
  imports: [CqrsModule],
  controllers: [AuthController],
  providers: [
    ...Schedulers,
    ...CommandHandlers,
  ],
})
export class AuthModule {}
