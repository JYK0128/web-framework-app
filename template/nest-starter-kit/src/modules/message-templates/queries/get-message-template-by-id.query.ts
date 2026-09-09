import { Query } from '@nestjs/cqrs';

import type { GetMessageTemplateResponseDto } from '#/modules/message-templates/dto';

export interface GetMessageTemplateByIdPayload {
  id: string
}

export class GetMessageTemplateByIdQuery extends Query<GetMessageTemplateResponseDto> {
  constructor(public readonly input: GetMessageTemplateByIdPayload) {
    super();
  }
}
