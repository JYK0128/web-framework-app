import type { IssueEmailChangeChallengeRequestDto } from '#/modules/auth/dto/issue-email-change-challenge.request.dto';

export interface EmailChangePayload {
  challengeId: string
  userId: string
  newEmail: string
  token: string
}

export class IssueEmailChangeChallengeCommand {
  constructor(public readonly input: IssueEmailChangeChallengeRequestDto) {}
}
