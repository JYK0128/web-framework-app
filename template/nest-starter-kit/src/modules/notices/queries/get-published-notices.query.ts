import { Query } from '@nestjs/cqrs';

import { GetPublishedNoticesRequestDto, type GetPublishedNoticesResponseDto } from '#/modules/notices/dto';

export interface GetPublishedNoticesPayload {
  query: GetPublishedNoticesRequestDto
}

export class GetPublishedNoticesQuery extends Query<GetPublishedNoticesResponseDto> {
  constructor(public readonly input: GetPublishedNoticesPayload = { query: new GetPublishedNoticesRequestDto() }) {
    super();
  }
}
