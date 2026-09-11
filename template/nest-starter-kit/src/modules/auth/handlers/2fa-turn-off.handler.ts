import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { SystemContext } from '#/common/contexts/system.context';
import { RoleKey } from '#/entities/auth.extensions/role.entity';
import { TwoFactor } from '#/entities/auth.extensions/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { TurnOff2FACommand } from '#/modules/auth/commands/2fa-turn-off.command';

@Injectable()
@CommandHandler(TurnOff2FACommand)
export class TurnOff2FAHandler implements ICommandHandler<TurnOff2FACommand, void> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly systemContext: SystemContext,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(_command: TurnOff2FACommand): Promise<void> {
    const sessionUser = this.identifySessionUser();
    const twoFactor = await this.identifyTwoFactor(sessionUser.id);
    await this.verify(sessionUser);
    await this.process(sessionUser.id, twoFactor);
  }

  private async verifyPolicy(sessionUser: { role?: string | null }): Promise<void> {
    if (sessionUser.role === RoleKey.ADMIN) {
      const twoFactorPolicy = await this.systemContext.getTwoFactorPolicy();
      if (twoFactorPolicy.enforceAdmin2FA) {
        throw new ApplicationError({ code: 'ADMIN_2FA_ENFORCED', status: HttpStatus.FORBIDDEN });
      }
    }
  }

  private async verify(sessionUser: { role?: string | null }): Promise<void> {
    await this.verifyPolicy(sessionUser);
  }

  private identifySessionUser() {
    const sessionUser = this.sessionContext.requiredUser;
    if (!sessionUser.twoFactorEnabled) {
      throw new ApplicationError({ code: 'TWO_FACTOR_NOT_ENABLED', status: HttpStatus.BAD_REQUEST });
    }
    return sessionUser;
  }

  private async identifyTwoFactor(userId: string): Promise<TwoFactor | null> {
    return this.em.findOne(TwoFactor, { user: userId });
  }

  private async process(userId: string, twoFactor: TwoFactor | null): Promise<void> {
    if (twoFactor) {
      this.em.remove(twoFactor);
    }
    const user = this.em.getReference(User, userId);
    user.twoFactorEnabled = false;
  }
}
