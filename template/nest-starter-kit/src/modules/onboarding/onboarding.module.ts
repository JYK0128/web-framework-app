import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { IssueEmailChallengeHandler, IssuePhoneChallengeHandler, VerifyEmailHandler, VerifyIdentityHandler, VerifyPhoneHandler } from './handlers';
import { OnboardingController } from './onboarding.controller';
import { EmailVerificationMailer } from './services';

const CommandHandlers = [
  IssueEmailChallengeHandler,
  IssuePhoneChallengeHandler,
  VerifyEmailHandler,
  VerifyIdentityHandler,
  VerifyPhoneHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [OnboardingController],
  providers: [
    ...CommandHandlers,
    EmailVerificationMailer,
  ],
})
export class OnboardingModule {}
