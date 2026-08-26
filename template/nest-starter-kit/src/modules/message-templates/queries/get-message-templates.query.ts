import { Query } from '@nestjs/cqrs';

import { GetMessageTemplatesRequestDto, type GetMessageTemplatesResponseDto } from '#/modules/message-templates/dto';

export class GetMessageTemplatesQuery extends Query<GetMessageTemplatesResponseDto> {
  constructor(public readonly input: GetMessageTemplatesRequestDto = new GetMessageTemplatesRequestDto()) {
    super();
  }
}
