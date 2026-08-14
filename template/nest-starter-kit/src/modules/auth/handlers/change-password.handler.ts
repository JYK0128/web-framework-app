import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hash, verify } from '@pkg/shared/server';
import { ClsService } from 'nestjs-cls';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { ChangePasswordCommand } from '#/modules/auth/commands/change-password.command';
import { PASSWORD_HISTORY_LIMIT } from '#/modules/auth/constants/auth-policy.constants';
import { ChangePasswordResponseDto } from '#/modules/auth/dto/change-password.response.dto';

const CREDENTIAL_PROVIDER = 'credential';

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand, ChangePasswordResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<ChangePasswordResponseDto> {
    const currentUser = this.cls.get('user');
    if (!currentUser) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const { currentPassword, newPassword } = command.input;
    const user = await this.em.findOne(User, { id: currentUser.id });
    if (!user) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const account = await this.em.findOne(Account, {
      user: user.id,
      accountId: user.id,
      providerId: CREDENTIAL_PROVIDER,
    });

    if (!account || !account.password) {
      throw new ApplicationError({ code: 'INVALID_CURRENT_PASSWORD', status: HttpStatus.BAD_REQUEST });
    }

    const isValid = await verify(currentPassword, account.password);
    if (!isValid) {
      throw new ApplicationError({ code: 'INVALID_CURRENT_PASSWORD', status: HttpStatus.BAD_REQUEST });
    }

    const history: string[] = account.metadata?.passwordHistory || [];
    const passwordListToCheck = Array.from(new Set([account.password, ...history]));

    for (const oldHash of passwordListToCheck) {
      if (oldHash && (await verify(newPassword, oldHash))) {
        throw new ApplicationError({ code: 'PASSWORD_REUSED', status: HttpStatus.BAD_REQUEST });
      }
    }

    const newHashedPassword = await hash(newPassword);
    const updatedHistory = [newHashedPassword, ...passwordListToCheck].slice(0, PASSWORD_HISTORY_LIMIT);

    account.password = newHashedPassword;
    account.updateMetadata({
      passwordUpdatedAt: new Date(),
      passwordChangeDeferredUntil: null,
      passwordHistory: updatedHistory,
    });

    await this.em.flush();
    return { ok: true };
  }
}
