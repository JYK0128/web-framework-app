import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { randomHex } from '@pkg/shared/server';

import { Verification } from '#/entities/auth/verification.entity';
import { Create2FAChallengeCommand } from '#/modules/auth/commands/2fa-create-challenge.command';
import { TWO_FACTOR_CHALLENGE_TTL_MS } from '#/modules/auth/constants/auth-policy.constants';
import { TwoFactorCreateChallengeResponseDto } from '#/modules/auth/dto/2fa-create-challenge.response.dto';

@Injectable()
@CommandHandler(Create2FAChallengeCommand)
export class Create2FAChallengeHandler implements ICommandHandler<Create2FAChallengeCommand, TwoFactorCreateChallengeResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: Create2FAChallengeCommand): Promise<TwoFactorCreateChallengeResponseDto> {
    const token = randomHex();
    const expiresAt = new Date(Date.now() + TWO_FACTOR_CHALLENGE_TTL_MS);

    const verification = this.em.create(Verification, {
      identifier: `2fa:${command.input.userId}`,
      value: token,
      expiresAt,
    });

    this.em.persist(verification);
    await this.em.flush();

    return { token };
  }
}
