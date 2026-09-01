import type { IssuePhoneChangeChallengeRequestDto } from '#/modules/auth/dto/issue-phone-change-challenge.request.dto';

export interface PhoneChangePayload {
  challengeId: string
  phoneNumber: string
  code: string
}

export class IssuePhoneChangeChallengeCommand {
  constructor(public readonly input: IssuePhoneChangeChallengeRequestDto) {}
}
