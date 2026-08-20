import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthController } from './auth.controller';
import { AccountLinkHandler, AccountUnlinkHandler, ChangePasswordHandler, Create2FAChallengeHandler, DeferPasswordHandler, Generate2FAHandler, LoginCredentialHandler, LoginOAuthHandler, TurnOff2FAHandler, TurnOn2FAHandler, UserRegisterHandler, UserUnregisterHandler, Verify2FAChallengeHandler } from './handlers';

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

@Module({
  imports: [CqrsModule],
  controllers: [AuthController],
  providers: [
    ...CommandHandlers,
  ],
})
export class AuthModule {}
