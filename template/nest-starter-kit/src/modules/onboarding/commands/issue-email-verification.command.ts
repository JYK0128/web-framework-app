import { Command } from '@nestjs/cqrs';

import type { IssueEmailVerificationInputDto } from '#/modules/onboarding/dto/issue-email-verification.input.dto';
import type { IssueEmailVerificationOutputDto } from '#/modules/onboarding/dto/issue-email-verification.output.dto';

export class IssueEmailVerificationCommand extends Command<IssueEmailVerificationOutputDto> {
  constructor(public readonly input: IssueEmailVerificationInputDto = {}) {
    super();
  }
}
