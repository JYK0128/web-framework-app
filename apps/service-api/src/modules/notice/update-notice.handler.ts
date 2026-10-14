import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/core/database/entity-manager';
import { findNotice } from '#/modules/notice/notices.helpers';
import { UpdateNoticeCommand } from '#/modules/notice/update-notice.command';
import { UpdateNoticeResponseDto } from '#/modules/notice/update-notice.response.dto';

@Injectable()
@CommandHandler(UpdateNoticeCommand)
export class UpdateNoticeHandler implements ICommandHandler<UpdateNoticeCommand, UpdateNoticeResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ noticeId, input }: UpdateNoticeCommand): Promise<UpdateNoticeResponseDto> {
    const notice = await findNotice(this.em, noticeId);
    Object.assign(notice, input, input.title === undefined ? {} : { title: input.title.trim() }, input.content === undefined ? {} : { content: input.content.trim() });
    return UpdateNoticeResponseDto.parseEntity(notice);
  }
}
