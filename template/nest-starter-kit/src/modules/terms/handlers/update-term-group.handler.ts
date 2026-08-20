import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { UpdateTermGroupCommand } from '#/modules/terms/commands/update-term-group.command';
import { TermGroupItemDto, UpdateTermGroupRequestDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(UpdateTermGroupCommand)
export class UpdateTermGroupHandler implements ICommandHandler<UpdateTermGroupCommand, TermGroupItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateTermGroupCommand): Promise<TermGroupItemDto> {
    const group = await this.identifyGroup(command.id);
    return this.process(group, command.input);
  }

  private async identifyGroup(id: string): Promise<TermGroup> {
    const group = await this.em.findOne(TermGroup, { id }, { filters: false });
    if (!group || group.deletedAt) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return group;
  }

  private process(group: TermGroup, input: UpdateTermGroupRequestDto): TermGroupItemDto {
    if (input.code !== undefined) group.code = input.code.trim();
    if (input.title !== undefined) group.title = input.title.trim();
    if (input.isRequired !== undefined) group.isRequired = input.isRequired;
    if (input.sortOrder !== undefined) group.sortOrder = input.sortOrder;

    return new TermGroupItemDto(group);
  }
}
