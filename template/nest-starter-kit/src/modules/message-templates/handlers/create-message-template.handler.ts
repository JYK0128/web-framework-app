import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { MessageTemplate } from '#/entities/templates/message-template.entity';
import { MessageTemplateChannel } from '#/entities/templates/message-template-channel.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CreateMessageTemplateCommand } from '#/modules/message-templates/commands';
import { type CreateMessageTemplateRequestDto, CreateMessageTemplateResponseDto } from '#/modules/message-templates/dto';

@Injectable()
@CommandHandler(CreateMessageTemplateCommand)
export class CreateMessageTemplateHandler implements ICommandHandler<CreateMessageTemplateCommand, CreateMessageTemplateResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
  ) {}

  async execute(command: CreateMessageTemplateCommand): Promise<CreateMessageTemplateResponseDto> {
    await this.verifyUniqueness(command.input.input);
    this.verifyInput(command.input.input);
    return this.process(command.input.input);
  }

  private async verifyUniqueness(input: CreateMessageTemplateRequestDto): Promise<void> {
    const code = input.code.trim().toUpperCase();
    const existing = await this.em.findOne(MessageTemplate, { code }, { filters: false });
    if (existing && !existing.deletedAt) {
      throw new ApplicationError({
        code: 'TEMPLATE_ALREADY_EXISTS',
        status: HttpStatus.CONFLICT,
        message: `이미 등록된 템플릿 코드입니다. (${code})`,
      });
    }
  }

  private verifyInput(input: CreateMessageTemplateRequestDto): void {
    if (!input.channels || input.channels.length === 0) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        status: HttpStatus.BAD_REQUEST,
        message: '최소 1개 이상의 발송 채널 템플릿이 필요합니다.',
      });
    }

    const channelSet = new Set<string>();
    for (const ch of input.channels) {
      if (channelSet.has(ch.channel)) {
        throw new ApplicationError({
          code: 'VALIDATION_ERROR',
          status: HttpStatus.BAD_REQUEST,
          message: `동일한 채널(${ch.channel})이 중복 정의되었습니다.`,
        });
      }
      channelSet.add(ch.channel);

      if (!ch.body || ch.body.trim().length === 0) {
        throw new ApplicationError({
          code: 'VALIDATION_ERROR',
          status: HttpStatus.BAD_REQUEST,
          message: `${ch.channel} 채널의 본문 내용은 비어 있을 수 없습니다.`,
        });
      }
    }
  }

  private async process(input: CreateMessageTemplateRequestDto): Promise<CreateMessageTemplateResponseDto> {
    const template = this.em.create(MessageTemplate, {
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      variables: input.variables ?? [],
      description: input.description?.trim() || null,
      isActive: input.isActive ?? true,
    });

    for (const ch of input.channels) {
      const channelEntity = this.em.create(MessageTemplateChannel, {
        template,
        channel: ch.channel,
        title: ch.title?.trim() || null,
        body: ch.body,
        priority: ch.priority ?? 1,
        isActive: ch.isActive ?? true,
        extraConfig: ch.extraConfig ?? null,
      });
      template.channels.add(channelEntity);
    }

    this.em.persist(template);
    return new CreateMessageTemplateResponseDto(template);
  }
}
