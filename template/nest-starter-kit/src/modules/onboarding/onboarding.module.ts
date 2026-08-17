import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { IssueEmailVerificationHandler, SendEmailVerificationMailEventHandler, VerifyEmailHandler } from './handlers';
import { OnboardingController } from './onboarding.controller';

const CommandHandlers = [
  IssueEmailVerificationHandler,
  VerifyEmailHandler,
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
