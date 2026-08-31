import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateTermGroupCommand } from '#/modules/terms/commands/update-term-group.command';
import { UpdateTermGroupRequestDto, UpdateTermGroupResponseDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(UpdateTermGroupCommand)
export class UpdateTermGroupHandler implements ICommandHandler<UpdateTermGroupCommand, UpdateTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateTermGroupCommand): Promise<UpdateTermGroupResponseDto> {
    const group = await this.identifyGroup(command.input.id);
    return this.process(group, command.input.input);
  }

  private async identifyGroup(id: string): Promise<TermGroup> {
    const group = await this.em.findOne(TermGroup, { id }, { filters: false });
    if (!group || group.deletedAt) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return group;
  }

  private process(group: TermGroup, input: UpdateTermGroupRequestDto): UpdateTermGroupResponseDto {
    if (input.code !== undefined) group.code = input.code.trim();
    if (input.title !== undefined) group.title = input.title.trim();
    if (input.isRequired !== undefined) group.isRequired = input.isRequired;
    if (input.sortOrder !== undefined) group.sortOrder = input.sortOrder;

    return new UpdateTermGroupResponseDto(group);
  }
}
