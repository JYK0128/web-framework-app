import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '~/core/database/entity-manager';
import { findServiceTerm } from '~/modules/service-term/document/internal-service-term-actions.helpers';
import { PublishInternalServiceTermCommand } from '~/modules/service-term/document/publish-internal-service-term.command';
import { PublishInternalServiceTermResponseDto } from '~/modules/service-term/document/publish-internal-service-term.response.dto';

@Injectable()
@CommandHandler(PublishInternalServiceTermCommand)
export class PublishInternalServiceTermHandler implements ICommandHandler<PublishInternalServiceTermCommand, PublishInternalServiceTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: PublishInternalServiceTermCommand): Promise<PublishInternalServiceTermResponseDto> {
    const term = await findServiceTerm(this.em, input.termId);
    if (term.isPublished) {
      throw new ApplicationError({ code: 'SERVICE_TERM_ALREADY_PUBLISHED', status: HttpStatus.CONFLICT });
    }
    term.publishedAt = new Date();
    return PublishInternalServiceTermResponseDto.parseEntity(term);
  }
}
