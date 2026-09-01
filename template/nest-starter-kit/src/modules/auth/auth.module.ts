import { Module, type Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthController } from './auth.controller';
import { AccountLinkHandler, AccountUnlinkHandler, ChangePasswordHandler, Create2FAChallengeHandler, DeferPasswordHandler, Generate2FAHandler, IssueEmailChangeChallengeHandler, IssuePhoneChangeChallengeHandler, LoginCredentialHandler, LoginOAuthHandler, SyncAnalyticsConsentHandler, TurnOff2FAHandler, TurnOn2FAHandler, UserRegisterHandler, UserUnregisterHandler, Verify2FAChallengeHandler, VerifyEmailChangeHandler, VerifyIdentityPhoneChangeHandler, VerifyPhoneChangeHandler } from './handlers';
import { CleanupExpiredSessionsScheduler, CleanupExpiredVerificationsScheduler } from './schedulers';

const CommandHandlers: Provider[] = [
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
  IssuePhoneChangeChallengeHandler,
  VerifyPhoneChangeHandler,
  VerifyIdentityPhoneChangeHandler,
  IssueEmailChangeChallengeHandler,
  VerifyEmailChangeHandler,
  SyncAnalyticsConsentHandler,
];

const QueryHandlers: Provider[] = [];

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
    ...QueryHandlers,
  ],
})
export class AuthModule {}
