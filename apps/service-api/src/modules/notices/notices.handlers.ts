import { type FilterQuery } from '@mikro-orm/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler, type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Notice, PublicationStatus } from '#/entities/notices/notice.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { NoticeActionResponseDto, NoticeCursorResponseDto, NoticeItemDto, NoticePageResponseDto } from './notices.dto';
import { CreateNoticeCommand, DeleteNoticeCommand, GetNoticeQuery, GetNoticesQuery, GetPublicNoticesQuery, UpdateNoticeCommand } from './notices.messages';

@Injectable()
@QueryHandler(GetNoticesQuery)
export class GetNoticesHandler implements IQueryHandler<GetNoticesQuery, NoticePageResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetNoticesQuery): Promise<NoticePageResponseDto> {
    const result = await this.em.findByPage<Notice>(Notice, input.toFilterQuery(), input.toPageOptions());
    return NoticePageResponseDto.fromPlain({ ...result, items: result.items.map((item) => NoticeItemDto.from(item)) });
  }
}

@Injectable()
@QueryHandler(GetNoticeQuery)
export class GetNoticeHandler implements IQueryHandler<GetNoticeQuery, NoticeItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ id, publicOnly }: GetNoticeQuery): Promise<NoticeItemDto> {
    const notice = await this.em.findOne(Notice, { id, ...(publicOnly ? { status: PublicationStatus.published } : {}) });
    if (!notice) throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    return NoticeItemDto.from(notice);
  }
}

@Injectable()
@CommandHandler(CreateNoticeCommand)
export class CreateNoticeHandler implements ICommandHandler<CreateNoticeCommand, NoticeItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: CreateNoticeCommand): Promise<NoticeItemDto> {
    const notice = this.em.create(Notice, { ...input, title: input.title.trim(), content: input.content.trim(), publishedAt: input.status === PublicationStatus.published ? new Date() : null });
    this.em.persist(notice);
    return NoticeItemDto.from(notice);
  }
}

@Injectable()
@CommandHandler(UpdateNoticeCommand)
export class UpdateNoticeHandler implements ICommandHandler<UpdateNoticeCommand, NoticeItemDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ id, input }: UpdateNoticeCommand): Promise<NoticeItemDto> {
    const notice = await findNotice(this.em, id);
    const wasPublished = notice.status === PublicationStatus.published;
    Object.assign(notice, input, input.title === undefined ? {} : { title: input.title.trim() }, input.content === undefined ? {} : { content: input.content.trim() });
    if (input.status === PublicationStatus.published && !wasPublished) notice.publishedAt = new Date();
    if (input.status === PublicationStatus.draft) notice.publishedAt = null;
    return NoticeItemDto.from(notice);
  }
}

@Injectable()
@CommandHandler(DeleteNoticeCommand)
export class DeleteNoticeHandler implements ICommandHandler<DeleteNoticeCommand, NoticeActionResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ id }: DeleteNoticeCommand): Promise<NoticeActionResponseDto> {
    (await findNotice(this.em, id)).deletedAt = new Date();
    return { ok: true };
  }
}

async function findNotice(em: AppEntityManager, id: string): Promise<Notice> {
  const notice = await em.findOne(Notice, { id }, { filters: false });
  if (!notice || notice.deletedAt) throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return notice;
}

@Injectable()
@QueryHandler(GetPublicNoticesQuery)
export class GetPublicNoticesHandler implements IQueryHandler<GetPublicNoticesQuery, NoticeCursorResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: GetPublicNoticesQuery): Promise<NoticeCursorResponseDto> {
    const filters: FilterQuery<Notice>[] = [input.toFilterQuery(), { status: PublicationStatus.published }];
    if (input.importance) filters.push({ importance: input.importance });
    const result = await this.em.findByCursor(Notice, {
      ...input.toCursorOptions(),
      where: { $and: filters },
      orderBy: { isPinned: 'DESC', importanceOrder: 'ASC', publicationOrder: 'DESC', id: 'ASC' },
    });
    return NoticeCursorResponseDto.fromPlain({ ...result, startCursor: result.startCursor, endCursor: result.endCursor, items: result.items.map((item) => NoticeItemDto.from(item)) });
  }
}
