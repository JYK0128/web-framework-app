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
    const input = this.identify(command);
    this.verify(input);
    return this.process(input);
  }

  private identify(command: CreateNoticeCommand): CreateNoticeRequestDto {
    return {
      ...command.input,
      title: command.input.title.trim(),
      content: command.input.content.trim(),
    };
  }

  private verify(input: CreateNoticeRequestDto): void {
    if (!input.title || !input.content) {
      throw new Error('공지 제목과 내용은 필수입니다.');
    }
  }

  private async process(input: CreateNoticeRequestDto): Promise<CreateNoticeResponseDto> {
    const notice = this.em.create(Notice, {
      title: input.title,
      content: input.content,
      priority: input.priority ?? NoticePriority.LOW,
      publishedAt: input.publishedAt,
      expiresAt: input.expiresAt,
    });
    this.em.persist(notice);

    return new CreateNoticeResponseDto(notice);
  }
}
