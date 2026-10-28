import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { ApplicationError } from '@pkg/shared/common';

import { Term, TermGroup } from '~/core/database/entities/terms';
import { CreateTermCommand } from '~/modules/term/document/create-term.command';
import { CreateTermResponseDto } from '~/modules/term/document/create-term.response.dto';

@Injectable()
@CommandHandler(CreateTermCommand)
export class CreateTermHandler implements ICommandHandler<CreateTermCommand, CreateTermResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: CreateTermCommand): Promise<CreateTermResponseDto> {
    const input = command.input;
    const group = await this.em.findOne(TermGroup, { id: input.termGroupId });
    if (!group) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    const duplicate = await this.em.findOne(Term, { termGroup: group, version: input.version.trim() });
    if (duplicate) {
      throw new ApplicationError({ code: 'TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }

    const publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    if (publishedAt && publishedAt <= new Date()) {
      throw new ApplicationError({ code: 'TERM_PUBLISH_DATE_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
    }

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
    try {
      await this.em.flush();
    }
    catch (error) {
      if (error instanceof UniqueConstraintViolationException && error.message.includes('term_group_version_active_unique')) {
        throw ApplicationError.from(error, { code: 'TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
      }
      throw error;
    }
    return CreateTermResponseDto.parseEntity(term);
  }
}
