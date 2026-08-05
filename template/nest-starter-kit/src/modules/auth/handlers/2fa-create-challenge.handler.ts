import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { randomBytes } from 'crypto';

import { Verification } from '#/entities/auth/verification.entity';
import { Create2FAChallengeCommand } from '#/modules/auth/commands/2fa-create-challenge.command';
import { Create2FAChallengeResponseDto } from '#/modules/auth/dto/2fa-create-challenge.response.dto';

@Injectable()
@CommandHandler(Create2FAChallengeCommand)
export class Create2FAChallengeHandler implements ICommandHandler<Create2FAChallengeCommand, Create2FAChallengeResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: Create2FAChallengeCommand): Promise<Create2FAChallengeResponseDto> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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
