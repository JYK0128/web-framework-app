import { Query } from '@nestjs/cqrs';

import { GetAdminTermGroupsRequestDto, type GetAdminTermGroupsResponseDto } from '#/modules/terms/dto';

export interface GetAdminTermGroupsPayload {
  query: GetAdminTermGroupsRequestDto
}

export class GetAdminTermGroupsQuery extends Query<GetAdminTermGroupsResponseDto> {
  constructor(public readonly input: GetAdminTermGroupsPayload = { query: new GetAdminTermGroupsRequestDto() }) {
    super();
  }
}
