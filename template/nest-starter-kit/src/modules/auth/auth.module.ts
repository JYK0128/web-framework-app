import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

import { SessionModule } from '#/common/session/session.module';

import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AccountLinkHandler, AccountUnlinkHandler, Create2FAChallengeHandler, Generate2FAHandler, LoginCredentialHandler, LoginOAuthHandler, LogoutHandler, TurnOff2FAHandler, TurnOn2FAHandler, UserProfileHandler, UserRegisterHandler, UserUnregisterHandler, Verify2FAChallengeHandler } from './handlers';
import { TermsAgreeHandler } from './handlers/terms-agree.handler';
import { TermsChallengeListHandler } from './handlers/terms-challenge-list.handler';
import { TermsCreateChallengeHandler } from './handlers/terms-create-challenge.handler';
import { TermsValidateAgreementsHandler } from './handlers/terms-validate-agreements.handler';

const CommandHandlers = [
  UserRegisterHandler,
  AccountLinkHandler,
  LogoutHandler,
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
  TermsAgreeHandler,
  TermsValidateAgreementsHandler,
  TermsCreateChallengeHandler,
  TermsChallengeListHandler,
];

@Module({
  imports: [CqrsModule, SessionModule],
  controllers: [AuthController],
  providers: [
    ...CommandHandlers,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
