import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Notice } from '#/entities/notices/notice.entity';
import { DeleteNoticeCommand } from '#/modules/notices/commands/delete-notice.command';
import { NoticeItemDto } from '#/modules/notices/dto';

@Injectable()
@CommandHandler(DeleteNoticeCommand)
export class DeleteNoticeHandler implements ICommandHandler<DeleteNoticeCommand, NoticeItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteNoticeCommand): Promise<NoticeItemDto> {
    const notice = await this.identify(command.id);
    return this.process(notice, command.deletedBy);
  }

  private async identify(id: string): Promise<Notice> {
    const notice = await this.em.findOne(Notice, { id }, { filters: false });
    if (!notice || notice.deletedAt) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return notice;
  }

  private async process(notice: Notice, deletedBy?: string): Promise<NoticeItemDto> {
    notice.deletedAt = new Date();
    notice.deletedBy = deletedBy ?? null;

    return new NoticeItemDto(notice);
  }
}
