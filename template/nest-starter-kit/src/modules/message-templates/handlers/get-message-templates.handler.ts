import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { MessageTemplate } from '#/entities/templates/message-template.entity';
import { AppEntityManager, type PageResult } from '#/infra/database/entity-manager';
import { type GetMessageTemplatesRequestDto, GetMessageTemplatesResponseDto, MessageTemplateItemDto } from '#/modules/message-templates/dto';
import { GetMessageTemplatesQuery } from '#/modules/message-templates/queries';

@Injectable()
@QueryHandler(GetMessageTemplatesQuery)
export class GetMessageTemplatesHandler implements IQueryHandler<GetMessageTemplatesQuery, GetMessageTemplatesResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetMessageTemplatesQuery): Promise<GetMessageTemplatesResponseDto> {
    const templates = await this.identifyTemplates(query.input);
    return this.process(templates);
  }

  private async identifyTemplates(filter: GetMessageTemplatesRequestDto): Promise<PageResult<MessageTemplate>> {
    return this.em.findByPage(MessageTemplate, filter.toFilterQuery(), {
      ...filter.toPageOptions(),
      filters: false,
    });
  }

  private process(templates: PageResult<MessageTemplate>): GetMessageTemplatesResponseDto {
    return {
      ...templates,
      items: templates.items.map((t) => new MessageTemplateItemDto(t)),
    };
  }
}
