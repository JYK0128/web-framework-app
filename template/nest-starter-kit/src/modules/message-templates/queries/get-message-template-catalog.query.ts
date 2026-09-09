import { Query } from '@nestjs/cqrs';

import type { GetMessageTemplateCatalogResponseDto } from '#/modules/message-templates/dto';

export class GetMessageTemplateCatalogQuery extends Query<GetMessageTemplateCatalogResponseDto> {}
