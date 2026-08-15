import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { DeleteTermGroupCommand } from '#/modules/terms/commands/delete-term-group.command';
import { TermGroupItemDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(DeleteTermGroupCommand)
export class DeleteTermGroupHandler implements ICommandHandler<DeleteTermGroupCommand, TermGroupItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteTermGroupCommand): Promise<TermGroupItemDto> {
    const group = await this.identify(command.id);
    const termCount = await this.identifyTermCount(group.id);
    this.verifyNoTerms(termCount);

    return this.process(group, command.currentUserId);
  }

  private async identify(id: string): Promise<TermGroup> {
    const group = await this.em.findOne(TermGroup, { id }, { filters: false });
    if (!group || group.deletedAt) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return group;
  }

  private async identifyTermCount(groupId: string): Promise<number> {
    return this.em.count(Term, { termGroup: groupId }, { filters: false });
  }

  private verifyNoTerms(termCount: number): void {
    if (termCount > 0) {
      throw new ApplicationError({ code: 'TERM_GROUP_HAS_TERMS', status: HttpStatus.CONFLICT });
    }
  }

  private process(group: TermGroup, currentUserId: string): TermGroupItemDto {
    group.deletedAt = new Date();
    group.deletedBy = currentUserId;

    return new TermGroupItemDto(group);
  }
}
