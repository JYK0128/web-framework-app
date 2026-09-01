import { Command } from '@nestjs/cqrs';

export interface TwoFactorCreateChallengePayload {
  userId: string
  rememberMe?: boolean
}

export interface TwoFactorChallengeResult {
  challengeId: string
  expiresIn: number
}

export class TwoFactorCreateChallengeCommand extends Command<TwoFactorChallengeResult> {
  constructor(public readonly input: TwoFactorCreateChallengePayload) {
    super();
  }
}
