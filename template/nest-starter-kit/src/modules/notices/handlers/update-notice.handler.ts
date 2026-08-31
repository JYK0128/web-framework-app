import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Notice } from '#/entities/notices/notice.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateNoticeCommand } from '#/modules/notices/commands/update-notice.command';
import { UpdateNoticeRequestDto, UpdateNoticeResponseDto } from '#/modules/notices/dto';

@Injectable()
@CommandHandler(UpdateNoticeCommand)
export class UpdateNoticeHandler implements ICommandHandler<UpdateNoticeCommand, UpdateNoticeResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateNoticeCommand): Promise<UpdateNoticeResponseDto> {
    const notice = await this.identifyNotice(command.input.id);

    return this.process(notice, command.input.input);
  }

  private async identifyNotice(id: string): Promise<Notice> {
    const notice = await this.em.findOne(Notice, { id }, { filters: false });
    if (!notice || notice.deletedAt) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return notice;
  }

  private async process(notice: Notice, input: UpdateNoticeRequestDto): Promise<UpdateNoticeResponseDto> {
    if (input.title !== undefined) notice.title = input.title.trim();
    if (input.content !== undefined) notice.content = input.content.trim();
    if (input.priority !== undefined) notice.priority = input.priority;
    if (input.publishedAt !== undefined) notice.publishedAt = input.publishedAt;
    if (input.expiresAt !== undefined) notice.expiresAt = input.expiresAt;

    return new UpdateNoticeResponseDto(notice);
  }
}
