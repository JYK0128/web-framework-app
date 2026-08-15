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
    const group = await this.identify(command.id);
    const code = command.input.code?.trim() ?? group.code;
    const duplicate = await this.identifyDuplicate(code, group.id);
    this.verifyNotDuplicate(duplicate);

    return this.process(group, code, command.input);
  }

  private async identify(id: string): Promise<TermGroup> {
    const group = await this.em.findOne(TermGroup, { id }, { filters: false });
    if (!group || group.deletedAt) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return group;
  }

  private async identifyDuplicate(code: string, currentId: string): Promise<TermGroup | null> {
    return this.em.findOne(TermGroup, { code, id: { $ne: currentId } }, { filters: false });
  }

  private verifyNotDuplicate(duplicate: TermGroup | null): void {
    if (duplicate) {
      throw new ApplicationError({ code: 'TERM_GROUP_CODE_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }
  }

  private process(group: TermGroup, code: string, input: UpdateTermGroupRequestDto): TermGroupItemDto {
    group.code = code;
    if (input.title !== undefined) group.title = input.title.trim();
    if (input.isRequired !== undefined) group.isRequired = input.isRequired;
    if (input.sortOrder !== undefined) group.sortOrder = input.sortOrder;

    return new TermGroupItemDto(group);
  }
}
