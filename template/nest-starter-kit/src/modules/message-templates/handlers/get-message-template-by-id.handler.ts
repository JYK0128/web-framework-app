import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { MessageTemplate } from '#/entities/templates/message-template.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { MessageTemplateItemDto } from '#/modules/message-templates/dto';
import { GetMessageTemplateByIdQuery } from '#/modules/message-templates/queries';

@Injectable()
@QueryHandler(GetMessageTemplateByIdQuery)
export class GetMessageTemplateByIdHandler implements IQueryHandler<GetMessageTemplateByIdQuery, MessageTemplateItemDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetMessageTemplateByIdQuery): Promise<MessageTemplateItemDto> {
    const template = await this.identifyTemplate(query.input.id);
    return this.process(template);
  }

  private async identifyTemplate(id: string): Promise<MessageTemplate> {
    const template = await this.em.findOne(MessageTemplate, { id }, { filters: false });
    if (!template) {
      throw new ApplicationError({
        code: 'TEMPLATE_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '메시지 템플릿을 찾을 수 없습니다.',
      });
    }
    return template;
  }

  private process(template: MessageTemplate): MessageTemplateItemDto {
    return new MessageTemplateItemDto(template);
  }
}
