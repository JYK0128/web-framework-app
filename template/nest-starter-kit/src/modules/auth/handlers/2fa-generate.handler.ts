import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';
import { generateSecret, generateURI } from 'otplib';
import { toDataURL } from 'qrcode';

import { TwoFactor } from '#/entities/auth/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { Generate2FACommand } from '#/modules/auth/commands/2fa-generate.command';
import { TwoFactorGenerateResponseDto } from '#/modules/auth/dto/2fa-generate.response.dto';

@Injectable()
@CommandHandler(Generate2FACommand)
export class Generate2FAHandler implements ICommandHandler<Generate2FACommand, TwoFactorGenerateResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(_command: Generate2FACommand): Promise<TwoFactorGenerateResponseDto> {
    const clsUser = this.cls.get('user');
    if (!clsUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: clsUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    if (user.twoFactorEnabled) {
      throw new ApplicationError({ code: 'TWO_FACTOR_ALREADY_ENABLED', status: HttpStatus.BAD_REQUEST });
    }

    const secret = generateSecret();

    // Check if a secret already exists
    let twoFactor = await this.em.findOne(TwoFactor, { user: user.id });
    if (!twoFactor) {
      twoFactor = this.em.create(TwoFactor, { user: user.id, secret });
      this.em.persist(twoFactor);
    }
    else {
      twoFactor.secret = secret;
    }

    // Save the secret, but twoFactorEnabled remains false until TurnOn2FA is successful
    await this.em.flush();

    const otpauthUrl = generateURI({
      issuer: env.APP_NAME,
      label: user.email,
      secret,
    });
    const url = await toDataURL(otpauthUrl);

    return { url };
  }
}
