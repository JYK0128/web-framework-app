import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { randomHex } from '@pkg/shared/server';

import { VerificationStore } from '#/common/stores/verification.store';
import { TwoFactorChallengeResult, TwoFactorCreateChallengeCommand } from '#/modules/auth/commands/2fa-create-challenge.command';
import { TWO_FACTOR_CHALLENGE_TTL_MS } from '#/modules/auth/constants/auth-policy.constants';

interface Challenge {
  id: string
  expiresAt: Date
}

@Injectable()
@CommandHandler(TwoFactorCreateChallengeCommand)
export class Create2FAChallengeHandler implements ICommandHandler<TwoFactorCreateChallengeCommand, TwoFactorChallengeResult> {
  constructor(private readonly verificationStore: VerificationStore) {}

  async execute(command: TwoFactorCreateChallengeCommand): Promise<TwoFactorChallengeResult> {
    const challenge = this.generateChallenge();
    return this.process(command.input.userId, challenge);
  }

  private generateChallenge(): Challenge {
    return {
      id: randomHex(),
      expiresAt: new Date(Date.now() + TWO_FACTOR_CHALLENGE_TTL_MS),
    };
  }

  private async process(userId: string, challenge: Challenge): Promise<TwoFactorChallengeResult> {
    await this.verificationStore.save(
      `2fa:${challenge.id}`,
      {
        value: userId,
        expiresAt: challenge.expiresAt.getTime(),
      },
    );

    return {
      challengeId: challenge.id,
      expiresIn: Math.floor(TWO_FACTOR_CHALLENGE_TTL_MS / 1000),
    };
  }
}
