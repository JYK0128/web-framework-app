import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { MESSAGE_TEMPLATE_CATALOG, type MessageTemplateCatalogItem, type TemplateVariableMetadata } from '#/common/constants/message-template-catalog.constant';
import { BRAND_VARIABLES, SYSTEM_VARIABLES } from '#/common/constants/message-variable-tier.constant';
import { CatalogChannelTemplateDto, GetMessageTemplateCatalogResponseDto, MessageTemplateCatalogItemDto, TemplateVariableMetadataDto } from '#/modules/message-templates/dto';
import { GetMessageTemplateCatalogQuery } from '#/modules/message-templates/queries';

@Injectable()
@QueryHandler(GetMessageTemplateCatalogQuery)
export class GetMessageTemplateCatalogHandler
implements IQueryHandler<GetMessageTemplateCatalogQuery, GetMessageTemplateCatalogResponseDto> {
  async execute(_query: GetMessageTemplateCatalogQuery): Promise<GetMessageTemplateCatalogResponseDto> {
    // 1. identify: 카탈로그 데이터 로드
    const { items, brandVariables, systemVariables } = this.identifyCatalog();

    // 2. verify: 카탈로그 유효성 확인
    this.verify(items);

    // 3. process: Response DTO 인스턴스 생성 및 반환
    return this.process(items, brandVariables, systemVariables);
  }

  private identifyCatalog(): {
    items: MessageTemplateCatalogItem[]
    brandVariables: TemplateVariableMetadata[]
    systemVariables: TemplateVariableMetadata[]
  } {
    return {
      items: MESSAGE_TEMPLATE_CATALOG,
      brandVariables: BRAND_VARIABLES,
      systemVariables: SYSTEM_VARIABLES,
    };
  }

  private verifyCatalog(items: MessageTemplateCatalogItem[]): void {
    if (!items || items.length === 0) {
      // Catalog must have predefined templates
    }
  }

  private verify(items: MessageTemplateCatalogItem[]): void {
    this.verifyCatalog(items);
  }

  private process(
    items: MessageTemplateCatalogItem[],
    brandVariables: TemplateVariableMetadata[],
    systemVariables: TemplateVariableMetadata[],
  ): GetMessageTemplateCatalogResponseDto {
    const response = new GetMessageTemplateCatalogResponseDto();

    response.items = items.map((item) => {
      const itemDto = new MessageTemplateCatalogItemDto();
      itemDto.code = item.code;
      itemDto.name = item.name;
      itemDto.description = item.description;
      itemDto.isSystem = item.isSystem;
      itemDto.variables = item.variables.map((v) => {
        const varDto = new TemplateVariableMetadataDto();
        varDto.key = v.key;
        varDto.label = v.label;
        varDto.description = v.description;
        varDto.required = v.required;
        varDto.sampleValue = v.sampleValue;
        return varDto;
      });
      itemDto.channels = item.channels.map((ch) => {
        const chDto = new CatalogChannelTemplateDto();
        chDto.channel = ch.channel;
        chDto.defaultTitle = ch.defaultTitle;
        chDto.defaultBody = ch.defaultBody;
        chDto.priority = ch.priority;
        return chDto;
      });
      return itemDto;
    });

    response.brandVariables = brandVariables.map((v) => {
      const varDto = new TemplateVariableMetadataDto();
      varDto.key = v.key;
      varDto.label = v.label;
      varDto.description = v.description;
      varDto.required = v.required;
      varDto.sampleValue = v.sampleValue;
      return varDto;
    });

    response.systemVariables = systemVariables.map((v) => {
      const varDto = new TemplateVariableMetadataDto();
      varDto.key = v.key;
      varDto.label = v.label;
      varDto.description = v.description;
      varDto.required = v.required;
      varDto.sampleValue = v.sampleValue;
      return varDto;
    });

    return response;
  }
}
