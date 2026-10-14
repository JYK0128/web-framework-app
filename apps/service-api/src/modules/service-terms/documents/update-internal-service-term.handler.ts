import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/core/database/entity-manager';
import { assertEditable, assertVersionAvailable, findServiceTerm, flushServiceTerm, parseFuturePublishDate } from '#/modules/service-terms/documents/internal-service-term-actions.helpers';
import { UpdateInternalServiceTermCommand } from '#/modules/service-terms/documents/update-internal-service-term.command';
import { UpdateInternalServiceTermResponseDto } from '#/modules/service-terms/documents/update-internal-service-term.response.dto';

@Injectable()
@CommandHandler(UpdateInternalServiceTermCommand)
export class UpdateInternalServiceTermHandler implements ICommandHandler<UpdateInternalServiceTermCommand, UpdateInternalServiceTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: UpdateInternalServiceTermCommand): Promise<UpdateInternalServiceTermResponseDto> {
    const term = await findServiceTerm(this.em, input.termId);
    assertEditable(term);
    if (input.dto.groupId !== undefined && input.dto.groupId !== term.termGroup.id) {
      throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_MISMATCH', status: HttpStatus.BAD_REQUEST });
    }
    if (input.dto.version !== undefined) await assertVersionAvailable(this.em, term.termGroup, input.dto.version, term.id);
    const publishedAt = parseFuturePublishDate(input.dto.publishedAt);
    if (input.dto.version !== undefined) term.version = input.dto.version.trim();
    if (input.dto.content !== undefined) term.content = input.dto.content.trim();
    if (input.dto.reason !== undefined) term.reason = input.dto.reason.trim();
    if (input.dto.summary !== undefined) term.summary = input.dto.summary.trim();
    if (input.dto.isNoticeRequired !== undefined) term.isNoticeRequired = input.dto.isNoticeRequired;
    if (input.dto.metadata !== undefined) term.metadata = input.dto.metadata ? { options: input.dto.metadata.options ?? {} } : null;
    if (input.dto.publishedAt !== undefined) term.publishedAt = publishedAt;
    await flushServiceTerm(this.em);
    return UpdateInternalServiceTermResponseDto.parseEntity(term);
  }
}
