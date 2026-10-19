import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { UnregisterCommand } from '#/modules/auth/account/unregister.command';
import { UnregisterResponseDto } from '#/modules/auth/account/unregister.response.dto';

@Injectable()
@CommandHandler(UnregisterCommand)
export class UnregisterHandler implements ICommandHandler<UnregisterCommand, UnregisterResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(): Promise<UnregisterResponseDto> {
    const user = await this.em.findOne(User, { id: this.principal.ensureUser().id }, { filters: false });
    if (!user) throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    user.deletedAt = new Date();
    return UnregisterResponseDto.ok();
  }
}
