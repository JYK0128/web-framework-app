import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateTermGroupCommand } from '#/modules/terms/commands';
import { UpdateTermGroupResponseDto, UserTermGroupItemDto } from '#/modules/terms/interfaces';

@Injectable()
@CommandHandler(UpdateTermGroupCommand)
export class UpdateTermGroupHandler implements ICommandHandler<UpdateTermGroupCommand, UpdateTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateTermGroupCommand): Promise<UpdateTermGroupResponseDto> {
    const group = await this.em.findOne(TermGroup, { id: command.input.groupId }, { filters: false });
    if (!group || group.deletedAt) throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    const data = command.input.data;
    if (data.code !== undefined && data.code.trim() !== group.code) {
      const duplicate = await this.em.findOne(TermGroup, { code: data.code.trim(), id: { $ne: group.id } });
      if (duplicate) throw new ApplicationError({ code: 'TERM_GROUP_CODE_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
      group.code = data.code.trim();
    }
    if (data.title !== undefined) group.title = data.title.trim();
    if (data.isRequired !== undefined) group.isRequired = data.isRequired;
    if (data.sortOrder !== undefined) group.sortOrder = data.sortOrder;
    return UpdateTermGroupResponseDto.fromPlain(UserTermGroupItemDto.from(group));
  }
}
