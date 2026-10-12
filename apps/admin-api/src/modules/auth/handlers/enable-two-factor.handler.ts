import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { decrypt } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { verifyTotp } from '#/core/auth/user/policy/totp.policy';
import { TwoFactor } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { env } from '#/env';
import { EnableTwoFactorCommand } from '#/modules/auth/commands';
import { EnableTwoFactorResponseDto } from '#/modules/auth/dto';
import { assertVerificationUnlocked, identifyUser } from '#/modules/auth/handlers/profile-security.helpers';

@Injectable()
@CommandHandler(EnableTwoFactorCommand)
export class EnableTwoFactorHandler implements ICommandHandler<EnableTwoFactorCommand, EnableTwoFactorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: EnableTwoFactorCommand): Promise<EnableTwoFactorResponseDto> {
    if (!SECURITY_CONFIG.twoFactor.enabled && !SECURITY_CONFIG.twoFactor.required) throw new ApplicationError({ code: 'TWO_FACTOR_DISABLED', status: HttpStatus.FORBIDDEN });
    const user = await identifyUser(this.em, this.principal);
    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (!twoFactor) throw new ApplicationError({ code: 'TWO_FACTOR_SETUP_REQUIRED', status: HttpStatus.BAD_REQUEST });
    assertVerificationUnlocked(twoFactor);
    if (!verifyTotp(decrypt(twoFactor.secret, env.TWO_FACTOR_ENCRYPTION_KEY), command.input.code)) {
      const now = new Date();
      const attempts = twoFactor.lockedUntil && twoFactor.lockedUntil.getTime() <= now.getTime()
        ? 1
        : (twoFactor.failedVerificationCount ?? 0) + 1;
      twoFactor.failedVerificationCount = attempts;
      twoFactor.lockedUntil = attempts >= SECURITY_CONFIG.lockout.maxFailureAttempts
        ? new Date(now.getTime() + TimeUtil.ms.minute(SECURITY_CONFIG.lockout.lockoutDurationMinutes))
        : null;
      await this.em.flush();
      throw new ApplicationError({ code: 'INVALID_TWO_FACTOR_CODE', status: HttpStatus.BAD_REQUEST });
    }
    twoFactor.verified = true;
    twoFactor.failedVerificationCount = 0;
    twoFactor.lockedUntil = null;
    user.twoFactorEnabled = true;
    return EnableTwoFactorResponseDto.parse({ enabled: true });
  }
}
