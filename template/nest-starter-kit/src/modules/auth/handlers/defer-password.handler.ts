import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { AppEntityManager } from '#/database/entity-manager';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { DeferPasswordCommand } from '#/modules/auth/commands/defer-password.command';
import { PASSWORD_CHANGE_DEFER_DAYS } from '#/modules/auth/constants/auth-policy.constants';
import { DeferPasswordResponseDto } from '#/modules/auth/dto/defer-password.response.dto';

const CREDENTIAL_PROVIDER = 'credential';

@Injectable()
@CommandHandler(DeferPasswordCommand)
export class DeferPasswordHandler implements ICommandHandler<DeferPasswordCommand, DeferPasswordResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(_command: DeferPasswordCommand): Promise<DeferPasswordResponseDto> {
    const user = await this.identifyUser();
    const account = await this.identifyAccount(user.id);

    return this.process(account);
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

  private async identifyAccount(userId: string): Promise<Account> {
    const account = await this.em.findOne(Account, {
      user: userId,
      accountId: userId,
      providerId: CREDENTIAL_PROVIDER,
    });

    if (!account) {
      throw new ApplicationError({ code: 'PASSWORD_CHANGE_UNAVAILABLE', status: HttpStatus.BAD_REQUEST });
    }

    return account;
  }

  private async process(account: Account): Promise<DeferPasswordResponseDto> {
    const deferredUntil = new Date();
    deferredUntil.setDate(deferredUntil.getDate() + PASSWORD_CHANGE_DEFER_DAYS);

    account.updateMetadata({
      passwordChangeDeferredUntil: deferredUntil,
    });

    return { ok: true };
  }
}
