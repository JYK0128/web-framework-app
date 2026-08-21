import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { IssueEmailChallengeHandler, IssuePhoneChallengeHandler, SendEmailVerificationMailEventHandler, VerifyEmailHandler, VerifyPhoneHandler } from './handlers';
import { OnboardingController } from './onboarding.controller';

const CommandHandlers = [
  IssueEmailChallengeHandler,
  IssuePhoneChallengeHandler,
  VerifyEmailHandler,
  VerifyPhoneHandler,
];

const EventHandlers = [
  SendEmailVerificationMailEventHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [OnboardingController],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
  ],
})
export class OnboardingModule {}
