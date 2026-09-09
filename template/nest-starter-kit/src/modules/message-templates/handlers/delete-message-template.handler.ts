import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SessionContext } from '#/common/contexts/session.context';
import { MessageTemplate } from '#/entities/templates/message-template.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { DeleteMessageTemplateCommand } from '#/modules/message-templates/commands';
import { DeleteMessageTemplateResponseDto } from '#/modules/message-templates/dto';

@Injectable()
@CommandHandler(DeleteMessageTemplateCommand)
export class DeleteMessageTemplateHandler implements ICommandHandler<DeleteMessageTemplateCommand, DeleteMessageTemplateResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly sessionContext: SessionContext,
  ) {}

  async execute(command: DeleteMessageTemplateCommand): Promise<DeleteMessageTemplateResponseDto> {
    const template = await this.identifyTemplate(command.input.id);
    this.verify(template);
    return this.process(template, this.sessionContext.requiredUser.id);
  }

  private verify(template: MessageTemplate): void {
    if (!template || template.deletedAt) {
      throw new ApplicationError({
        code: 'TEMPLATE_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '삭제할 메시지 템플릿을 찾을 수 없습니다.',
      });
    }
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

  private async process(template: MessageTemplate, deletedBy: string): Promise<DeleteMessageTemplateResponseDto> {
    template.deletedAt = new Date();
    template.deletedBy = deletedBy;

    await this.em.flush();
    return { ok: true };
  }
}
