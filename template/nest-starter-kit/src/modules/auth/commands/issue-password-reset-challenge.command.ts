import { Command } from '@nestjs/cqrs';

import type { IssuePasswordResetChallengeRequestDto } from '#/modules/auth/dto/issue-password-reset-challenge.request.dto';
import type { IssuePasswordResetChallengeResponseDto } from '#/modules/auth/dto/issue-password-reset-challenge.response.dto';

export class IssuePasswordResetChallengeCommand extends Command<IssuePasswordResetChallengeResponseDto> {
  constructor(public readonly input: IssuePasswordResetChallengeRequestDto) {
    super();
  }
}
