import { LockMode } from '@mikro-orm/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { verifyTotp } from '@pkg/server-core/auth';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { PrincipalContext } from '@pkg/server-core/http/contexts';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { decrypt } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '~/app.config';
import { User } from '~/core/database/entities/auth';
import { TwoFactor } from '~/core/database/entities/auth.extensions';
import { env } from '~/env';
import { EnableTwoFactorCommand } from '~/modules/auth/two-factor/enable-two-factor.command';
import { EnableTwoFactorResponseDto } from '~/modules/auth/two-factor/enable-two-factor.response.dto';

@Injectable()
@CommandHandler(EnableTwoFactorCommand)
export class EnableTwoFactorHandler implements ICommandHandler<EnableTwoFactorCommand, EnableTwoFactorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: EnableTwoFactorCommand): Promise<EnableTwoFactorResponseDto> {
    if (!SECURITY_CONFIG.twoFactor.enabled && !SECURITY_CONFIG.twoFactor.required) throw new ApplicationError({ code: 'TWO_FACTOR_DISABLED', status: HttpStatus.FORBIDDEN });
    const result = await this.em.transactional(async (em) => {
      const user = await em.findOne(User, { id: this.principal.ensureUser().id }, { filters: false, refresh: true, lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!user) throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
      if (user.twoFactorEnabled) throw new ApplicationError({ code: 'TWO_FACTOR_ALREADY_ENABLED', status: HttpStatus.BAD_REQUEST });
      const twoFactor = await em.findOne(TwoFactor, { user: user.id }, { filters: false, refresh: true, lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!twoFactor) throw new ApplicationError({ code: 'TWO_FACTOR_SETUP_REQUIRED', status: HttpStatus.BAD_REQUEST });
      const now = new Date();
      if (twoFactor.isLockedAt(now)) throw new ApplicationError({ code: 'TWO_FACTOR_SETUP_LOCKED', status: HttpStatus.TOO_MANY_REQUESTS });
      if (!verifyTotp(decrypt(twoFactor.secret, env.TWO_FACTOR_ENCRYPTION_KEY), command.input.code, SECURITY_CONFIG.twoFactor)) {
        twoFactor.recordVerificationFailure(now, SECURITY_CONFIG.lockout.maxFailureAttempts, TimeUtil.ms.minute(SECURITY_CONFIG.lockout.lockoutDurationMinutes));
        // Return the error so the failed attempt commits before it is thrown.
        return new ApplicationError({ code: 'INVALID_TWO_FACTOR_CODE', status: HttpStatus.BAD_REQUEST });
      }
      twoFactor.verified = true;
      twoFactor.resetVerificationFailures();
      user.twoFactorEnabled = true;
      return null;
    });
    if (result) throw result;
    return EnableTwoFactorResponseDto.parse({ enabled: true });
  }
}
