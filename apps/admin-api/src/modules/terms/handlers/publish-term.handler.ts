import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { PublishTermCommand } from '#/modules/terms/commands';
import { OperatorTermItemDto, PublishTermResponseDto } from '#/modules/terms/interfaces';

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
    return PublishTermResponseDto.fromPlain(OperatorTermItemDto.from(term));
  }
}
