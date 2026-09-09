import { Query } from '@nestjs/cqrs';

import type { GetNoticesRequestDto, GetNoticesResponseDto } from '#/modules/notices/dto';

export class GetPublishedNoticesQuery extends Query<GetNoticesResponseDto> {
  constructor(public readonly input: GetNoticesRequestDto = {} as GetNoticesRequestDto) {
    super();
  }
}
