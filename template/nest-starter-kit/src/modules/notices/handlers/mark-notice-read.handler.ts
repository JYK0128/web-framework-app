import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Notice } from '#/entities/notices/notice.entity';
import { NoticeRead } from '#/entities/notices/notice-read.entity';
import { MarkNoticeReadCommand } from '#/modules/notices/commands/mark-notice-read.command';
import { MarkNoticeReadResponseDto } from '#/modules/notices/dto';

@Injectable()
@CommandHandler(MarkNoticeReadCommand)
export class MarkNoticeReadHandler implements ICommandHandler<MarkNoticeReadCommand, MarkNoticeReadResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: MarkNoticeReadCommand): Promise<MarkNoticeReadResponseDto> {
    const notice = await this.identifyNotice(command.input.id);
    const read = await this.identifyRead(command.input.userId, notice.id);

    return this.process(command.input.userId, notice.id, read);
  }

  private async identifyNotice(id: string): Promise<Notice> {
    const notice = await this.em.findOne(Notice, { id }, { filters: false });
    if (!notice || notice.deletedAt || !notice.isPublished) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return notice;
  }

  private async identifyRead(userId: string, noticeId: string): Promise<NoticeRead | null> {
    return this.em.findOne(NoticeRead, { user: userId, notice: noticeId });
  }

  private async process(
    userId: string,
    noticeId: string,
    existingRead: NoticeRead | null,
  ): Promise<MarkNoticeReadResponseDto> {
    let read = existingRead;
    if (!read) {
      read = this.em.create(NoticeRead, { user: userId, notice: noticeId });
      this.em.persist(read);
    }

    const response = new MarkNoticeReadResponseDto();
    response.isRead = true;
    response.readAt = read.readAt;
    return response;
  }
}
