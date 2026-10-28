import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '~/core/database/entities/terms';
import { PublishTermCommand } from '~/modules/term/document/publish-term.command';
import { PublishTermResponseDto } from '~/modules/term/document/publish-term.response.dto';

@Injectable()
@CommandHandler(PublishTermCommand)
export class PublishTermHandler implements ICommandHandler<PublishTermCommand, PublishTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: PublishTermCommand): Promise<PublishTermResponseDto> {
    const term = await this.em.findOne(Term, { id: command.input.termId }, { populate: ['termGroup'] });
    if (!term || term.deletedAt) {
      throw new ApplicationError({ code: 'TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if (term.isPublished) {
      throw new ApplicationError({ code: 'TERM_ALREADY_PUBLISHED', status: HttpStatus.CONFLICT });
    }
    term.publishedAt = new Date();
    return PublishTermResponseDto.parseEntity(term);
  }
}
