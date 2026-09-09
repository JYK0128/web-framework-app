import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { MessageTemplate } from '#/entities/templates/message-template.entity';
import { MessageTemplateChannel } from '#/entities/templates/message-template-channel.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateMessageTemplateCommand } from '#/modules/message-templates/commands';
import { type UpdateMessageTemplateRequestDto, UpdateMessageTemplateResponseDto } from '#/modules/message-templates/dto';

@Injectable()
@CommandHandler(UpdateMessageTemplateCommand)
export class UpdateMessageTemplateHandler implements ICommandHandler<UpdateMessageTemplateCommand, UpdateMessageTemplateResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
  ) {}

  async execute(command: UpdateMessageTemplateCommand): Promise<UpdateMessageTemplateResponseDto> {
    const template = await this.identifyTemplate(command.input.id);
    await this.verify(template, command.input.input);
    return this.process(template, command.input.input);
  }

  private async identifyTemplate(id: string): Promise<MessageTemplate> {
    const template = await this.em.findOne(
      MessageTemplate,
      { id },
      { populate: ['channels'], filters: false },
    );
    if (!template) {
      throw new ApplicationError({
        code: 'TEMPLATE_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '수정할 메시지 템플릿을 찾을 수 없습니다.',
      });
    }
    return template;
  }

  private async verifyUniqueness(template: MessageTemplate, input: UpdateMessageTemplateRequestDto): Promise<void> {
    const code = input.code?.trim().toUpperCase() ?? template.code;
    const existing = await this.em.findOne(MessageTemplate, { code }, { filters: false });
    if (existing && existing.id !== template.id && !existing.deletedAt) {
      throw new ApplicationError({
        code: 'TEMPLATE_ALREADY_EXISTS',
        status: HttpStatus.CONFLICT,
        message: `이미 등록된 템플릿 코드입니다. (${code})`,
      });
    }
  }

  private verifyInput(input: UpdateMessageTemplateRequestDto): void {
    if (input.channels !== undefined) {
      if (input.channels.length === 0) {
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
  }

  private async verify(template: MessageTemplate, input: UpdateMessageTemplateRequestDto): Promise<void> {
    await this.verifyUniqueness(template, input);
    this.verifyInput(input);
  }

  private async process(template: MessageTemplate, input: UpdateMessageTemplateRequestDto): Promise<UpdateMessageTemplateResponseDto> {
    if (input.code !== undefined) {
      template.code = input.code.trim().toUpperCase();
    }
    if (input.name !== undefined) {
      template.name = input.name.trim();
    }
    if (input.isActive !== undefined) {
      template.isActive = input.isActive;
    }
    if (input.variables !== undefined) {
      template.variables = input.variables;
    }
    if (input.description !== undefined) {
      template.description = input.description?.trim() || null;
    }

    if (input.channels !== undefined) {
      this.syncChannels(template, input.channels);
    }

    await this.em.flush();
    return new UpdateMessageTemplateResponseDto(template);
  }

  private syncChannels(
    template: MessageTemplate,
    channels: NonNullable<UpdateMessageTemplateRequestDto['channels']>,
  ): void {
    const existingItems = template.channels.getItems();
    const existingMap = new Map(existingItems.map((c) => [c.channel, c]));
    const nextChannels = new Set(channels.map((c) => c.channel));

    // 1) 제거된 채널 정리
    for (const [ch, existing] of existingMap.entries()) {
      if (!nextChannels.has(ch)) {
        template.channels.remove(existing);
      }
    }

    // 2) 신규 추가 또는 기존 채널 내용 동기화
    for (const ch of channels) {
      const existing = existingMap.get(ch.channel);
      if (existing) {
        existing.title = ch.title?.trim() || null;
        existing.body = ch.body;
        existing.priority = ch.priority ?? 1;
        existing.isActive = ch.isActive ?? true;
        existing.extraConfig = ch.extraConfig ?? null;
      }
      else {
        const newChannel = this.em.create(MessageTemplateChannel, {
          template,
          channel: ch.channel,
          title: ch.title?.trim() || null,
          body: ch.body,
          priority: ch.priority ?? 1,
          isActive: ch.isActive ?? true,
          extraConfig: ch.extraConfig ?? null,
        });
        template.channels.add(newChannel);
      }
    }
  }
}
