import { Query } from '@nestjs/cqrs';

import type { GetMessageTemplateByIdResponseDto } from '#/modules/message-templates/dto';

export interface GetMessageTemplateByIdPayload {
  messageTemplateId: string
}

export class GetMessageTemplateByIdQuery extends Query<GetMessageTemplateByIdResponseDto> {
  constructor(public readonly input: GetMessageTemplateByIdPayload) {
    super();
  }
}
