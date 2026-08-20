import { Command } from '@nestjs/cqrs';

import type { IssueEmailVerificationResponseDto } from '#/modules/onboarding/dto/issue-email-verification.response.dto';

export class IssueEmailVerificationCommand extends Command<IssueEmailVerificationResponseDto> {
  constructor() {
    super();
  }
}
