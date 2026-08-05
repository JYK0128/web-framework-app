import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { randomBytes } from 'crypto';

import { Verification } from '#/entities/auth/verification.entity';
import { TermsCreateChallengeCommand } from '#/modules/auth/commands/terms-create-challenge.command';
import { TermsCreateChallengeResponseDto } from '#/modules/auth/dto/terms-create-challenge.response.dto';

@Injectable()
@CommandHandler(TermsCreateChallengeCommand)
export class TermsCreateChallengeHandler implements ICommandHandler<TermsCreateChallengeCommand, TermsCreateChallengeResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: TermsCreateChallengeCommand): Promise<TermsCreateChallengeResponseDto> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const verification = this.em.create(Verification, {
      identifier: `terms:${command.input.userId}`,
      value: token,
      expiresAt,
    });

    this.em.persist(verification);
    await this.em.flush();

    return { token };
  }
}
