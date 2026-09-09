import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { Notice } from '#/entities/notices/notice.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteNoticeCommand } from '#/modules/notices/commands/delete-notice.command';
import { DeleteNoticeResponseDto } from '#/modules/notices/dto';

@Injectable()
@CommandHandler(DeleteNoticeCommand)
export class DeleteNoticeHandler implements ICommandHandler<DeleteNoticeCommand, DeleteNoticeResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: DeleteNoticeCommand): Promise<DeleteNoticeResponseDto> {
    const notice = await this.identifyNotice(command.input.id);
    this.verify(notice);
    return this.process(notice, this.sessionContext.requiredUser.id);
  }

  private verify(notice: Notice): void {
    if (!notice || notice.deletedAt) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
  }

  private async identifyNotice(id: string): Promise<Notice> {
    const notice = await this.em.findOne(Notice, { id }, { filters: false });
    if (!notice || notice.deletedAt) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return notice;
  }

  private async process(notice: Notice, deletedBy: string): Promise<DeleteNoticeResponseDto> {
    notice.deletedAt = new Date();
    notice.deletedBy = deletedBy;

    return { ok: true };
  }
}
