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
    let group = await this.em.findOne(TermGroup, { code: input.code.trim() }, { filters: false });
    if (!group) { group = this.em.create(TermGroup, { code: input.code.trim(), title: input.title.trim(), isRequired: input.isRequired, sortOrder: input.sortOrder }); this.em.persist(group); }
    else { group.title = input.title.trim(); group.isRequired = input.isRequired; group.sortOrder = input.sortOrder; }
    if (await this.em.findOne(Term, { termGroup: group, version: input.version.trim() }, { filters: false })) throw new ApplicationError({ code: 'SERVICE_TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT, message: '같은 약관 그룹에 동일한 버전이 이미 존재합니다.' });
    const term = this.em.create(Term, { termGroup: group, version: input.version.trim(), content: input.content.trim(), publishedAt: null });
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
    if (input.dto.version.trim() !== term.version && await this.em.findOne(Term, { termGroup: term.termGroup, version: input.dto.version.trim(), id: { $ne: term.id } }, { filters: false })) throw new ApplicationError({ code: 'SERVICE_TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT, message: '같은 약관 그룹에 동일한 버전이 이미 존재합니다.' });
    term.termGroup.title = input.dto.title.trim(); term.termGroup.isRequired = input.dto.isRequired; term.termGroup.sortOrder = input.dto.sortOrder;
    term.version = input.dto.version.trim(); term.content = input.dto.content.trim(); term.publishedAt = null;
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
