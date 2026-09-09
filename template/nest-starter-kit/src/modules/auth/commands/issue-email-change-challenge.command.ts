import { Command } from '@nestjs/cqrs';

import type { IssueEmailChangeChallengeRequestDto } from '#/modules/auth/dto/issue-email-change-challenge.request.dto';
import type { IssueEmailChangeChallengeResponseDto } from '#/modules/auth/dto/issue-email-change-challenge.response.dto';

export interface EmailChangePayload {
  challengeId: string
  userId: string
  newEmail: string
  token: string
}

export class IssueEmailChangeChallengeCommand extends Command<IssueEmailChangeChallengeResponseDto> {
  constructor(public readonly input: IssueEmailChangeChallengeRequestDto) {
    super();
  }
}
