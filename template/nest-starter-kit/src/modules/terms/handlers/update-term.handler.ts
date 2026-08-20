import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { UpdateTermCommand } from '#/modules/terms/commands/update-term.command';
import { AdminTermDto, UpdateTermRequestDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(UpdateTermCommand)
export class UpdateTermHandler implements ICommandHandler<UpdateTermCommand, AdminTermDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateTermCommand): Promise<AdminTermDto> {
    const term = await this.identifyTerm(command.id);
    this.verifyNotPublished(term);

    return this.process(term, command.input);
  }

  private async identifyTerm(id: string): Promise<Term> {
    const term = await this.em.findOne(Term, { id }, { populate: ['termGroup'], filters: false });
    if (!term || term.deletedAt) {
      throw new ApplicationError({ code: 'TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return term;
  }

  private verifyNotPublished(term: Term): void {
    if (term.isPublished) {
      throw new ApplicationError({ code: 'PUBLISHED_TERM_CANNOT_BE_MODIFIED', status: HttpStatus.CONFLICT });
    }
  }

  private process(term: Term, input: UpdateTermRequestDto): AdminTermDto {
    if (input.version !== undefined) term.version = input.version.trim();
    if (input.content !== undefined) term.content = input.content.trim();
    if (input.publishedAt !== undefined) term.publishedAt = input.publishedAt;

    return new AdminTermDto(term);
  }
}
