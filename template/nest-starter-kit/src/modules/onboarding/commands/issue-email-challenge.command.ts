import { Command } from '@nestjs/cqrs';

import { EmailVerificationChallenge } from '#/modules/onboarding/domain';
import { IssueEmailChallengeRequestDto } from '#/modules/onboarding/dto';

export class IssueEmailChallengeCommand extends Command<EmailVerificationChallenge> {
  constructor(public readonly input: IssueEmailChallengeRequestDto = new IssueEmailChallengeRequestDto()) {
    super();
  }
}
