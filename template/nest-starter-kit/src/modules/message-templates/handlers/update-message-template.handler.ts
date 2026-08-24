import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { MessageTemplate } from '#/entities/templates/message-template.entity';
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
    this.verifyInput(command.input.input);
    return this.process(template, command.input.input);
  }

  private async identifyTemplate(id: string): Promise<MessageTemplate> {
    const template = await this.em.findOne(MessageTemplate, { id }, { filters: false });
    if (!template) {
      throw new ApplicationError({
        code: 'TEMPLATE_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '수정할 메시지 템플릿을 찾을 수 없습니다.',
      });
    }
    return template;
  }

  private verifyInput(input: UpdateMessageTemplateRequestDto): void {
    if (input.body !== undefined && input.body.trim().length === 0) {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        status: HttpStatus.BAD_REQUEST,
        message: '본문 내용은 비어 있을 수 없습니다.',
      });
    }
  }

  private async process(template: MessageTemplate, input: UpdateMessageTemplateRequestDto): Promise<UpdateMessageTemplateResponseDto> {
    if (input.title !== undefined) {
      template.title = input.title;
    }
    if (input.body !== undefined) {
      template.body = input.body;
    }
    if (input.isActive !== undefined) {
      template.isActive = input.isActive;
    }

    await this.em.flush();
    return new UpdateMessageTemplateResponseDto(template);
  }
}
