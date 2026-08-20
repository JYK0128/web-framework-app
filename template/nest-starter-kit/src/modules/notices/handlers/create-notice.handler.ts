import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';

import { AppEntityManager } from '#/database/entity-manager';
import { Notice } from '#/entities/notices/notice.entity';
import { CreateNoticeCommand } from '#/modules/notices/commands/create-notice.command';
import { CreateNoticeRequestDto, NoticeItemDto } from '#/modules/notices/dto';
import { NoticeCreatedEvent } from '#/modules/notices/events';

@Injectable()
@CommandHandler(CreateNoticeCommand)
export class CreateNoticeHandler implements ICommandHandler<CreateNoticeCommand, NoticeItemDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateNoticeCommand): Promise<NoticeItemDto> {
    const result = await this.process(command.input);
    return result;
  }

  private async process(input: CreateNoticeRequestDto): Promise<NoticeItemDto> {
    const notice = this.em.create(Notice, {
      title: input.title.trim(),
      content: input.content.trim(),
      priority: (input.priority ?? 0),
      publishedAt: input.publishedAt,
      expiresAt: input.expiresAt,
    });
    this.em.persist(notice);
    this.eventBus.publish(new NoticeCreatedEvent(notice));

    return new NoticeItemDto(notice);
  }
}
