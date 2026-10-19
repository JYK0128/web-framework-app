import { Query } from '@nestjs/cqrs';

import { GetResourcesRequestDto, type GetResourcesResponseDto } from '#/modules/resources/dto';

export interface GetResourcesPayload {
  query: GetResourcesRequestDto
}

export class GetResourcesQuery extends Query<GetResourcesResponseDto> {
  constructor(public readonly input: GetResourcesPayload = { query: new GetResourcesRequestDto() }) {
    super();
  }
}
