import { Command } from '@nestjs/cqrs';

export interface EmailChallengePayload {
  challengeId: string
  email: string
  code: string
}

export interface IssueEmailChallengeResult {
  ok: boolean
  challengeId: string
  expiresIn: number
  email: string
  code: string
}

export class IssueEmailChallengeCommand extends Command<IssueEmailChallengeResult> {
}
