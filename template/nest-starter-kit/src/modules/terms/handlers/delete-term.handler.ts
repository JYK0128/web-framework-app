import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { DeleteTermCommand } from '#/modules/terms/commands/delete-term.command';
import { AdminTermDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(DeleteTermCommand)
export class DeleteTermHandler implements ICommandHandler<DeleteTermCommand, AdminTermDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteTermCommand): Promise<AdminTermDto> {
    const term = await this.identifyTerm(command.id);
    this.verifyTermNotPublished(term);

    return this.process(term, command.currentUserId);
  }

  private async identifyTerm(id: string): Promise<Term> {
    const term = await this.em.findOne(Term, { id }, { populate: ['termGroup'], filters: false });
    if (!term || term.deletedAt) {
      throw new ApplicationError({ code: 'TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return term;
  }

  private verifyTermNotPublished(term: Term): void {
    if (term.isPublished) {
      throw new ApplicationError({ code: 'PUBLISHED_TERM_CANNOT_BE_DELETED', status: HttpStatus.CONFLICT });
    }
  }

  private process(term: Term, currentUserId: string): AdminTermDto {
    term.deletedAt = new Date();
    term.deletedBy = currentUserId;

    return new AdminTermDto(term);
  }
}
