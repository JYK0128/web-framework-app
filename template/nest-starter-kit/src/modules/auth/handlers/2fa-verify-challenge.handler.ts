import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { verifySync } from 'otplib';

import { TwoFactor } from '#/entities/auth/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { Verification } from '#/entities/auth/verification.entity';
import { Verify2FAChallengeCommand } from '#/modules/auth/commands/2fa-verify-challenge.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

@Injectable()
@CommandHandler(Verify2FAChallengeCommand)
export class Verify2FAChallengeHandler implements ICommandHandler<Verify2FAChallengeCommand, UserProfileResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
  ) {}

  async execute(command: Verify2FAChallengeCommand): Promise<UserProfileResponseDto> {
    const verification = await this.em.findOne(Verification, { value: command.input.token });
    if (!verification) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }

    if (verification.expiresAt < new Date()) {
      await this.em.remove(verification).flush();
      throw new ApplicationError({ code: 'EXPIRED_TOKEN', status: HttpStatus.BAD_REQUEST });
    }

    const userId = verification.identifier.replace('2fa:', '');
    const user = await this.em.findOne(User, { id: userId });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.BAD_REQUEST });
    }

    if (!user.twoFactorEnabled) {
      throw new ApplicationError({ code: 'TWO_FACTOR_NOT_ENABLED', status: HttpStatus.BAD_REQUEST });
    }

    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id });
    if (!twoFactor) {
      throw new ApplicationError({ code: 'TWO_FACTOR_NOT_ENABLED', status: HttpStatus.BAD_REQUEST });
    }

    const secret = twoFactor.secret;

    const isCodeValid = verifySync({
      token: command.input.code,
      secret,
    }).valid;

    if (!isCodeValid) {
      throw new ApplicationError({ code: 'INVALID_TWO_FACTOR_CODE', status: HttpStatus.BAD_REQUEST });
    }

    // Verification successful, delete token
    await this.em.remove(verification).flush();

    return new UserProfileResponseDto(user);
  }
}
