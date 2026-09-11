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
    this.verify(templates);
    return this.process(templates);
  }

  private verify(templates: PageResult<MessageTemplate>): void {
    if (!Array.isArray(templates.items)) {
      throw new Error('메시지 템플릿 목록을 확인할 수 없습니다.');
    }
  }

  private async identifyTemplates(filter: GetMessageTemplatesRequestDto): Promise<PageResult<MessageTemplate>> {
    return this.em.findByPage(MessageTemplate, filter.toFilterQuery(), {
      ...filter.toPageOptions(),
      populate: ['channels'],
    });
  }

  private process(templates: PageResult<MessageTemplate>): GetMessageTemplatesResponseDto {
    return GetMessageTemplatesResponseDto.fromPlain({
      ...templates,
      items: templates.items.map((template) => MessageTemplateItemDto.fromPlain({
        id: template.id,
        code: template.code,
        name: template.name,
        variables: template.variables,
        description: template.description,
        isActive: template.isActive,
        channels: template.channels.getItems().map((channel) => ({
          id: channel.id,
          channel: channel.channel,
          title: channel.title,
          body: channel.body,
          priority: channel.priority,
          isActive: channel.isActive,
          extraConfig: channel.extraConfig,
          createdAt: channel.createdAt,
          updatedAt: channel.updatedAt,
        })),
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      })),
    });
  }
}
