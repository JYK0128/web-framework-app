import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { isValid } from 'date-fns';

import { AppEntityManager } from '#/database/entity-manager';
import { Notice } from '#/entities/notices/notice.entity';
import { UpdateNoticeCommand } from '#/modules/notices/commands/update-notice.command';
import { NoticeItemDto, UpdateNoticeRequestDto } from '#/modules/notices/dto';

interface NoticeDates {
  publishedAt?: Date | null
  expiresAt?: Date | null
}

@Injectable()
@CommandHandler(UpdateNoticeCommand)
export class UpdateNoticeHandler implements ICommandHandler<UpdateNoticeCommand, NoticeItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: UpdateNoticeCommand): Promise<NoticeItemDto> {
    const notice = await this.identify(command.id);
    const dates = this.verifyDates(command.input);

    return this.process(notice, command.input, dates);
  }

  private async identify(id: string): Promise<Notice> {
    const notice = await this.em.findOne(Notice, { id }, { filters: false });
    if (!notice || notice.deletedAt) {
      throw new ApplicationError({ code: 'NOTICE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    return notice;
  }

  private verifyDates(input: UpdateNoticeRequestDto): NoticeDates {
    return {
      publishedAt: input.publishedAt !== undefined ? this.verifyDate(input.publishedAt) : undefined,
      expiresAt: input.expiresAt !== undefined ? this.verifyDate(input.expiresAt) : undefined,
    };
  }

  private verifyDate(value: Date | null | undefined): Date | null {
    if (value === undefined || value === null) return null;
    if (!isValid(value)) {
      throw new ApplicationError({ code: 'INVALID_PUBLISHED_AT', status: HttpStatus.BAD_REQUEST });
    }
    return value;
  }

  private async process(notice: Notice, input: UpdateNoticeRequestDto, dates: NoticeDates): Promise<NoticeItemDto> {
    if (input.title !== undefined) notice.title = input.title.trim();
    if (input.content !== undefined) notice.content = input.content.trim();
    if (input.isPinned !== undefined) notice.isPinned = input.isPinned;
    if (input.priority !== undefined) notice.priority = input.priority;
    if (dates.publishedAt !== undefined) notice.publishedAt = dates.publishedAt;
    if (dates.expiresAt !== undefined) notice.expiresAt = dates.expiresAt;

    return new NoticeItemDto(notice);
  }
}
