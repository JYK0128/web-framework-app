import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { MessageTemplate } from '#/entities/templates/message-template.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteMessageTemplateCommand } from '#/modules/message-templates/commands';
import { DeleteMessageTemplateResponseDto } from '#/modules/message-templates/dto';

@Injectable()
@CommandHandler(DeleteMessageTemplateCommand)
export class DeleteMessageTemplateHandler implements ICommandHandler<DeleteMessageTemplateCommand, DeleteMessageTemplateResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: DeleteMessageTemplateCommand): Promise<DeleteMessageTemplateResponseDto> {
    const template = await this.identifyTemplate(command.input.id);
    return this.process(template, command.input.deletedBy);
  }

  private async identifyTemplate(id: string): Promise<MessageTemplate> {
    const template = await this.em.findOne(MessageTemplate, { id }, { filters: false });
    if (!template || template.deletedAt) {
      throw new ApplicationError({
        code: 'TEMPLATE_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '삭제할 메시지 템플릿을 찾을 수 없습니다.',
      });
    }
    return template;
  }

  private async process(template: MessageTemplate, deletedBy?: string): Promise<DeleteMessageTemplateResponseDto> {
    template.deletedAt = new Date();
    template.deletedBy = deletedBy ?? null;

    await this.em.flush();
    return { ok: true };
  }
}
