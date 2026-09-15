import { Query } from '@nestjs/cqrs';

import { GetMessageTemplatesRequestDto, type GetMessageTemplatesResponseDto } from '#/modules/message-templates/dto';

export interface GetMessageTemplatesPayload {
  query: GetMessageTemplatesRequestDto
}

export class GetMessageTemplatesQuery extends Query<GetMessageTemplatesResponseDto> {
  constructor(public readonly input: GetMessageTemplatesPayload = { query: new GetMessageTemplatesRequestDto() }) {
    super();
  }
}
