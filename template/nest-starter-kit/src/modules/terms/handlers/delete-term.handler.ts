import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteTermCommand } from '#/modules/terms/commands/delete-term.command';
import { DeleteTermResponseDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(DeleteTermCommand)
export class DeleteTermHandler implements ICommandHandler<DeleteTermCommand, DeleteTermResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: DeleteTermCommand): Promise<DeleteTermResponseDto> {
    const term = await this.identifyTerm(command.input.id);
    this.verify(term);

    return this.process(term, this.sessionContext.requiredUser.id);
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

  private verify(term: Term): void {
    this.verifyTermNotPublished(term);
  }

  private process(term: Term, currentUserId: string): DeleteTermResponseDto {
    term.deletedAt = new Date();
    term.deletedBy = currentUserId;

    return { ok: true };
  }
}
