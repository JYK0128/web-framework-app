import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { Notice } from '#/core/database/entities/notices';
import { AppEntityManager } from '#/core/database/entity-manager';
import { CreateNoticeCommand } from '#/modules/notice/create-notice.command';
import { CreateNoticeResponseDto } from '#/modules/notice/create-notice.response.dto';

@Injectable()
@CommandHandler(CreateNoticeCommand)
export class CreateNoticeHandler implements ICommandHandler<CreateNoticeCommand, CreateNoticeResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute({ input }: CreateNoticeCommand): Promise<CreateNoticeResponseDto> {
    const notice = this.em.create(Notice, { ...input, title: input.title.trim(), content: input.content.trim(), publishedAt: input.publishedAt ?? null });
    this.em.persist(notice);
    return CreateNoticeResponseDto.parseEntity(notice);
  }
}
