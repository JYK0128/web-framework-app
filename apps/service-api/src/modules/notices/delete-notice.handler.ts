import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/core/database/entity-manager';
import { DeleteNoticeCommand } from '#/modules/notices/delete-notice.command';
import { DeleteNoticeResponseDto } from '#/modules/notices/delete-notice.response.dto';
import { findNotice } from '#/modules/notices/notices.helpers';

@Injectable()
@CommandHandler(DeleteNoticeCommand)
export class DeleteNoticeHandler implements ICommandHandler<DeleteNoticeCommand, DeleteNoticeResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: DeleteNoticeCommand): Promise<DeleteNoticeResponseDto> {
    (await findNotice(this.em, input.noticeId)).deletedAt = new Date();
    return { ok: true };
  }
}
