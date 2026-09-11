import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt } from '@pkg/shared/server';
import { generateSecret } from 'otplib';

import { SessionContext } from '#/common/contexts/session.context';
import { SystemContext } from '#/common/contexts/system.context';
import { RoleKey } from '#/entities/auth.extensions/role.entity';
import { TwoFactor } from '#/entities/auth.extensions/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { Generate2FACommand } from '#/modules/auth/commands/2fa-generate.command';
import { TwoFactorGenerateResponseDto } from '#/modules/auth/dto/2fa-generate.response.dto';

@Injectable()
@CommandHandler(Generate2FACommand)
export class Generate2FAHandler implements ICommandHandler<Generate2FACommand, TwoFactorGenerateResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly systemContext: SystemContext,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(_command: Generate2FACommand): Promise<TwoFactorGenerateResponseDto> {
    const sessionUser = this.identifySessionUser();
    const twoFactor = await this.identifyTwoFactor(sessionUser.id);
    await this.verify(sessionUser);
    return this.process(sessionUser.id, twoFactor);
  }

  private async verifyPolicy(sessionUser: { role?: string | null }): Promise<void> {
    if (sessionUser.role !== RoleKey.ADMIN) {
      const twoFactorPolicy = await this.systemContext.getTwoFactorPolicy();
      if (!twoFactorPolicy.allowUser2FA) {
        throw new ApplicationError({ code: 'TWO_FACTOR_NOT_ALLOWED', status: HttpStatus.FORBIDDEN });
      }
    }
  }

  private async verify(sessionUser: { role?: string | null }): Promise<void> {
    await this.verifyPolicy(sessionUser);
  }

  private identifySessionUser() {
    const sessionUser = this.sessionContext.requiredUser;
    if (sessionUser.twoFactorEnabled) {
      throw new ApplicationError({ code: 'TWO_FACTOR_ALREADY_ENABLED', status: HttpStatus.BAD_REQUEST });
    }
    return sessionUser;
  }

  private async identifyTwoFactor(userId: string): Promise<TwoFactor | null> {
    return this.em.findOne(TwoFactor, { user: userId });
  }

  private async process(userId: string, existingConfig: TwoFactor | null): Promise<TwoFactorGenerateResponseDto> {
    const secret = generateSecret();

    if (existingConfig) {
      existingConfig.secret = encrypt(secret, env.APP_SECRET);
      existingConfig.verified = false;
      existingConfig.failedVerificationCount = 0;
      existingConfig.lockedUntil = null;
    }
    else {
      const twoFactor = this.em.create(TwoFactor, {
        user: this.em.getReference(User, userId),
        secret: encrypt(secret, env.APP_SECRET),
        verified: false,
      });
      this.em.persist(twoFactor);
    }

    return { secret };
  }
}
