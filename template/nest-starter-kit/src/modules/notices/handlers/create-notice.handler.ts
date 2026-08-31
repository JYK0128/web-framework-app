import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { Notice, NoticePriority } from '#/entities/notices/notice.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateNoticeCommand } from '#/modules/notices/commands/create-notice.command';
import { CreateNoticeRequestDto, CreateNoticeResponseDto } from '#/modules/notices/dto';

@Injectable()
@CommandHandler(CreateNoticeCommand)
export class CreateNoticeHandler implements ICommandHandler<CreateNoticeCommand, CreateNoticeResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
  ) {}

  async execute(command: CreateNoticeCommand): Promise<CreateNoticeResponseDto> {
    const result = await this.process(command.input);
    return result;
  }

  private async process(input: CreateNoticeRequestDto): Promise<CreateNoticeResponseDto> {
    const notice = this.em.create(Notice, {
      title: input.title.trim(),
      content: input.content.trim(),
      priority: input.priority ?? NoticePriority.LOW,
      publishedAt: input.publishedAt,
      expiresAt: input.expiresAt,
    });
    this.em.persist(notice);

    return new CreateNoticeResponseDto(notice);
  }
}
