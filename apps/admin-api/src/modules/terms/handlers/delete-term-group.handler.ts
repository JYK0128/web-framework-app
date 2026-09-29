import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteTermGroupCommand } from '#/modules/terms/commands';
import { DeleteTermGroupResponseDto } from '#/modules/terms/interfaces';

@Injectable()
@CommandHandler(DeleteTermGroupCommand)
export class DeleteTermGroupHandler implements ICommandHandler<DeleteTermGroupCommand, DeleteTermGroupResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteTermGroupCommand): Promise<DeleteTermGroupResponseDto> {
    const group = await this.em.findOne(TermGroup, { id: command.input.groupId }, { filters: false });
    if (!group || group.deletedAt) throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (await this.em.count(Term, { termGroup: group.id, publishedAt: { $lte: new Date() } }) > 0) {
      throw new ApplicationError({ code: 'TERM_GROUP_HAS_PUBLISHED_TERMS', status: HttpStatus.CONFLICT });
    }
    group.deletedAt = new Date();
    return DeleteTermGroupResponseDto.fromPlain({});
  }
}
