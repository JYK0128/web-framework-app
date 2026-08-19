import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { isValid } from 'date-fns';

import { AppEntityManager } from '#/database/entity-manager';
import { Notice } from '#/entities/notices/notice.entity';
import { CreateNoticeCommand } from '#/modules/notices/commands/create-notice.command';
import { CreateNoticeRequestDto, NoticeItemDto } from '#/modules/notices/dto';
import { NoticeCreatedEvent } from '#/modules/notices/events';

interface NoticeDates {
  publishedAt: Date | null
  expiresAt: Date | null
}

@Injectable()
@CommandHandler(CreateNoticeCommand)
export class CreateNoticeHandler implements ICommandHandler<CreateNoticeCommand, NoticeItemDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateNoticeCommand): Promise<NoticeItemDto> {
    const dates = this.verifyDates(command.input);
    const result = await this.process(command.input, dates);
    return result;
  }

  private verifyDates(input: CreateNoticeRequestDto): NoticeDates {
    return {
      publishedAt: this.verifyDate(input.publishedAt),
      expiresAt: this.verifyDate(input.expiresAt),
    };
  }

  private verifyDate(value: Date | null | undefined): Date | null {
    if (value === undefined || value === null) return null;
    if (!isValid(value)) {
      throw new ApplicationError({ code: 'INVALID_PUBLISHED_AT', status: HttpStatus.BAD_REQUEST });
    }
    return value;
  }

  private async process(input: CreateNoticeRequestDto, dates: NoticeDates): Promise<NoticeItemDto> {
    const notice = this.em.create(Notice, {
      title: input.title.trim(),
      content: input.content.trim(),
      priority: (input.priority ?? 0),
      publishedAt: dates.publishedAt,
      expiresAt: dates.expiresAt,
    });
    this.em.persist(notice);
    this.eventBus.publish(new NoticeCreatedEvent(notice));

    return new NoticeItemDto(notice);
  }
}
