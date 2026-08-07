import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { DeferPasswordCommand } from '#/modules/auth/commands/defer-password.command';
import { DeferPasswordResponseDto } from '#/modules/auth/dto/defer-password.response.dto';

const CREDENTIAL_PROVIDER = 'credential';

@Injectable()
@CommandHandler(DeferPasswordCommand)
export class DeferPasswordHandler implements ICommandHandler<DeferPasswordCommand, DeferPasswordResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(_command: DeferPasswordCommand): Promise<DeferPasswordResponseDto> {
    const sessionUser = this.cls.get('user');
    if (!sessionUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const user = await this.em.findOne(User, { id: sessionUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const account = await this.em.findOne(Account, {
      user: user.id,
      accountId: user.id,
      providerId: CREDENTIAL_PROVIDER,
    });

    if (!account) {
      throw new ApplicationError({ code: 'PASSWORD_CHANGE_UNAVAILABLE', status: HttpStatus.BAD_REQUEST });
    }

    const deferredUntil = new Date();
    deferredUntil.setDate(deferredUntil.getDate() + 30);

    account.updateMetadata({
      passwordChangeDeferredUntil: deferredUntil,
    });

    await this.em.flush();
    return { ok: true };
  }
}
