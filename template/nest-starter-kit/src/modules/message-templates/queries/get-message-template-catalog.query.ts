import { Query } from '@nestjs/cqrs';

import { GetMessageTemplateCatalogRequestDto, type GetMessageTemplateCatalogResponseDto } from '#/modules/message-templates/dto';

export class GetMessageTemplateCatalogQuery extends Query<GetMessageTemplateCatalogResponseDto> {
  constructor(public readonly input: GetMessageTemplateCatalogRequestDto = new GetMessageTemplateCatalogRequestDto()) {
    super();
  }
}
