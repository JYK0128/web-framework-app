import { Command } from '@nestjs/cqrs';

export interface TwoFactorCreateChallengePayload {
  userId: string
}

export interface TwoFactorChallengeResult {
  challengeId: string
}

export class TwoFactorCreateChallengeCommand extends Command<TwoFactorChallengeResult> {
  constructor(public readonly input: TwoFactorCreateChallengePayload) {
    super();
  }
}
