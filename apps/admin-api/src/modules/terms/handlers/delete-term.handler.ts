import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteTermCommand } from '#/modules/terms/commands';
import { DeleteTermResponseDto } from '#/modules/terms/interfaces';

@Injectable()
@CommandHandler(DeleteTermCommand)
export class DeleteTermHandler implements ICommandHandler<DeleteTermCommand, DeleteTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteTermCommand): Promise<DeleteTermResponseDto> {
    const term = await this.em.findOne(Term, { id: command.input.termId }, { filters: false });
    if (!term || term.deletedAt) {
      throw new ApplicationError({ code: 'TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if (term.isPublished) {
      throw new ApplicationError({ code: 'PUBLISHED_TERM_CANNOT_BE_DELETED', status: HttpStatus.CONFLICT });
    }
    term.deletedAt = new Date();
    return DeleteTermResponseDto.fromPlain({});
  }
}
