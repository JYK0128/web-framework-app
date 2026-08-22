import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Notice } from '#/entities/notices/notice.entity';
import { NoticeRead } from '#/entities/notices/notice-read.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { MarkNoticeReadCommand } from '#/modules/notices/commands/mark-notice-read.command';
import { MarkNoticeReadResponseDto } from '#/modules/notices/dto';

@Injectable()
@CommandHandler(MarkNoticeReadCommand)
export class MarkNoticeReadHandler implements ICommandHandler<MarkNoticeReadCommand, MarkNoticeReadResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: MarkNoticeReadCommand): Promise<MarkNoticeReadResponseDto> {
    const notice = await this.identifyNotice(command.input.id);
    const existingRead = await this.em.findOne(NoticeRead, {
      user: command.input.userId,
      notice: notice.id,
    });

    if (!existingRead) {
      const read = this.em.create(NoticeRead, { user: command.input.userId, notice: notice.id });
      this.em.persist(read);
    }

    return { ok: true };
  }

  private async identifyNotice(id: string): Promise<Notice> {
    const notice = await this.em.findOne(Notice, { id }, { filters: false });
    if (!notice || notice.deletedAt || !notice.isPublished) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return notice;
  }
}
