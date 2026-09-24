import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateAdminServiceTermCommand, DeleteAdminServiceTermCommand, PublishAdminServiceTermCommand, UpdateAdminServiceTermCommand } from '../commands';
import { AdminServiceTermItemDto } from '../dto';
import { toAdminServiceTerm } from './get-admin-service-terms.handler';

@Injectable()
@CommandHandler(CreateAdminServiceTermCommand)
export class CreateAdminServiceTermHandler implements ICommandHandler<CreateAdminServiceTermCommand, AdminServiceTermItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: CreateAdminServiceTermCommand): Promise<AdminServiceTermItemDto> {
    const group = await this.em.findOne(TermGroup, { id: input.groupId });
    if (!group) throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (await this.em.findOne(Term, { termGroup: group, version: input.version.trim() }, { filters: false })) throw new ApplicationError({ code: 'SERVICE_TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT, message: '같은 약관 그룹에 동일한 버전이 이미 존재합니다.' });
    const publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    if (publishedAt && publishedAt <= new Date()) throw new ApplicationError({ code: 'SERVICE_TERM_PUBLISH_DATE_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
    const term = this.em.create(Term, { termGroup: group, version: input.version.trim(), content: input.content.trim(), reason: input.reason.trim(), summary: input.summary.trim(), isNoticeRequired: input.isNoticeRequired, publishedAt });
    this.em.persist(term);
    return toAdminServiceTerm(term);
  }
}

@Injectable()
@CommandHandler(UpdateAdminServiceTermCommand)
export class UpdateAdminServiceTermHandler implements ICommandHandler<UpdateAdminServiceTermCommand, AdminServiceTermItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: UpdateAdminServiceTermCommand): Promise<AdminServiceTermItemDto> {
    const term = await this.em.findOne(Term, { id: input.termId }, { populate: ['termGroup'], filters: false });
    if (!term || term.deletedAt) throw new ApplicationError({ code: 'SERVICE_TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '서비스 약관을 찾을 수 없습니다.' });
    if (term.isPublished) throw new ApplicationError({ code: 'SERVICE_TERM_ALREADY_PUBLISHED', status: HttpStatus.CONFLICT, message: '게시된 서비스 약관은 수정할 수 없습니다.' });
    if (input.dto.groupId !== term.termGroup.id) throw new ApplicationError({ code: 'SERVICE_TERM_GROUP_MISMATCH', status: HttpStatus.BAD_REQUEST });
    if (input.dto.version.trim() !== term.version && await this.em.findOne(Term, { termGroup: term.termGroup, version: input.dto.version.trim(), id: { $ne: term.id } }, { filters: false })) throw new ApplicationError({ code: 'SERVICE_TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT, message: '같은 약관 그룹에 동일한 버전이 이미 존재합니다.' });
    const publishedAt = input.dto.publishedAt ? new Date(input.dto.publishedAt) : null;
    if (publishedAt && publishedAt <= new Date()) throw new ApplicationError({ code: 'SERVICE_TERM_PUBLISH_DATE_MUST_BE_FUTURE', status: HttpStatus.BAD_REQUEST });
    term.version = input.dto.version.trim(); term.content = input.dto.content.trim(); term.reason = input.dto.reason.trim(); term.summary = input.dto.summary.trim(); term.isNoticeRequired = input.dto.isNoticeRequired;
    if (input.dto.publishedAt !== undefined) term.publishedAt = publishedAt;
    return toAdminServiceTerm(term);
  }
}

@Injectable()
@CommandHandler(DeleteAdminServiceTermCommand)
export class DeleteAdminServiceTermHandler implements ICommandHandler<DeleteAdminServiceTermCommand, { success: boolean }> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ termId }: DeleteAdminServiceTermCommand): Promise<{ success: boolean }> {
    const term = await this.em.findOne(Term, { id: termId }, { filters: false });
    if (!term || term.deletedAt) throw new ApplicationError({ code: 'SERVICE_TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '서비스 약관을 찾을 수 없습니다.' });
    if (term.isPublished) throw new ApplicationError({ code: 'SERVICE_TERM_ALREADY_PUBLISHED', status: HttpStatus.CONFLICT, message: '게시된 서비스 약관은 삭제할 수 없습니다.' });
    term.deletedAt = new Date(); return { success: true };
  }
}

@Injectable()
@CommandHandler(PublishAdminServiceTermCommand)
export class PublishAdminServiceTermHandler implements ICommandHandler<PublishAdminServiceTermCommand, AdminServiceTermItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ termId }: PublishAdminServiceTermCommand): Promise<AdminServiceTermItemDto> {
    const term = await this.em.findOne(Term, { id: termId }, { populate: ['termGroup'], filters: false });
    if (!term || term.deletedAt) throw new ApplicationError({ code: 'SERVICE_TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND, message: '서비스 약관을 찾을 수 없습니다.' });
    if (term.isPublished) throw new ApplicationError({ code: 'SERVICE_TERM_ALREADY_PUBLISHED', status: HttpStatus.CONFLICT, message: '이미 게시된 서비스 약관입니다.' });
    term.publishedAt = new Date();
    return toAdminServiceTerm(term);
  }
}
