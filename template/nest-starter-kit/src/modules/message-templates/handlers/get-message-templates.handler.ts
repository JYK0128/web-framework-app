import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { MessageTemplate } from '#/entities/templates/message-template.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
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

  private async identifyTemplates(filter: GetMessageTemplatesRequestDto): Promise<MessageTemplate[]> {
    const where: Record<string, unknown> = {};

    if (filter.channel) {
      where.channel = filter.channel;
    }

    if (filter.locale) {
      where.locale = filter.locale;
    }

    if (filter.search) {
      const s = `%${filter.search.trim()}%`;
      where.$or = [
        { code: { $ilike: s } },
        { name: { $ilike: s } },
        { title: { $ilike: s } },
      ];
    }

    return this.em.find(MessageTemplate, where, {
      filters: false,
      orderBy: { code: 'ASC', locale: 'ASC' },
    });
  }

  private process(templates: MessageTemplate[]): GetMessageTemplatesResponseDto {
    return {
      items: templates.map((t) => new MessageTemplateItemDto(t)),
      total: templates.length,
    };
  }
}
