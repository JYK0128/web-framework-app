import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Notice } from '#/entities/notices/notice.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteNoticeCommand } from '#/modules/notices/commands/delete-notice.command';
import { DeleteNoticeResponseDto } from '#/modules/notices/dto';

@Injectable()
@CommandHandler(DeleteNoticeCommand)
export class DeleteNoticeHandler implements ICommandHandler<DeleteNoticeCommand, DeleteNoticeResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteNoticeCommand): Promise<DeleteNoticeResponseDto> {
    const notice = await this.identifyNotice(command.input.id);
    return this.process(notice, command.input.deletedBy);
  }

  private async identifyNotice(id: string): Promise<Notice> {
    const notice = await this.em.findOne(Notice, { id }, { filters: false });
    if (!notice || notice.deletedAt) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return notice;
  }

  private async process(notice: Notice, deletedBy?: string): Promise<DeleteNoticeResponseDto> {
    notice.deletedAt = new Date();
    notice.deletedBy = deletedBy ?? null;

    return { ok: true };
  }
}
