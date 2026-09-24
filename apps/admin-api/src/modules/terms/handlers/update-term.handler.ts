import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '#/entities/terms/term.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateTermCommand } from '#/modules/terms/commands';
import { OperatorTermItemDto, UpdateTermResponseDto } from '#/modules/terms/interfaces';

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

    await updateVersion(this.em, term, command.input.data.version);
    updateTextFields(term, command.input.data);
    updateNoticeRequirement(term, command.input.data.isNoticeRequired);
    updatePublishedAt(term, command.input.data.publishedAt);

    return UpdateTermResponseDto.fromPlain(OperatorTermItemDto.from(term));
  }
}

async function updateVersion(em: AppEntityManager, term: Term, version?: string): Promise<void> {
  if (version === undefined || version.trim() === term.version) return;

  const normalizedVersion = version.trim();
  const duplicate = await em.findOne(Term, {
    termGroup: term.termGroup,
    version: normalizedVersion,
    id: { $ne: term.id },
  });
  if (duplicate) {
    throw new ApplicationError({ code: 'TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
  }
  term.version = normalizedVersion;
}

function updateTextFields(term: Term, data: UpdateTermCommand['input']['data']): void {
  if (data.content !== undefined) term.content = data.content.trim();
  if (data.reason !== undefined) term.reason = data.reason.trim();
  if (data.summary !== undefined) term.summary = data.summary.trim();
}

function updateNoticeRequirement(term: Term, isNoticeRequired?: boolean): void {
  if (isNoticeRequired !== undefined) term.isNoticeRequired = isNoticeRequired;
}

function updatePublishedAt(term: Term, publishedAtValue?: string | null): void {
  if (publishedAtValue === undefined) return;

  const publishedAt = publishedAtValue ? new Date(publishedAtValue) : null;
  if (publishedAt && publishedAt <= new Date()) {
    throw new ApplicationError({ code: 'TERM_PUBLISH_DATE_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
  }
  term.publishedAt = publishedAt;
}
