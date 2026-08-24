import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { generateSecret } from 'otplib';

import { RequestContext } from '#/common/contexts/request.context';
import { TwoFactor } from '#/entities/auth.extentions/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { Generate2FACommand } from '#/modules/auth/commands/2fa-generate.command';
import { TwoFactorGenerateResponseDto } from '#/modules/auth/dto/2fa-generate.response.dto';

@Injectable()
@CommandHandler(Generate2FACommand)
export class Generate2FAHandler implements ICommandHandler<Generate2FACommand, TwoFactorGenerateResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
  ) {}

  async execute(_command: Generate2FACommand): Promise<TwoFactorGenerateResponseDto> {
    const sessionUser = this.identifySessionUser();
    const twoFactor = await this.identifyTwoFactor(sessionUser.id);
    return this.process(sessionUser.id, twoFactor);
  }

  private identifySessionUser() {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
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
      existingConfig.secret = secret;
      existingConfig.verified = false;
      existingConfig.failedVerificationCount = 0;
      existingConfig.lockedUntil = null;
    }
    else {
      const twoFactor = this.em.create(TwoFactor, {
        user: this.em.getReference(User, userId),
        secret,
        verified: false,
      });
      this.em.persist(twoFactor);
    }

    return { secret };
  }
}
