import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { PublishTermCommand } from '#/modules/terms/commands/publish-term.command';
import { AdminTermDto } from '#/modules/terms/dto';

@Injectable()
@CommandHandler(PublishTermCommand)
export class PublishTermHandler implements ICommandHandler<PublishTermCommand, AdminTermDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: PublishTermCommand): Promise<AdminTermDto> {
    const term = await this.identifyTerm(command.input.id);
    this.verifyNotPublished(term);

    return this.process(term);
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
      throw new ApplicationError({ code: 'TERM_ALREADY_PUBLISHED', status: HttpStatus.BAD_REQUEST });
    }
  }

  private process(term: Term): AdminTermDto {
    term.publishedAt = new Date();
    return new AdminTermDto(term);
  }
}
