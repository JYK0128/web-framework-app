import { Command } from '@nestjs/cqrs';

import type { IssuePhoneChallengeRequestDto } from '#/modules/onboarding/dto/issue-phone-challenge.request.dto';
import type { IssuePhoneChallengeResponseDto } from '#/modules/onboarding/dto/issue-phone-challenge.response.dto';

export interface PhoneChallengePayload {
  challengeId: string
  phoneNumber: string
  code: string
}

export class IssuePhoneChallengeCommand extends Command<IssuePhoneChallengeResponseDto> {
  constructor(public readonly input: IssuePhoneChallengeRequestDto) {
    super();
  }
}
