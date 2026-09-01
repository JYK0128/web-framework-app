import { Query } from '@nestjs/cqrs';

import type { MessageTemplateItemDto } from '#/modules/message-templates/dto';

export interface GetMessageTemplateByIdPayload {
  id: string
}

export class GetMessageTemplateByIdQuery extends Query<MessageTemplateItemDto> {
  constructor(public readonly input: GetMessageTemplateByIdPayload) {
    super();
  }
}
