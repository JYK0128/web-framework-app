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
    const term = await this.identify(command.id);
    return this.process(term);
  }

  private async identify(id: string): Promise<Term> {
    const term = await this.em.findOne(Term, { id }, { populate: ['termGroup'], filters: false });
    if (!term || term.deletedAt) {
      throw new ApplicationError({ code: 'TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return term;
  }

  private process(term: Term): AdminTermDto {
    term.publishedAt = new Date();
    return new AdminTermDto(term);
  }
}
