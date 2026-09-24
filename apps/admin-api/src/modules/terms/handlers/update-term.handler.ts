import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateTermCommand } from '#/modules/terms/commands';
import { AdminTermItemDto, UpdateTermResponseDto } from '#/modules/terms/interfaces';

@Injectable()
@CommandHandler(UpdateTermCommand)
export class UpdateTermHandler implements ICommandHandler<UpdateTermCommand, UpdateTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateTermCommand): Promise<UpdateTermResponseDto> {
    const term = await this.em.findOne(Term, { id: command.input.termId }, { populate: ['termGroup'] });
    if (!term || term.deletedAt) {
      throw new ApplicationError({ code: 'TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if (term.isPublished) {
      throw new ApplicationError({ code: 'PUBLISHED_TERM_CANNOT_BE_MODIFIED', status: HttpStatus.CONFLICT });
    }

    const data = command.input.data;
    if (data.version !== undefined && data.version.trim() !== term.version) {
      const duplicate = await this.em.findOne(Term, {
        termGroup: term.termGroup,
        version: data.version.trim(),
        id: { $ne: term.id },
      });
      if (duplicate) {
        throw new ApplicationError({ code: 'TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
      }
      term.version = data.version.trim();
    }
    if (data.content !== undefined) term.content = data.content.trim();
    if (data.reason !== undefined) term.reason = data.reason.trim();
    if (data.summary !== undefined) term.summary = data.summary.trim();
    if (data.isNoticeRequired !== undefined) term.isNoticeRequired = data.isNoticeRequired;
    if (data.publishedAt !== undefined) {
      const publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
      if (publishedAt && publishedAt <= new Date()) {
        throw new ApplicationError({ code: 'TERM_PUBLISH_DATE_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
      }
      term.publishedAt = publishedAt;
    }

    return UpdateTermResponseDto.fromPlain(AdminTermItemDto.from(term));
  }
}
