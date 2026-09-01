import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionStore } from '#/common/stores/session.store';
import { TwoFactor } from '#/entities/auth.extentions/two-factor.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { ResetUserTwoFactorCommand } from '#/modules/users/commands/reset-user-two-factor.command';
import { ResetUserTwoFactorResponseDto } from '#/modules/users/dto';

@Injectable()
@CommandHandler(ResetUserTwoFactorCommand)
export class ResetUserTwoFactorHandler implements ICommandHandler<ResetUserTwoFactorCommand, ResetUserTwoFactorResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionStore: SessionStore,
  ) {}

  async execute(command: ResetUserTwoFactorCommand): Promise<ResetUserTwoFactorResponseDto> {
    const user = await this.identifyUser(command.input.id);
    this.verifyNotDeleted(user);
    const twoFactor = await this.identifyTwoFactor(user.id);

    return this.process(user, twoFactor);
  }

  private async identifyUser(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id }, { filters: false });
    if (!user) {
      throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return user;
  }

  private verifyNotDeleted(user: User): void {
    if (user.isDeleted) {
      throw new ApplicationError({ code: 'USER_DELETED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private async identifyTwoFactor(userId: string): Promise<TwoFactor | null> {
    return this.em.findOne(TwoFactor, { user: userId }, { filters: false });
  }

  private async process(user: User, twoFactor: TwoFactor | null): Promise<ResetUserTwoFactorResponseDto> {
    if (twoFactor) {
      this.em.remove(twoFactor);
    }
    user.twoFactorEnabled = false;
    await this.sessionStore.destroyAll(user.id);

    return { ok: true };
  }
}
