import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { randomHex } from '@pkg/shared/server';

import { AppEntityManager } from '#/database/entity-manager';
import { Verification } from '#/entities/auth/verification.entity';
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
  constructor(private readonly em: AppEntityManager) {}

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
    const verification = this.em.create(Verification, {
      identifier: `2fa:${userId}`,
      value: challenge.id,
      expiresAt: challenge.expiresAt,
    });

    this.em.persist(verification);

    return { challengeId: challenge.id };
  }
}
