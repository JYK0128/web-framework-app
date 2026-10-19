import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { TermGroup } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { UpdateInternalServiceTermGroupCommand } from '#/modules/service-term/group/update-internal-service-term-group.command';
import { UpdateInternalServiceTermGroupResponseDto } from '#/modules/service-term/group/update-internal-service-term-group.response.dto';

@Injectable()
@CommandHandler(UpdateInternalServiceTermGroupCommand)
export class UpdateInternalServiceTermGroupHandler implements ICommandHandler<UpdateInternalServiceTermGroupCommand, UpdateInternalServiceTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: UpdateInternalServiceTermGroupCommand): Promise<UpdateInternalServiceTermGroupResponseDto> {
    const group = await this.em.findOne(TermGroup, { id: input.groupId }, { filters: false });
    if (!group || group.deletedAt) throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (input.dto.title !== undefined) group.title = input.dto.title.trim();
    if (input.dto.isRequired !== undefined) group.isRequired = input.dto.isRequired;
    if (input.dto.sortOrder !== undefined) group.sortOrder = input.dto.sortOrder;
    return UpdateInternalServiceTermGroupResponseDto.parseEntity(group);
  }
}
