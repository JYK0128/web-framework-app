import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { RequestContext } from '#/common/contexts/request.context';
import { TwoFactor } from '#/entities/auth.extentions/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { TurnOff2FACommand } from '#/modules/auth/commands/2fa-turn-off.command';

@Injectable()
@CommandHandler(TurnOff2FACommand)
export class TurnOff2FAHandler implements ICommandHandler<TurnOff2FACommand, void> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly requestContext: RequestContext,
  ) {}

  async execute(_command: TurnOff2FACommand): Promise<void> {
    const sessionUser = this.identifySessionUser();
    const twoFactor = await this.identifyTwoFactor(sessionUser.id);
    await this.process(sessionUser.id, twoFactor);
  }

  private identifySessionUser() {
    const sessionUser = this.requestContext.request?.session.user;
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
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
