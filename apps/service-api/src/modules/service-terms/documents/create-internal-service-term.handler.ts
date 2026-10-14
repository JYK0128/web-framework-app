import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term, TermGroup } from '#/core/database/entities/terms';
import { AppEntityManager } from '#/core/database/entity-manager';
import { CreateInternalServiceTermCommand } from '#/modules/service-terms/documents/create-internal-service-term.command';
import { CreateInternalServiceTermResponseDto } from '#/modules/service-terms/documents/create-internal-service-term.response.dto';
import { assertVersionAvailable, flushServiceTerm, parseFuturePublishDate } from '#/modules/service-terms/documents/internal-service-term-actions.helpers';

@Injectable()
@CommandHandler(CreateInternalServiceTermCommand)
export class CreateInternalServiceTermHandler implements ICommandHandler<CreateInternalServiceTermCommand, CreateInternalServiceTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: CreateInternalServiceTermCommand): Promise<CreateInternalServiceTermResponseDto> {
    const group = await this.em.findOne(TermGroup, { id: input.groupId });
    if (!group) {
      throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    await assertVersionAvailable(this.em, group, input.version);
    const publishedAt = parseFuturePublishDate(input.publishedAt);
    const term = this.em.create(Term, {
      termGroup: group,
      version: input.version.trim(),
      content: input.content.trim(),
      reason: input.reason.trim(),
      summary: input.summary.trim(),
      isNoticeRequired: input.isNoticeRequired,
      publishedAt,
      metadata: input.metadata ? { options: input.metadata.options ?? {} } : null,
    });
    this.em.persist(term);
    await flushServiceTerm(this.em);
    return CreateInternalServiceTermResponseDto.parseEntity(term);
  }
}
