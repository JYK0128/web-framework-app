import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';
import { generateSecret, generateURI } from 'otplib';
import { toDataURL } from 'qrcode';

import { AppEntityManager } from '#/database/entity-manager';
import { TwoFactor } from '#/entities/auth.extentions/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { Generate2FACommand } from '#/modules/auth/commands/2fa-generate.command';
import { TwoFactorGenerateResponseDto } from '#/modules/auth/dto/2fa-generate.response.dto';

@Injectable()
@CommandHandler(Generate2FACommand)
export class Generate2FAHandler implements ICommandHandler<Generate2FACommand, TwoFactorGenerateResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(_command: Generate2FACommand): Promise<TwoFactorGenerateResponseDto> {
    const user = await this.identifyUser();
    this.verifyNotEnabled(user);

    const twoFactor = await this.identifyTwoFactor(user.id);
    return this.process(user, twoFactor);
  }

  private async identifyUser(): Promise<User> {
    const sessionUser = this.cls.get('user');
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: sessionUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    return user;
  }

  private verifyNotEnabled(user: User): void {
    if (user.twoFactorEnabled) {
      throw new ApplicationError({ code: 'TWO_FACTOR_ALREADY_ENABLED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async identifyTwoFactor(userId: string): Promise<TwoFactor | null> {
    return this.em.findOne(TwoFactor, { user: userId });
  }

  private async process(user: User, existingConfig: TwoFactor | null): Promise<TwoFactorGenerateResponseDto> {
    const secret = generateSecret();
    const uri = generateURI({ label: user.email, issuer: env.APP_NAME, secret });
    const url = await toDataURL(uri);

    if (existingConfig) {
      existingConfig.secret = secret;
      existingConfig.verified = false;
      existingConfig.failedVerificationCount = 0;
      existingConfig.lockedUntil = null;
    }
    else {
      const twoFactor = this.em.create(TwoFactor, {
        user,
        secret,
        verified: false,
      });
      this.em.persist(twoFactor);
    }

    return { url };
  }
}
