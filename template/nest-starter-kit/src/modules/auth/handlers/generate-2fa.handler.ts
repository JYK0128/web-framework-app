import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { generateSecret, generateURI } from 'otplib';
import { toDataURL } from 'qrcode';

import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { Generate2FACommand } from '#/modules/auth/commands/generate-2fa.command';

@Injectable()
@CommandHandler(Generate2FACommand)
export class Generate2FAHandler implements ICommandHandler<Generate2FACommand, { qrCodeUrl: string }> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: Generate2FACommand): Promise<{ qrCodeUrl: string }> {
    const user = await this.em.findOne(User, { id: command.user.id });
    if (!user) {
      throw new BadRequestException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (user.isTwoFactorAuthEnabled) {
      throw new BadRequestException({ code: 'TWO_FACTOR_ALREADY_ENABLED', message: '2FA is already enabled' });
    }

    const secret = generateSecret();
    user.twoFactorAuthSecret = secret;

    // Save the secret, but isTwoFactorAuthEnabled remains false until TurnOn2FA is successful
    await this.em.flush();

    const otpauthUrl = generateURI({
      issuer: env.APP_NAME || 'AntigravityApp',
      label: user.email,
      secret,
    });
    const qrCodeUrl = await toDataURL(otpauthUrl);

    return { qrCodeUrl };
  }
}
