import { Module, type Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthController } from './auth.controller';
import { AccountLinkHandler, AccountUnlinkHandler, ChangePasswordHandler, Create2FAChallengeHandler, DeferPasswordHandler, FindIdHandler, Generate2FAHandler, IssueEmailChangeChallengeHandler, IssuePasswordResetChallengeHandler, IssuePhoneChangeChallengeHandler, LoginCredentialHandler, LoginOAuthHandler, ResetPasswordHandler, SyncAnalyticsConsentHandler, TurnOff2FAHandler, TurnOn2FAHandler, UserRegisterHandler, UserUnregisterHandler, Verify2FAChallengeHandler, VerifyEmailChangeHandler, VerifyIdentityPhoneChangeHandler, VerifyPasswordResetTokenHandler, VerifyPhoneChangeHandler } from './handlers';
import { CleanupExpiredSessionsScheduler, CleanupExpiredVerificationsScheduler, ResetDemoDataScheduler } from './schedulers';

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
  IssuePasswordResetChallengeHandler,
  ResetPasswordHandler,
];

const QueryHandlers: Provider[] = [
  FindIdHandler,
  VerifyPasswordResetTokenHandler,
];

const Schedulers = [
  CleanupExpiredSessionsScheduler,
  CleanupExpiredVerificationsScheduler,
  ResetDemoDataScheduler,
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
