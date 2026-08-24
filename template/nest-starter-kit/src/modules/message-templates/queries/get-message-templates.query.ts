import { Query } from '@nestjs/cqrs';

import type { GetMessageTemplatesRequestDto, GetMessageTemplatesResponseDto } from '#/modules/message-templates/dto';

export class GetMessageTemplatesQuery extends Query<GetMessageTemplatesResponseDto> {
  constructor(public readonly input: GetMessageTemplatesRequestDto = new (class extends Object {})()) {
    super();
  }
}
