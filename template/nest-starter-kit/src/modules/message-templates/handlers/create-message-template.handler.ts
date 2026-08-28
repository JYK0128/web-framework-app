import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { MessageTemplate } from '#/entities/templates/message-template.entity';
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
    if (!input.body || input.body.trim().length === 0) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        status: HttpStatus.BAD_REQUEST,
        message: '본문 내용은 비어 있을 수 없습니다.',
      });
    }
  }

  private async process(input: CreateMessageTemplateRequestDto): Promise<CreateMessageTemplateResponseDto> {
    const template = this.em.create(MessageTemplate, {
      code: input.code.trim().toUpperCase(),
      channel: input.channel,
      name: input.name.trim(),
      title: input.title?.trim() || null,
      body: input.body,
      variables: input.variables ?? [],
      description: input.description?.trim() || null,
      isActive: input.isActive ?? true,
    });

    this.em.persist(template);
    return new CreateMessageTemplateResponseDto(template);
  }
}
