import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { User } from '#/entities/auth/user.entity';
import { UserUnregisterCommand } from '#/modules/auth/commands/user-unregister.command';
import { UserUnregisterResponseDto } from '#/modules/auth/dto/user-unregister.response.dto';

@Injectable()
@CommandHandler(UserUnregisterCommand)
export class UserUnregisterHandler implements ICommandHandler<UserUnregisterCommand, UserUnregisterResponseDto> {
  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async execute(_command: UserUnregisterCommand): Promise<UserUnregisterResponseDto> {
    const clsUser = this.cls.get('user');
    if (!clsUser) {
      throw new ApplicationError({ code: 'UNAUTHORIZED', status: HttpStatus.BAD_REQUEST });
    }

    const user = await this.em.findOne(User, { id: clsUser.id });

    if (user) {
      await this.em.nativeDelete(User, { id: user.id });
    }

    return { ok: true };
  }
}
