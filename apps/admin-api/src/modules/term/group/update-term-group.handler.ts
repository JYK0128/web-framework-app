import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { TermGroup } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { UpdateTermGroupCommand } from '#/modules/term/group/update-term-group.command';
import { UpdateTermGroupResponseDto } from '#/modules/term/group/update-term-group.response.dto';

@Injectable()
@CommandHandler(UpdateTermGroupCommand)
export class UpdateTermGroupHandler implements ICommandHandler<UpdateTermGroupCommand, UpdateTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateTermGroupCommand): Promise<UpdateTermGroupResponseDto> {
    const group = await this.em.findOne(TermGroup, { id: command.input.groupId }, { filters: false });
    if (!group || group.deletedAt) throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    const data = command.input.data;
    if (data.title !== undefined) group.title = data.title.trim();
    if (data.isRequired !== undefined) group.isRequired = data.isRequired;
    if (data.sortOrder !== undefined) group.sortOrder = data.sortOrder;
    return UpdateTermGroupResponseDto.parseEntity(group);
  }
}
