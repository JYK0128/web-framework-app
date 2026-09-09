import { Command } from '@nestjs/cqrs';

import type { IssuePhoneChangeChallengeRequestDto } from '#/modules/auth/dto/issue-phone-change-challenge.request.dto';
import type { IssuePhoneChangeChallengeResponseDto } from '#/modules/auth/dto/issue-phone-change-challenge.response.dto';

export interface PhoneChangePayload {
  challengeId: string
  phoneNumber: string
  code: string
}

export class IssuePhoneChangeChallengeCommand extends Command<IssuePhoneChangeChallengeResponseDto> {
  constructor(public readonly input: IssuePhoneChangeChallengeRequestDto) {
    super();
  }
}
