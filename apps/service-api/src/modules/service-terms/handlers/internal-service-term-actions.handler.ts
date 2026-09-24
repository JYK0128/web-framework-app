import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateInternalServiceTermCommand, DeleteInternalServiceTermCommand, PublishInternalServiceTermCommand, UpdateInternalServiceTermCommand } from '#/modules/service-terms/commands';
import { InternalServiceTermItemDto } from '#/modules/service-terms/dto';

import { toInternalServiceTerm } from './get-internal-service-terms.handler';

@Injectable()
@CommandHandler(CreateInternalServiceTermCommand)
export class CreateInternalServiceTermHandler implements ICommandHandler<CreateInternalServiceTermCommand, InternalServiceTermItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: CreateInternalServiceTermCommand): Promise<InternalServiceTermItemDto> {
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
    });
    this.em.persist(term);
    return toInternalServiceTerm(term);
  }
}

@Injectable()
@CommandHandler(UpdateInternalServiceTermCommand)
export class UpdateInternalServiceTermHandler implements ICommandHandler<UpdateInternalServiceTermCommand, InternalServiceTermItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: UpdateInternalServiceTermCommand): Promise<InternalServiceTermItemDto> {
    const term = await findServiceTerm(this.em, input.termId);
    assertEditable(term, '게시된 서비스 약관은 수정할 수 없습니다.');
    if (input.dto.groupId !== term.termGroup.id) {
      throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_MISMATCH', status: HttpStatus.BAD_REQUEST });
    }
    await assertVersionAvailable(this.em, term.termGroup, input.dto.version, term.id);
    const publishedAt = parseFuturePublishDate(input.dto.publishedAt);
    term.version = input.dto.version.trim();
    term.content = input.dto.content.trim();
    term.reason = input.dto.reason.trim();
    term.summary = input.dto.summary.trim();
    term.isNoticeRequired = input.dto.isNoticeRequired;
    if (input.dto.publishedAt !== undefined) term.publishedAt = publishedAt;
    return toInternalServiceTerm(term);
  }
}

@Injectable()
@CommandHandler(DeleteInternalServiceTermCommand)
export class DeleteInternalServiceTermHandler implements ICommandHandler<DeleteInternalServiceTermCommand, { success: boolean }> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ termId }: DeleteInternalServiceTermCommand): Promise<{ success: boolean }> {
    const term = await findServiceTerm(this.em, termId);
    assertEditable(term, '게시된 서비스 약관은 삭제할 수 없습니다.');
    term.deletedAt = new Date();
    return { success: true };
  }
}

@Injectable()
@CommandHandler(PublishInternalServiceTermCommand)
export class PublishInternalServiceTermHandler implements ICommandHandler<PublishInternalServiceTermCommand, InternalServiceTermItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ termId }: PublishInternalServiceTermCommand): Promise<InternalServiceTermItemDto> {
    const term = await findServiceTerm(this.em, termId);
    if (term.isPublished) {
      throw new ApplicationError({ code: 'SERVICE_TERM_ALREADY_PUBLISHED', status: HttpStatus.CONFLICT, message: '이미 게시된 서비스 약관입니다.' });
    }
    term.publishedAt = new Date();
    return toInternalServiceTerm(term);
  }
}

async function findServiceTerm(em: AppEntityManager, termId: string): Promise<Term> {
  const term = await em.findOne(Term, { id: termId }, { populate: ['termGroup'], filters: false });
  if (!term || term.deletedAt) {
    throw new ApplicationError({ code: 'SERVICE_TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '서비스 약관을 찾을 수 없습니다.' });
  }
  return term;
}

function assertEditable(term: Term, message: string): void {
  if (term.isPublished) {
    throw new ApplicationError({ code: 'SERVICE_TERM_ALREADY_PUBLISHED', status: HttpStatus.CONFLICT, message });
  }
}

async function assertVersionAvailable(em: AppEntityManager, group: TermGroup, version: string, excludedTermId?: string): Promise<void> {
  const duplicate = await em.findOne(Term, {
    termGroup: group,
    version: version.trim(),
    ...(excludedTermId ? { id: { $ne: excludedTermId } } : {}),
  }, { filters: false });
  if (duplicate) {
    throw new ApplicationError({ code: 'SERVICE_TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT, message: '같은 약관 그룹에 동일한 버전이 이미 존재합니다.' });
  }
}

function parseFuturePublishDate(value?: string | null): Date | null {
  const publishedAt = value ? new Date(value) : null;
  if (publishedAt && publishedAt <= new Date()) {
    throw new ApplicationError({ code: 'SERVICE_TERM_PUBLISH_DATE_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
  }
  return publishedAt;
}
