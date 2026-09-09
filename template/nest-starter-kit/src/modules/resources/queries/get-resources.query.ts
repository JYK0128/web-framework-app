import { Query } from '@nestjs/cqrs';

import type { GetResourcesRequestDto, GetResourcesResponseDto } from '#/modules/resources/dto';

export class GetResourcesQuery extends Query<GetResourcesResponseDto> {
  constructor(public readonly input: GetResourcesRequestDto = {} as GetResourcesRequestDto) {
    super();
  }
}
