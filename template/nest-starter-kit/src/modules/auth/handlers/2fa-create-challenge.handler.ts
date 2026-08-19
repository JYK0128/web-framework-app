import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { randomHex } from '@pkg/shared/server';

import { AuthVerificationStore } from '#/common/security/auth-verification.store';
import { Create2FAChallengeCommand } from '#/modules/auth/commands/2fa-create-challenge.command';
import { TWO_FACTOR_CHALLENGE_TTL_MS } from '#/modules/auth/constants/auth-policy.constants';
import { TwoFactorCreateChallengeOutputDto } from '#/modules/auth/dto/2fa-create-challenge.output.dto';

interface Challenge {
  id: string
  expiresAt: Date
}

@Injectable()
@CommandHandler(Create2FAChallengeCommand)
export class Create2FAChallengeHandler implements ICommandHandler<Create2FAChallengeCommand, TwoFactorCreateChallengeOutputDto> {
  constructor(private readonly authVerificationStore: AuthVerificationStore) {}

  async execute(command: Create2FAChallengeCommand): Promise<TwoFactorCreateChallengeOutputDto> {
    const challenge = this.generateChallenge();
    return this.process(command.input.userId, challenge);
  }

  private generateChallenge(): Challenge {
    return {
      id: randomHex(),
      expiresAt: new Date(Date.now() + TWO_FACTOR_CHALLENGE_TTL_MS),
    };
  }

  private async process(userId: string, challenge: Challenge): Promise<TwoFactorCreateChallengeOutputDto> {
    await this.authVerificationStore.save(
      `2fa:${challenge.id}`,
      {
        value: userId,
        expiresAt: challenge.expiresAt.getTime(),
      },
      Math.ceil(TWO_FACTOR_CHALLENGE_TTL_MS / 1000),
    );

    return { challengeId: challenge.id };
  }
}
